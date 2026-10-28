import React, { useState, useEffect } from 'react';
import { Building2, UserPlus, CheckCircle2, Clock, Phone, AlertCircle, FileText } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminLegalAidRequests = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReq, setSelectedReq] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    advocateName: '',
    advocatePhone: '',
    enrollmentNumber: '',
    status: 'Assigned',
    remarks: ''
  });
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/legal-aid-requests');
      if (data?.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load legal aid requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenAssign = (req) => {
    setSelectedReq(req);
    setAssignForm({
      advocateName: req.assignedAdvocate?.name || '',
      advocatePhone: req.assignedAdvocate?.phone || '',
      enrollmentNumber: req.assignedAdvocate?.enrollmentNumber || '',
      status: 'Assigned',
      remarks: 'Assigned free legal aid defense advocate from DLSA panel.'
    });
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      setUpdating(true);
      const { data } = await api.patch(`/admin/legal-aid-requests/${selectedReq._id}`, assignForm);
      if (data?.success) {
        addToast('Legal aid request updated and confirmation email sent to citizen.', 'success');
        setShowAssignModal(false);
        fetchRequests();
      }
    } catch (err) {
      addToast('Failed to update legal aid request', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-teal-600" />
          Feature 15: District Legal Services Authority (DLSA) Panel Allocation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Process legal aid applications from indigent undertrials, assign DLSA advocates, and monitor legal representation
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Legal Aid Applications Queue</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No legal aid requests currently pending.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Applicant / Case</th>
                  <th className="py-2.5 px-3">District DLSA</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Assigned Advocate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.citizenId?.fullName}</div>
                      <div className="text-[11px] text-teal-700 font-bold">{r.caseId?.caseNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{r.district} DLSA</td>
                    <td className="py-3 px-3 text-slate-600">{r.incomeCategory}</td>
                    <td className="py-3 px-3">
                      {r.assignedAdvocate?.name ? (
                        <div>
                          <div className="font-bold text-slate-900">{r.assignedAdvocate.name}</div>
                          <div className="text-[11px] text-slate-400">{r.assignedAdvocate.phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          r.status === 'Assigned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenAssign(r)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign Counsel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Assign Legal Aid Advocate</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Advocate Full Name</label>
                <input
                  required
                  value={assignForm.advocateName}
                  onChange={(e) => setAssignForm({ ...assignForm, advocateName: e.target.value })}
                  placeholder="e.g. Adv. R. Subramanian"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Advocate Phone Number</label>
                <input
                  required
                  value={assignForm.advocatePhone}
                  onChange={(e) => setAssignForm({ ...assignForm, advocatePhone: e.target.value })}
                  placeholder="9840112233"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Bar Council Enrollment Number</label>
                <input
                  required
                  value={assignForm.enrollmentNumber}
                  onChange={(e) => setAssignForm({ ...assignForm, enrollmentNumber: e.target.value })}
                  placeholder="MS/2841/2015"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Allocation Remarks</label>
                <textarea
                  rows={2}
                  value={assignForm.remarks}
                  onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                >
                  {updating ? 'Assigning...' : 'Assign & Notify Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLegalAidRequests;
