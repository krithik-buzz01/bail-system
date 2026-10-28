import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, KeyRound, Globe, Shield, Scale, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const Profile = () => {
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      addToast('Password must be at least 8 characters long', 'error');
      return;
    }

    try {
      setSubmittingPassword(true);
      const { data } = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (data?.success) {
        addToast('Password updated successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    addToast(lang === 'ta' ? 'மொழி தமிழுக்கு மாற்றப்பட்டது' : 'Language set to English', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-teal-600" />
          Account Profile & Security
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your identity, role permissions, and credentials</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-2xl">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700 mt-1">
                <Shield className="w-3 h-3 text-teal-600" />
                {user?.role} Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified Indian Legal Identity
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-sm">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Email Address</div>
              <div className="text-slate-800 font-semibold">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Phone Number</div>
              <div className="text-slate-800 font-semibold">{user?.phone || 'Not provided'}</div>
            </div>
          </div>
          {user?.court && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl sm:col-span-2">
              <Scale className="w-5 h-5 text-teal-600" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Judicial Court & Bench Assignment</div>
                <div className="text-slate-800 font-semibold">
                  {user.court} — {user.bench || 'Principal Sessions Division'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-teal-600" />
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50"
            >
              {submittingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Language & Preferences Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-teal-600" />
              Language & Accessibility
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Select your preferred legal language. All statutory rights cards, tooltips, and petition guides adapt instantly.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`p-4 rounded-xl border text-left transition ${
                  language === 'en'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold">English</div>
                <div className="text-xs text-slate-500 mt-1">Official Legal Text</div>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ta')}
                className={`p-4 rounded-xl border text-left transition ${
                  language === 'ta'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold">தமிழ் (Tamil)</div>
                <div className="text-xs text-slate-500 mt-1">தமிழ்நாடு சட்ட உதவி</div>
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              All notifications and statutory reminders are mirrored via encrypted email per Indian cybersecurity regulations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
