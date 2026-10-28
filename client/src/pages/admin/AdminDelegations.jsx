import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, XCircle, Search, Mail, User } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminDelegations = () => {
  const { addToast } = useToast();
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/delegations');
      if (data?.success) {
        setDelegations(data.delegations || []);
      }
    } catch (err) {
      console.error('Failed to load delegations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelegations();
  }, []);

  const handleForceRevoke = async (id, name, caseNumber) => {
    const reason = window.prompt(`Force-revoke delegate access for ${name} (Case ${caseNumber})?\nEnter reason:`, 'Administrative compliance directive');
    if (reason === null) return;

    try {
      const { data } = await api.patch(`/admin/delegations/${id}/revoke`, { reason });
      if (data?.success) {
        addToast('Delegation revoked and recorded in audit ledger.', 'info');
        fetchDelegations();
      }
    } catch (err) {
      addToast('Failed to revoke delegation', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          Feature 9: Family & Representative Delegations Oversight
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor all authorized family and advocate delegates across undertrial cases, and enforce administrative revocations
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active & Past Authorized Delegations</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
        ) : delegations.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No active delegations recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Delegate Name & Email</th>
                  <th className="py-2.5 px-3">Relationship</th>
                  <th className="py-2.5 px-3">Case Number</th>
                  <th className="py-2.5 px-3">Primary Citizen</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {delegations.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{d.delegateName}</div>
                      <div className="text-[11px] text-slate-400">{d.delegateEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{d.relationship}</td>
                    <td className="py-3 px-3 font-bold text-teal-800">{d.caseId?.caseNumber || 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-600">{d.citizenId?.fullName}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          d.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'Revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.status !== 'Revoked' && (
                        <button
                          onClick={() => handleForceRevoke(d._id, d.delegateName, d.caseId?.caseNumber)}
                          className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Force-Revoke
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

export default AdminDelegations;
