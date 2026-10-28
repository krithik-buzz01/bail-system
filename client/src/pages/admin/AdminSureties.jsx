import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, FileText, User, Phone, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminSureties = () => {
  const { addToast } = useToast();
  const [sureties, setSureties] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSureties = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/sureties?status=${statusFilter}` : '/admin/sureties';
      const { data } = await api.get(url);
      if (data?.success) {
        setSureties(data.sureties || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load sureties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSureties();
  }, [statusFilter]);

  const handleVerify = async (id, status) => {
    let rejectionReason = '';
    if (status === 'Rejected') {
      rejectionReason = window.prompt('Enter reason for rejecting surety document (solvency insufficient, ID mismatch, etc.):');
      if (rejectionReason === null) return;
    }

    try {
      const { data } = await api.patch(`/admin/sureties/${id}/verify`, {
        status,
        rejectionReason
      });

      if (data?.success) {
        addToast(`Surety status updated to ${status}. Notification emailed to citizen.`, 'success');
        fetchSureties();
      }
    } catch (err) {
      addToast('Failed to update surety', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            Feature 7: Surety Readiness & Solvency Verification Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and certify local sureties, solvency certificates, and ID documents prior to bail bond execution
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
        >
          <option value="">All Verification Statuses</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Registered</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats?.total || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <span className="text-xs font-medium text-amber-800">Pending Review</span>
          <div className="text-2xl font-bold text-amber-800 mt-0.5">{stats?.pending || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <span className="text-xs font-medium text-emerald-800">Verified</span>
          <div className="text-2xl font-bold text-emerald-800 mt-0.5">{stats?.verified || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <span className="text-xs font-medium text-red-800">Rejected</span>
          <div className="text-2xl font-bold text-red-800 mt-0.5">{stats?.rejected || 0}</div>
        </div>
      </div>

      {/* Sureties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Surety Submissions</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
        ) : sureties.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No sureties matching selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Surety Name</th>
                  <th className="py-2.5 px-3">Case / Accused</th>
                  <th className="py-2.5 px-3">Relationship & Contact</th>
                  <th className="py-2.5 px-3">Solvency Proof</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sureties.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] text-slate-400">{s.idProofType}: {s.idProofNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-teal-800">{s.caseId?.caseNumber}</div>
                      <div className="text-slate-500">{s.caseId?.personDetails?.fullName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{s.relationship}</div>
                      <div className="text-[11px] text-slate-400">{s.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">₹{s.solvencyAmount?.toLocaleString('en-IN')}</div>
                      {s.documentPath && (
                        <a
                          href={`/uploads/${s.documentPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-teal-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <FileText className="w-3 h-3" /> View Certificate
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          s.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      {s.status !== 'Verified' && (
                        <button
                          onClick={() => handleVerify(s._id, 'Verified')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Verify
                        </button>
                      )}
                      {s.status !== 'Rejected' && (
                        <button
                          onClick={() => handleVerify(s._id, 'Rejected')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg border border-red-200 transition inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      )}
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

export default AdminSureties;
