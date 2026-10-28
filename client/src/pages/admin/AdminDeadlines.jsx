import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Filter, AlertTriangle, Send, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminDeadlines = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const url = filter !== 'all' ? `/admin/deadlines?filter=${filter}` : '/admin/deadlines';
      const res = await api.get(url);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-teal-600" />
            Feature 1: Master Default-Bail Deadline Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Section 187 BNSS investigation deadlines across all active undertrial prisoners in Tamil Nadu
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          {['all', 'matured', 'approaching', 'safe'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === f
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Tracked Cases</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{data?.stats?.total || 0}</div>
          </div>
          <Clock className="w-8 h-8 text-teal-500 opacity-30" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-red-700">Default Bail Matured</span>
            <div className="text-2xl font-bold text-red-700 mt-0.5">{data?.stats?.matured || 0}</div>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500 opacity-40" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-amber-800">Impending (&le; 7 Days)</span>
            <div className="text-2xl font-bold text-amber-800 mt-0.5">{data?.stats?.approaching || 0}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500 opacity-40" />
        </div>
      </div>

      {/* Deadlines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active Undertrials Custody Ledger</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
        ) : data?.cases?.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No cases matching filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Case / Accused</th>
                  <th className="py-2.5 px-3">District & Police Station</th>
                  <th className="py-2.5 px-3">First Remand</th>
                  <th className="py-2.5 px-3">Custody Days</th>
                  <th className="py-2.5 px-3">Sec 187 Deadline</th>
                  <th className="py-2.5 px-3">Urgency Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data?.cases?.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.caseNumber}</div>
                      <div className="text-slate-500">{c.accusedName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{c.district}</div>
                      <div className="text-[11px] text-slate-400">{c.policeStation}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(c.remandDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-900 font-bold">
                      {c.daysElapsed} / {c.thresholdDays} Days
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {new Date(c.deadlineDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          c.isMatured
                            ? 'bg-red-100 text-red-800'
                            : c.daysRemaining <= 7
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.isMatured ? 'MATURED' : `${c.daysRemaining} Days Left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Sent-Alerts History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-5 h-5 text-teal-600" />
          Node-Cron Automated Sent-Alerts Log (Duplicate-Prevented)
        </h3>
        <p className="text-xs text-slate-500">
          Proactive email dispatches sent at T-7, T-3, T-1, and T-0 days to undertrials, advocates, and registry officials.
        </p>

        {data?.alertHistory?.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No cron alert logs recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {data?.alertHistory?.map((a) => (
              <div key={a._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{a.caseNumber}</span> • {a.recipientEmail} ({a.alertType})
                </div>
                <span className="text-slate-400 text-[11px]">
                  {new Date(a.sentAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeadlines;
