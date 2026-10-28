import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scale, User, Mail, Lock, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid 10-digit phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');

    const res = await registerUser({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password
    });

    setLoading(false);
    if (res.success) {
      const devParam = res.devOtp ? `&devOtp=${encodeURIComponent(res.devOtp)}` : '';
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone || '')}${devParam}`);
    } else {
      setErrorMessage(res.message || 'Registration failed');
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
        <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>BNSS 2023 Citizen Access</span>
            </div>
            <div className="flex items-center justify-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-navy-950 via-navy-900 to-teal-800 text-teal-300 shadow-md">
                <Scale className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Citizen Registration</h2>
            </div>
            <p className="text-xs text-slate-600">
              Create an account to evaluate bail eligibility and access legal aid services
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
              {errors.fullName && <p className="text-rose-600 text-xs mt-1 font-medium">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Real OTP will be sent)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="ramesh@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
              {errors.email && <p className="text-rose-600 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="9840112233"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
              </div>
              {errors.phone && <p className="text-rose-600 text-xs mt-1 font-medium">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                  />
                </div>
                {errors.password && <p className="text-rose-600 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Create Account & Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
