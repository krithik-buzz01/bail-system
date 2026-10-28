import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AuditLog from '../models/AuditLog.js';
import { recordAuditEvent, verifyAuditChainIntegrity, GENESIS_HASH } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await AuditLog.collection.deleteMany({});
});

describe('Feature 6: Tamper-Evident Hash-Chained Audit Trail Tests', () => {
  test('Test 1: Empty audit trail verifies as valid', async () => {
    const report = await verifyAuditChainIntegrity();
    expect(report.isValid).toBe(true);
    expect(report.totalEntries).toBe(0);
  });

  test('Test 2: Successive audit entries establish intact cryptographic hash chain', async () => {
    const entry1 = await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_REGISTER,
      performedByName: 'Citizen Test',
      details: { email: 'citizen@test.com' }
    });

    const entry2 = await recordAuditEvent({
      action: AUDIT_ACTIONS.CASE_CREATE,
      performedByName: 'Citizen Test',
      details: { caseNumber: 'BR-2026-001' }
    });

    const entry3 = await recordAuditEvent({
      action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
      performedByName: 'Citizen Test',
      details: { doc: 'FIR_COPY.pdf' }
    });

    expect(entry1.sequenceNumber).toBe(1);
    expect(entry1.previousHash).toBe(GENESIS_HASH);

    expect(entry2.sequenceNumber).toBe(2);
    expect(entry2.previousHash).toBe(entry1.hash);

    expect(entry3.sequenceNumber).toBe(3);
    expect(entry3.previousHash).toBe(entry2.hash);

    // Verify integrity of intact chain
    const report = await verifyAuditChainIntegrity();
    expect(report.isValid).toBe(true);
    expect(report.totalEntries).toBe(3);
  });

  test('Test 3: Detects data tampering when entry content is modified directly in database', async () => {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_REGISTER,
      performedByName: 'Citizen One',
      details: { note: 'Initial event' }
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.CASE_CREATE,
      performedByName: 'Citizen One',
      details: { amount: 5000 }
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.JUDGE_DECISION,
      performedByName: 'Judge One',
      details: { outcome: 'Granted' }
    });

    // Verify chain is initially intact
    const initialReport = await verifyAuditChainIntegrity();
    expect(initialReport.isValid).toBe(true);

    // Tamper directly in raw MongoDB collection (bypassing Mongoose hooks)
    await AuditLog.collection.updateOne(
      { sequenceNumber: 2 },
      { $set: { 'details.amount': 999999 } } // Alter content without recomputing hash
    );

    // Integrity check must detect tampering and report broken sequence
    const tamperedReport = await verifyAuditChainIntegrity();
    expect(tamperedReport.isValid).toBe(false);
    expect(tamperedReport.brokenAtSequence).toBe(2);
    expect(tamperedReport.error).toContain('Data tampering detected at sequence 2');
  });

  test('Test 4: Detects tampering when previousHash link is broken', async () => {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.USER_REGISTER,
      details: { note: 'A' }
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.CASE_CREATE,
      details: { note: 'B' }
    });

    // Tamper with previousHash link of sequence 2
    await AuditLog.collection.updateOne(
      { sequenceNumber: 2 },
      { $set: { previousHash: 'forged_fake_hash_1234567890abcdef' } }
    );

    const tamperedReport = await verifyAuditChainIntegrity();
    expect(tamperedReport.isValid).toBe(false);
    expect(tamperedReport.brokenAtSequence).toBe(2);
    expect(tamperedReport.error).toContain('Chain broken at sequence 2');
  });
});
