import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes the SHA-256 hash for an audit log entry content
 */
export const computeAuditHash = ({ sequenceNumber, timestamp, action, performedBy, details, previousHash }) => {
  const timeStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const userIdStr = performedBy ? performedBy.toString() : 'SYSTEM';
  const detailsStr = typeof details === 'string' ? details : JSON.stringify(details || {});

  const payload = `${sequenceNumber}|${timeStr}|${action}|${userIdStr}|${detailsStr}|${previousHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Appends a new tamper-evident audit log entry to the hash chain
 */
export const recordAuditEvent = async ({
  action,
  caseId = null,
  performedBy = null,
  performedByName = 'System',
  performedByEmail = null,
  role = 'system',
  ipAddress = '127.0.0.1',
  userAgent = 'Internal',
  details = {}
}) => {
  try {
    // Find the latest audit record to get previousHash and sequenceNumber
    const latestLog = await AuditLog.findOne().sort({ sequenceNumber: -1 }).lean();

    const sequenceNumber = latestLog ? latestLog.sequenceNumber + 1 : 1;
    const previousHash = latestLog ? latestLog.hash : GENESIS_HASH;
    const timestamp = new Date();

    const hash = computeAuditHash({
      sequenceNumber,
      timestamp,
      action,
      performedBy,
      details,
      previousHash
    });

    // Use native collection or Model.collection to ensure append without mongoose update hooks
    const logDoc = new AuditLog({
      sequenceNumber,
      action,
      caseId,
      performedBy,
      performedByName,
      performedByEmail,
      role,
      ipAddress,
      userAgent,
      details,
      previousHash,
      hash,
      timestamp
    });

    await logDoc.save();
    return logDoc;
  } catch (error) {
    console.error('Failed to write audit log event:', error);
    // Even if audit log write fails, don't crash main transaction unless critical
    return null;
  }
};

/**
 * Verifies the integrity of the entire audit chain
 * Recomputes hash for every record and confirms previousHash linkage
 */
export const verifyAuditChainIntegrity = async () => {
  const allLogs = await AuditLog.find().sort({ sequenceNumber: 1 }).lean();

  if (allLogs.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      message: 'Audit trail is empty. No entries to verify.',
      verifiedAt: new Date()
    };
  }

  for (let i = 0; i < allLogs.length; i++) {
    const current = allLogs[i];

    // Check sequence number continuity
    const expectedSequence = i + 1;
    if (current.sequenceNumber !== expectedSequence) {
      return {
        isValid: false,
        brokenAtSequence: current.sequenceNumber,
        expectedSequence,
        error: `Sequence numbering anomaly detected at entry ${current.sequenceNumber}`,
        verifiedAt: new Date()
      };
    }

    // Check previousHash linkage
    if (i === 0) {
      if (current.previousHash !== GENESIS_HASH) {
        return {
          isValid: false,
          brokenAtSequence: current.sequenceNumber,
          error: `Genesis entry has invalid previousHash: expected ${GENESIS_HASH}, got ${current.previousHash}`,
          verifiedAt: new Date()
        };
      }
    } else {
      const prev = allLogs[i - 1];
      if (current.previousHash !== prev.hash) {
        return {
          isValid: false,
          brokenAtSequence: current.sequenceNumber,
          error: `Chain broken at sequence ${current.sequenceNumber}: previousHash does not match entry ${prev.sequenceNumber} hash`,
          verifiedAt: new Date()
        };
      }
    }

    // Recompute current entry hash
    const expectedHash = computeAuditHash({
      sequenceNumber: current.sequenceNumber,
      timestamp: current.timestamp,
      action: current.action,
      performedBy: current.performedBy,
      details: current.details,
      previousHash: current.previousHash
    });

    if (current.hash !== expectedHash) {
      return {
        isValid: false,
        brokenAtSequence: current.sequenceNumber,
        error: `Data tampering detected at sequence ${current.sequenceNumber}: stored hash (${current.hash}) does not match computed hash (${expectedHash})`,
        verifiedAt: new Date()
      };
    }
  }

  return {
    isValid: true,
    totalEntries: allLogs.length,
    headHash: allLogs[allLogs.length - 1].hash,
    message: `Audit chain verified successfully! All ${allLogs.length} entries have intact cryptographic links.`,
    verifiedAt: new Date()
  };
};
