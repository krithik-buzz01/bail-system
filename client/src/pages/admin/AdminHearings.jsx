import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, AlertTriangle, MapPin, Scale, User } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminHearings = () => {
  const { addToast } = useToast();
  const [hearings, setHearings] = useState([]);
  const [judges, setJudges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hearingForm, setHearingForm] = useState({
    applicationId: '',
    judgeId: '',
    hearingDate: new Date().toISOString().split('T')[0],
    startTime: '10:30',
    endTime: '11:00',
    courtRoom: 'Court Hall No. 4, Sessions Division',
    purpose: 'Bail Application Hearing'
  });
  const [scheduling, setScheduling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hearingsRes, judgesRes, appsRes] = await Promise.all([
        api.get('/admin/hearings'),
        api.get('/admin/users?role=judge'),
        api.get('/admin/applications')
      ]);

      if (hearingsRes.data?.success) setHearings(hearingsRes.data.hearings || []);
      if (judgesRes.data?.success) setJudges(judgesRes.data.users || []);
      if (appsRes.data?.success) {
        const apps = appsRes.data.applications || [];
        setApplications(apps);
        if (apps.length > 0 && !hearingForm.applicationId) {
          setHearingForm((prev) => ({ ...prev, applicationId: apps[0]._id }));
        }
      }
      if (judgesRes.data?.users?.length > 0 && !hearingForm.judgeId) {
        setHearingForm((prev) => ({ ...prev, judgeId: judgesRes.data.users[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load hearings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setScheduling(true);
      const { data } = await api.post('/admin/hearings', hearingForm);
      if (data?.success) {
        addToast('Hearing scheduled successfully with zero clashes. Notifications sent.', 'success');
        setShowScheduleModal(false);
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to schedule hearing', 'error');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Feature 8: Master Hearing Scheduler & Clash Prevention
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally schedule and reschedule court hearings across all judicial officers with automated clash prevention
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Schedule New Hearing
        </button>
      </div>

      {/* Hearings List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Scheduled Court Sessions</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
        ) : hearings.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No scheduled hearings on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Case Number</th>
                  <th className="py-2.5 px-3">Judicial Bench</th>
                  <th className="py-2.5 px-3">Courtroom</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {hearings.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {new Date(h.hearingDate).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-[11px] text-teal-700 font-semibold">{h.startTime} - {h.endTime}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-teal-800">
                      {h.caseId?.caseNumber || 'Court Matter'}
                    </td>
                    <td className="py-3 px-3 text-slate-800">
                      {h.judgeId?.fullName || 'Assigned Judge'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{h.courtRoom}</td>
                    <td className="py-3 px-3 text-slate-700">{h.purpose}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-50 text-blue-800">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Schedule Court Hearing</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Bail Application</label>
                <select
                  required
                  value={hearingForm.applicationId}
                  onChange={(e) => setHearingForm({ ...hearingForm, applicationId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {applications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.applicationNumber} - {app.caseId?.personDetails?.fullName || 'Accused'} ({app.caseId?.caseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Judge / Bench</label>
                <select
                  required
                  value={hearingForm.judgeId}
                  onChange={(e) => setHearingForm({ ...hearingForm, judgeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {judges.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.fullName} ({j.court || 'Sessions Court'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Hearing Date</label>
                  <input
                    type="date"
                    required
                    value={hearingForm.hearingDate}
                    onChange={(e) => setHearingForm({ ...hearingForm, hearingDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={hearingForm.startTime}
                    onChange={(e) => setHearingForm({ ...hearingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={hearingForm.endTime}
                    onChange={(e) => setHearingForm({ ...hearingForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Courtroom / Hall</label>
                <input
                  required
                  value={hearingForm.courtRoom}
                  onChange={(e) => setHearingForm({ ...hearingForm, courtRoom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hearing Purpose</label>
                <input
                  value={hearingForm.purpose}
                  onChange={(e) => setHearingForm({ ...hearingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                >
                  {scheduling ? 'Validating Clash & Scheduling...' : 'Schedule Hearing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHearings;
