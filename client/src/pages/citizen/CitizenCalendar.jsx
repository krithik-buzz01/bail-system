import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Download, MapPin, Scale, AlertCircle, FileText } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const CitizenCalendar = () => {
  const { addToast } = useToast();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHearings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/citizen/hearings');
        if (data?.success) {
          setHearings(data.hearings || []);
        }
      } catch (err) {
        console.error('Failed to load hearings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHearings();
  }, []);

  const handleDownloadIcs = async (hearingId, caseNumber) => {
    try {
      const response = await api.get(`/citizen/hearings/${hearingId}/ics`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hearing_${caseNumber || 'court'}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Calendar (.ics) downloaded. Importable to Google / Apple Calendar', 'success');
    } catch (err) {
      addToast('Failed to download calendar event', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Hearing Calendar & Court Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track scheduled bail hearings, export to your personal calendar, and receive automated 24h & 2h alerts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-28" />
          ))}
        </div>
      ) : hearings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Hearings Scheduled Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Once you submit your bail application and Registry assigns a court date, it will appear here.
          </p>
          <Link
            to="/cases"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
          >
            Go to My Cases
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hearings.map((h) => {
            const hDate = new Date(h.hearingDate);
            const isUpcoming = hDate >= new Date();

            return (
              <div
                key={h._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      Case {h.caseId?.caseNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isUpcoming ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h.status || 'Scheduled'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{h.purpose || 'Bail Application Hearing'}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        <strong>{hDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</strong> at {h.startTime || '10:30 AM'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{h.courtRoom || 'Sessions Courtroom No. 4'}</span>
                    </div>

                    {h.judgeId?.fullName && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Bench: Hon. {h.judgeId.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Email reminders active: 24h & 2h before hearing
                  </div>
                  <button
                    onClick={() => handleDownloadIcs(h._id, h.caseId?.caseNumber)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" /> Export .ics
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitizenCalendar;
