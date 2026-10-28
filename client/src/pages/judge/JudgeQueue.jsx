import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gavel,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Eye,
  Filter,
  ShieldCheck,
  Scale
} from 'lucide-react';
import api from '../../api/client';
import CountdownTimer from '../../components/common/CountdownTimer';

export const JudgeQueue = () => {
  const [queue, setQueue] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (priorityFilter) params.priorityDeadline = 'true';

      const { data } = await api.get('/judge/queue', { params });
      if (data?.success) {
        setQueue(data.queue || []);
      }
    } catch (err) {
      console.error('Failed to load judicial queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [priorityFilter]);

  const maturedCasesCount = queue.filter((item) => item.isMatured).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Judicial Bench Header */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-navy-800/80 px-2.5 py-1 rounded-md border border-teal-500/20 mb-2 inline-block">
            Judicial Bench Portal &bull; Decision Support
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Assigned Bail Applications Queue</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Judicial bench docket filtered strictly to cases assigned to you. Prioritized by statutory default bail maturities and hearing schedules.
          </p>
        </div>

        {/* Priority Toggle */}
        <button
          onClick={() => setPriorityFilter(!priorityFilter)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow ${
            priorityFilter
              ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
              : 'bg-navy-800 text-slate-200 hover:bg-navy-700 border border-navy-700'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{priorityFilter ? 'Prioritizing by Approaching Deadlines' : 'Sort by Approaching Deadlines'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-navy-50 text-navy-900">
            <Gavel className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assigned to Bench</p>
            <h3 className="text-xl font-bold text-slate-900">{queue.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Default Bail Matured (Urgent)</p>
            <h3 className="text-xl font-bold text-slate-900">{maturedCasesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Decisions Pronounced</p>
            <h3 className="text-xl font-bold text-slate-900">
              {queue.filter((q) => q.status === 'Decided').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Applications Docket */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading bench docket...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No bail applications currently assigned to your bench.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => {
              const caseDoc = item.caseId || {};
              const person = caseDoc.personDetails || {};
              const live = item.liveAssessment;
              const offences = caseDoc.offences || [];

              return (
                <div key={item._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Case and Statutory Flags */}
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{item.applicationNumber}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {caseDoc.caseNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            item.status === 'Decided'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-teal-50 text-teal-700 border-teal-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.isMatured && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            Default Bail Matured!
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-800">
                        Accused: <strong>{person.fullName}</strong> ({person.age} yrs, {person.gender}) &bull;{' '}
                        {caseDoc.court}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Offences:{' '}
                        {offences.map((o) => `${o.section} (${o.antilCategory})`).join(', ') || 'N/A'}
                      </p>

                      {/* Statutory Advisory Verdict Pill */}
                      {live?.verdict && (
                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            Advisory: {live.verdict}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section 187 Countdown */}
                    <div className="w-full lg:w-64">
                      {live?.bnss187 && <CountdownTimer bnss187={live.bnss187} compact={false} />}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 w-full lg:w-auto flex justify-end">
                      <Link
                        to={`/judge/cases/${item._id}`}
                        className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition-colors"
                      >
                        <Eye className="w-4 h-4 text-teal-400" />
                        <span>Review File & Record Order</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeQueue;
