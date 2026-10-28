import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileCheck
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AuditTrail = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Integrity Verification Report
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const { data } = await api.get('/admin/audit-logs', { params });
      if (data?.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const { data } = await api.post('/admin/audit-logs/verify');
      if (data?.success) {
        setVerificationResult(data.verification);
        if (data.verification.isValid) {
          addToast({
            type: 'success',
            title: 'Audit Chain Valid',
            message: data.verification.message
          });
        } else {
          addToast({
            type: 'error',
            title: 'Tampering Detected!',
            message: `Chain link anomaly found at sequence ${data.verification.brokenAtSequence}`
          });
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.response?.data?.message || 'Error executing cryptographic verification.'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Feature 6: Cryptographic Hash-Chained Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every sensitive system event is immutably linked with SHA-256 hashes to guarantee complete transparency and tamper-detection.
          </p>
        </div>

        <button
          onClick={handleVerifyIntegrity}
          disabled={verifying}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md disabled:opacity-50 transition-all"
        >
          {verifying ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Recomputing Hashes...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Cryptographic Integrity</span>
            </>
          )}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
            )}
            <div>
              <h3 className="font-bold text-sm">
                {verificationResult.isValid
                  ? 'Audit Chain Intact & Cryptographically Verified'
                  : 'CRITICAL: Data Anomaly / Tampering Detected!'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">{verificationResult.message || verificationResult.error}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-black/5 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>Total Blocks Verified: <strong>{verificationResult.totalEntries}</strong></div>
            <div>Broken Block: <strong>{verificationResult.brokenAtSequence || 'None (100% Intact)'}</strong></div>
            <div className="sm:col-span-2 truncate font-mono text-[10px]">
              Head Hash: {verificationResult.headHash || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
            placeholder="Search by action, user name, email, or SHA-256 hash..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Search
        </button>
      </div>

      {/* Audit Chain Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading audit trail chain...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records found in the ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Seq #</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Details Summary</th>
                  <th className="py-3 px-4">Cryptographic Hash Link</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{log.sequenceNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.performedByName}</div>
                      <span className="text-[10px] text-slate-400 capitalize">{log.role}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="py-3 px-4 font-mono text-[9px] text-slate-400 space-y-0.5 max-w-xs truncate">
                      <div className="truncate" title={`Hash: ${log.hash}`}>
                        Curr: <span className="text-teal-700 font-semibold">{log.hash?.substring(0, 20)}...</span>
                      </div>
                      <div className="truncate" title={`Prev: ${log.previousHash}`}>
                        Prev: <span>{log.previousHash?.substring(0, 20)}...</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'medium'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
