import React, { useState, useEffect } from 'react';
import { Radar, ShieldAlert, Clock, ArrowRight, User, Scale, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const JudgeRadar = () => {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRadar = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/judge/radar');
        if (data?.success) {
          setRadarData(data);
        }
      } catch (err) {
        console.error('Failed to load judge radar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRadar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Radar className="w-6 h-6 text-teal-600" />
            Eligibility Radar Board (Bench Urgency Queue)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time statutory surveillance of cases where default bail has matured or custody thresholds are breached
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Matured Cases Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                Statutory Right Matured ({radarData?.maturedCases?.length || 0})
              </h2>
            </div>

            {radarData?.maturedCases?.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No matured default bail cases currently pending order on this bench.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {radarData?.maturedCases?.map((item) => (
                  <div
                    key={item.caseId}
                    className="bg-white rounded-2xl border-2 border-red-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                        {item.caseNumber}
                      </span>
                      <span className="text-xs font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        MATURED
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.accusedName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Remanded on {new Date(item.remandDate).toLocaleDateString('en-IN')} • {item.daysElapsed} days in custody without chargesheet.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Sec 187(3) BNSS Mandate</span>
                      <Link
                        to={`/judge/cases/${item.applicationId || item.caseId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
                      >
                        Pronounce Order <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approaching Deadline Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                Impending Deadlines (&le; 7 Days) ({radarData?.approachingCases?.length || 0})
              </h2>
            </div>

            {radarData?.approachingCases?.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No cases within the 7-day critical threshold window.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {radarData?.approachingCases?.map((item) => (
                  <div
                    key={item.caseId}
                    className="bg-white rounded-2xl border border-amber-300 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {item.caseNumber}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {item.daysRemaining} Days Left
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.accusedName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Remanded on {new Date(item.remandDate).toLocaleDateString('en-IN')} • {item.daysElapsed} days elapsed.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Chargesheet Awaited</span>
                      <Link
                        to={`/judge/cases/${item.applicationId || item.caseId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
                      >
                        Inspect Case File <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeRadar;
