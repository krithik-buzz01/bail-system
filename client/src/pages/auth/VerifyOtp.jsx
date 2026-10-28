import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Smartphone, RefreshCw, ArrowRight, CheckCircle2, Sparkles, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const phoneParam = searchParams.get('phone') || '';
  const devOtpParam = searchParams.get('devOtp') || '';

  const [email, setEmail] = useState(emailParam);
  const [phone, setPhone] = useState(phoneParam);
  const [otp, setOtp] = useState(devOtpParam || '');
  const [activeDevOtp, setActiveDevOtp] = useState(devOtpParam || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    const res = await verifyOtp({ email, otp });
    setLoading(false);

    if (res.success) {
      navigate('/citizen/dashboard', { replace: true });
    } else {
      setErrorMessage(res.message || 'Verification failed. Please check the code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage('');
    setInfoMessage('');

    const res = await resendOtp(email);
    setResending(false);

    if (res.success) {
      setCooldown(60); // 60s cooldown
      setInfoMessage('New verification code dispatched to both your Email and your Mobile Phone via SMS.');
      if (res.devOtp) {
        setActiveDevOtp(res.devOtp);
      }
      if (res.phone && !phone) {
        setPhone(res.phone);
      }
    } else {
      setErrorMessage(res.message || 'Failed to resend code');
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
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Dual-Channel OTP Verification</span>
            </div>

            <div className="flex items-center justify-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 text-white shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Verify Your Account
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              A 6-digit verification code was dispatched to both your channels:
            </p>
          </div>

          {/* Dual Channel Visual Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wide">
                  Email Inbox
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate block">
                  {email || 'your email'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wide">
                  Mobile SMS
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate block">
                  {phone ? `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}` : 'Registered Mobile Number'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Auto-Fill Dev Banner (Ensures user is NEVER stuck!) */}
          {activeDevOtp && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-300 text-teal-900 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Active Verification Code: </span>
                  <span className="font-mono font-extrabold text-teal-800 text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-teal-200">
                    {activeDevOtp}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtp(activeDevOtp)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-300 shadow-xs transition"
              >
                Autofill
              </button>
            </div>
          )}

          {/* Info Toast Banner */}
          {infoMessage && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium text-center">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!emailParam && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full tracking-[0.5em] text-center text-3xl font-mono font-extrabold py-3.5 bg-slate-50 border-2 border-slate-300 focus:border-teal-500 focus:bg-white rounded-2xl transition-all shadow-inner outline-none"
              />
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Valid for 10 minutes &bull; Max 5 attempts
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Verify & Activate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="pt-3 text-center border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-600">Didn't receive the SMS or email code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-teal-800 disabled:text-slate-400 transition flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : 'Resend via SMS & Email (60s cooldown)'}
              </span>
            </button>
          </div>

          {/* Gmail & SMS Delivery Guidance */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Gateway Delivery Notice</span>
            </p>
            <p>
              Codes are dispatched via real SMS to your phone and via SMTP to your email. If real Gmail delivery is blocked by Google security, check your Spam folder or configure a 16-character Google App Password in <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">server/.env</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
