import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scale, Lock, Mail, AlertTriangle, ArrowRight, ShieldCheck, UserCheck, Gavel, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutWarning, setLockoutWarning] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    setLockoutWarning('');

    const res = await login(data);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Role-based redirect
      if (res.user.role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (res.user.role === ROLES.JUDGE) {
        navigate('/judge/queue', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/citizen/dashboard';
        navigate(from, { replace: true });
      }
    } else {
      if (res.code === 'ACCOUNT_NOT_VERIFIED') {
        navigate(`/verify-otp?email=${encodeURIComponent(res.email || data.email)}`);
      } else if (res.message?.includes('locked')) {
        setLockoutWarning(res.message);
      } else {
        setErrorMessage(res.message || 'Invalid credentials');
      }
    }
  };

  const fillQuickDemo = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div
      className="relative -mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(8, 20, 42, 0.85) 0%, rgba(13, 31, 60, 0.82) 40%, rgba(4, 12, 28, 0.90) 100%), url('/images/login-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Decorative ambient light */}
      <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-transparent to-black/40 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full my-6">
        {/* Glassmorphic Login Card */}
        <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>BNSS 2023 Statutory Platform</span>
            </div>

            <div className="flex items-center justify-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-navy-950 via-navy-900 to-teal-800 text-teal-300 shadow-md">
                <Scale className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bail Reckoner
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Bail Assessment, Legal Rights & Judicial Case Management Portal
            </p>
          </div>

          {/* Lockout or Error Alerts */}
          {lockoutWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start space-x-3 text-xs leading-relaxed shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Security Lockout Active</p>
                <p>{lockoutWarning}</p>
              </div>
            </div>
          )}

          {errorMessage && !lockoutWarning && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium shadow-sm">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
              {errors.password && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.password.message}</p>
              )}
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
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Fill Buttons */}
          <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <p className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Quick Demo Access (Click to autofill)</span>
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">1-Click</span>
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo('citizen@bailreckoner.gov.in', 'Citizen@12345')}
                className="py-1.5 px-2 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 font-semibold transition text-center flex flex-col items-center justify-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600 mb-0.5" />
                <span className="text-[11px]">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('judge.sharma@madrascourt.gov.in', 'Judge@12345')}
                className="py-1.5 px-2 rounded-lg bg-white hover:bg-navy-50 border border-slate-200 hover:border-navy-300 text-slate-700 font-semibold transition text-center flex flex-col items-center justify-center"
              >
                <Gavel className="w-3.5 h-3.5 text-navy-800 mb-0.5" />
                <span className="text-[11px]">Judge</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('admin@bailreckoner.gov.in', 'Admin@Initial123')}
                className="py-1.5 px-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 font-semibold transition text-center flex flex-col items-center justify-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 mb-0.5" />
                <span className="text-[11px]">Admin</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-1 text-center space-y-1">
            <p className="text-xs text-slate-600">
              Need to register as an undertrial or representative?{' '}
              <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800 underline">
                Register here
              </Link>
            </p>
            <p className="text-[10px] text-slate-400">
              Informational & legal decision-support tool. Not official court filing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
