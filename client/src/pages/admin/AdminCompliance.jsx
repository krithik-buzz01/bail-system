import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldAlert, CheckCircle2, Clock, Send, Scale } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminCompliance = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/compliance');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const handleEscalate = async (checkinId) => {
    if (!window.confirm('Trigger formal bail condition escalation email to citizen, advocate, and presiding Judge?')) return;
    try {
      const { data } = await api.post(`/admin/compliance/${checkinId}/escalate`);
      if (data?.success) {
        addToast('Violation escalated! Formal warning notices dispatched.', 'success');
        fetchCompliance();
      }
    } catch (err) {
      addToast('Failed to escalate violation', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" />
          Feature 12: Bail Conditions Compliance Monitor & Violation Escalation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor periodic police station check-ins, detect missed reporting obligations, and trigger judicial escalations
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Conditional Release Cases</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{data?.activeConditionalCases || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <span className="text-xs font-medium text-emerald-800">Verified Check-ins</span>
          <div className="text-2xl font-bold text-emerald-800 mt-0.5">{data?.stats?.verified || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <span className="text-xs font-medium text-red-800">Missed Check-ins (Violations)</span>
          <div className="text-2xl font-bold text-red-800 mt-0.5">{data?.stats?.missed || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <span className="text-xs font-medium text-amber-800">Escalated Notices Sent</span>
          <div className="text-2xl font-bold text-amber-800 mt-0.5">{data?.stats?.escalated || 0}</div>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Flagged Violations & Missed Check-ins
        </h2>

        {data?.violations?.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400">Zero active bail condition violations detected.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {data?.violations?.map((v) => (
              <div key={v._id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    {v.caseId?.caseNumber} • Accused: {v.caseId?.personDetails?.fullName}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Missed Date: {new Date(v.checkinDate).toLocaleDateString('en-IN')} at {v.policeStation}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {v.escalated ? (
                    <span className="px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">
                      Escalated to Judge
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEscalate(v._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1.5 text-[11px]"
                    >
                      <Send className="w-3.5 h-3.5" /> Escalate Violation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompliance;
