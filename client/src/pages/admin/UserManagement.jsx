import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Gavel,
  CheckCircle2,
  XCircle,
  Mail,
  Building2
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../config/constants';

export const UserManagement = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(ROLES.CITIZEN);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite Judge Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    court: 'Principal District and Sessions Court, Chennai',
    bench: 'Criminal Bench I'
  });
  const [inviting, setInviting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users', {
        params: { role: activeTab, search: searchTerm }
      });
      if (data?.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `Reactivate account for ${user.fullName}?`
      : `Suspend account for ${user.fullName}? The user will be barred from signing in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await api.patch(`/admin/users/${user._id}/status`, {
        isActive: nextStatus
      });
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Account Status Updated',
          message: data.message
        });
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: nextStatus } : u))
        );
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Error updating user status.'
      });
    }
  };

  const handleInviteJudgeSubmit = async (e) => {
    e.preventDefault();
    setInviting(true);

    try {
      const { data } = await api.post('/admin/judges/invite', inviteForm);
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Judicial Invitation Dispatched',
          message: data.message
        });
        setShowInviteModal(false);
        setInviteForm({
          fullName: '',
          email: '',
          phone: '',
          court: 'Principal District and Sessions Court, Chennai',
          bench: 'Criminal Bench I'
        });
        if (activeTab === ROLES.JUDGE) {
          fetchUsers();
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Invitation Failed',
        message: err.response?.data?.message || 'Failed to dispatch judicial invite.'
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User & Judicial Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage citizen access permissions and send official bench invitations to Judicial Officers.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
        >
          <UserPlus className="w-4 h-4 text-teal-400" />
          <span>Invite Judicial Officer</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex space-x-2 border-b sm:border-b-0 pb-2 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab(ROLES.CITIZEN)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === ROLES.CITIZEN
                ? 'bg-teal-500 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Citizens</span>
          </button>
          <button
            onClick={() => setActiveTab(ROLES.JUDGE)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
              activeTab === ROLES.JUDGE
                ? 'bg-navy-900 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Judicial Officers</span>
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No registered users found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role & Verification</th>
                  {activeTab === ROLES.JUDGE && <th className="py-3 px-4">Bench Details</th>}
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.fullName}</div>
                      <span className="text-[10px] text-slate-400">
                        Joined {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{u.email}</div>
                      <span className="text-[11px] text-slate-400">{u.phone || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                        {u.isVerified ? (
                          <span className="text-emerald-600 text-[11px] flex items-center space-x-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-amber-600 text-[11px]">Unverified / Invited</span>
                        )}
                      </div>
                    </td>

                    {activeTab === ROLES.JUDGE && (
                      <td className="py-3.5 px-4 text-[11px]">
                        {u.judgeProfile ? (
                          <div>
                            <p className="font-semibold text-slate-800">{u.judgeProfile.court}</p>
                            <p className="text-slate-500">{u.judgeProfile.bench}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Profile Pending</span>
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {u.role !== ROLES.ADMIN && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
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

      {/* Invite Judge Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Gavel className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Invite Judicial Officer</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Judges cannot self-register. Enter the judge's details below to dispatch a secure 48-hour password activation invitation.
            </p>

            <form onSubmit={handleInviteJudgeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judge's Legal Name *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  placeholder="e.g. Hon'ble Justice P. Venkatraman"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Judicial Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="judge.venkatraman@madrascourt.gov.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="9444123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designated Court *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.court}
                  onChange={(e) => setInviteForm({ ...inviteForm, court: e.target.value })}
                  placeholder="e.g. Principal District and Sessions Court, Chennai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designated Bench / Court Room *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.bench}
                  onChange={(e) => setInviteForm({ ...inviteForm, bench: e.target.value })}
                  placeholder="e.g. Criminal Bench I / Court Room 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {inviting ? 'Dispatching Invitation...' : 'Send Invitation Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
