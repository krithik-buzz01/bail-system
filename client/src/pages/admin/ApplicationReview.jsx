import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  CheckCircle2,
  XCircle,
  FileQuestion,
  UserCheck,
  Calendar,
  Eye,
  FileText,
  Gavel,
  Clock,
  Send
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { APP_STATUS, ROLES } from '../../config/constants';

export const ApplicationReview = () => {
  const { addToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [judges, setJudges] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);

  // Form states
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [hearingForm, setHearingForm] = useState({
    hearingDate: '',
    courtRoom: 'Court Room 2',
    notes: ''
  });
  const [requestDocForm, setRequestDocForm] = useState({
    requestedDocType: 'Remand Extension Order',
    remarks: 'Please furnish the latest remand order from the Magistrate Court.'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/admin/applications', { params });
      if (data?.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJudges = async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { role: ROLES.JUDGE } });
      if (data?.success) {
        setJudges(data.users?.filter((j) => j.isActive) || []);
      }
    } catch (err) {
      console.error('Failed to load judges:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchJudges();
  }, [statusFilter]);

  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!selectedJudgeId) {
      addToast({ type: 'warning', title: 'Selection Missing', message: 'Please select a judge.' });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/applications/${selectedApp._id}/assign-judge`, {
        judgeId: selectedJudgeId
      });
      if (data?.success) {
        addToast({ type: 'success', title: 'Judge Assigned', message: data.message });
        setShowAssignModal(false);
        fetchApplications();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Assignment Error', message: err.response?.data?.message || 'Failed to assign judge.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleHearing = async (e) => {
    e.preventDefault();
    if (!hearingForm.hearingDate) {
      addToast({ type: 'warning', title: 'Date Missing', message: 'Please pick a hearing date.' });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/applications/${selectedApp._id}/schedule-hearing`, hearingForm);
      if (data?.success) {
        addToast({ type: 'success', title: 'Hearing Scheduled', message: data.message });
        setShowHearingModal(false);
        fetchApplications();
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Scheduling Error', message: err.response?.data?.message || 'Failed to schedule hearing.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDocument = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/applications/${selectedApp._id}/request-doc`, requestDocForm);
      if (data?.success) {
        addToast({ type: 'success', title: 'Notice Dispatched', message: data.message });
        setShowRequestDocModal(false);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Request Error', message: err.response?.data?.message || 'Failed to request document.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bail Application Queue & Workflow</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review case files, verify uploaded documents, assign applications to judges, and schedule court hearings.
          </p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
        >
          <option value="">All Application Statuses</option>
          {Object.values(APP_STATUS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading application queue...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No applications in queue matching the filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const caseDoc = app.caseId || {};
              const citizen = app.citizenId || {};
              const assignedJudge = app.assignedJudgeId;

              return (
                <div key={app._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Primary Info */}
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{app.applicationNumber}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {caseDoc.caseNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800">
                        Accused: <strong>{caseDoc.personDetails?.fullName}</strong> &bull; Applicant:{' '}
                        <strong>{citizen.fullName}</strong> ({citizen.email})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        FIR: {caseDoc.firNumber} &bull; PS: {caseDoc.policeStation} &bull; Remand:{' '}
                        {caseDoc.remandDate ? new Date(caseDoc.remandDate).toLocaleDateString('en-IN') : 'N/A'}
                      </p>
                      {assignedJudge && (
                        <p className="text-[11px] text-purple-700 font-semibold flex items-center space-x-1">
                          <Gavel className="w-3 h-3" />
                          <span>Assigned Judge: Hon'ble {assignedJudge.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      {/* Request Document Button */}
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowRequestDocModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1"
                      >
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>Request Doc</span>
                      </button>

                      {/* Assign Judge Button */}
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setSelectedJudgeId(assignedJudge?._id || '');
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center space-x-1 shadow"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                        <span>{assignedJudge ? 'Reassign' : 'Assign Judge'}</span>
                      </button>

                      {/* Schedule Hearing Button */}
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowHearingModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold flex items-center space-x-1 shadow"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Hearing</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Judge Modal */}
      {showAssignModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Assign Judge: {selectedApp.applicationNumber}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignJudge} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Judicial Officer *</label>
                <select
                  required
                  value={selectedJudgeId}
                  onChange={(e) => setSelectedJudgeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose active judge --</option>
                  {judges.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.fullName} ({j.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assigning will notify the judge via email and transfer the case file to their bench queue.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Hearing Modal */}
      {showHearingModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Fix Hearing Date: {selectedApp.applicationNumber}
              </h3>
              <button
                onClick={() => setShowHearingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleHearing} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hearing Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={hearingForm.hearingDate}
                  onChange={(e) => setHearingForm({ ...hearingForm, hearingDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Court Room / Bench *</label>
                <input
                  type="text"
                  required
                  value={hearingForm.courtRoom}
                  onChange={(e) => setHearingForm({ ...hearingForm, courtRoom: e.target.value })}
                  placeholder="e.g. Criminal Court Room 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Registry Instructions</label>
                <textarea
                  rows={2}
                  value={hearingForm.notes}
                  onChange={(e) => setHearingForm({ ...hearingForm, notes: e.target.value })}
                  placeholder="e.g. Physical production or video conferencing ordered"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHearingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {submitting ? 'Fixing Schedule...' : 'Schedule & Notify Parties'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {showRequestDocModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Request Missing Document: {selectedApp.applicationNumber}
              </h3>
              <button
                onClick={() => setShowRequestDocModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title Needed *</label>
                <input
                  type="text"
                  required
                  value={requestDocForm.requestedDocType}
                  onChange={(e) =>
                    setRequestDocForm({ ...requestDocForm, requestedDocType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registry Remarks to Applicant *</label>
                <textarea
                  rows={3}
                  required
                  value={requestDocForm.remarks}
                  onChange={(e) => setRequestDocForm({ ...requestDocForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestDocModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {submitting ? 'Dispatching Notice...' : 'Send Request Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationReview;
