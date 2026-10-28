import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, Scale, Sparkles } from 'lucide-react';
import api from '../../api/client';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(8, 20, 42, 0.86) 0%, rgba(13, 31, 60, 0.83) 40%, rgba(4, 12, 28, 0.91) 100%), url('/images/login-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10 max-w-lg w-full my-6">
        <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Password Recovery</span>
            </div>
            <div className="flex items-center justify-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-navy-950 via-navy-900 to-teal-800 text-teal-300 shadow-md">
                <Scale className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
            </div>
            <p className="text-xs text-slate-600">
              Enter your registered email address to receive a secure, 30-minute password reset link.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs leading-relaxed text-center space-y-3 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-extrabold text-base text-emerald-900">Reset Link Dispatched</p>
              <p className="text-slate-700">
                If an account is associated with <strong>{email}</strong>, a secure single-use reset link has been dispatched to your email and verified contact channels.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
                Remembered your password?{' '}
                <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 underline">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
