import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, MapPin, Scale, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const JudgeCalendar = () => {
  const { addToast } = useToast();
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchCalendar = async (date) => {
    try {
      setLoading(true);
      const url = date ? `/judge/calendar?date=${date}` : '/judge/calendar';
      const { data } = await api.get(url);
      if (data?.success) {
        setHearings(data.hearings || []);
      }
    } catch (err) {
      console.error('Failed to load judge calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(selectedDate);
  }, [selectedDate]);

  const clashes = hearings.filter((h) => h.hasClash);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Judicial Bench Calendar & Daily Agenda
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review scheduled hearings, detect courtroom time-slot clashes, and inspect assigned undertrial files
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setSelectedDate('')}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Clash Alert Banner */}
      {clashes.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-sm font-bold block mb-0.5">Courtroom Schedule Clash Detected</strong>
            <span>
              {clashes.length} hearing(s) share overlapping courtroom time slots. Please coordinate with Registry Admin to reschedule.
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-24" />
          ))}
        </div>
      ) : hearings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Hearings Scheduled for this Date</h3>
          <p className="text-xs text-slate-500 mt-1">Select another date or view all scheduled bench matters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hearings.map((h) => (
            <div
              key={h._id}
              className={`bg-white rounded-2xl border transition p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                h.hasClash ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    {h.caseId?.caseNumber || 'Case Record'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {h.startTime || '10:30'} - {h.endTime || '11:00'}
                  </span>
                  {h.hasClash && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Clash Flagged
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{h.purpose || 'Bail Application Hearing'}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Accused: {h.caseId?.personDetails?.fullName || 'Not recorded'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {h.courtRoom}
                  </span>
                </div>
              </div>

              <Link
                to={`/judge/cases/${h.applicationId?._id || h.caseId?._id}`}
                className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition self-start md:self-center shrink-0"
              >
                Inspect Case File & Decision Support <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeCalendar;
