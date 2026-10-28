import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [fetchCurrentUser]);

  const login = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data?.success) {
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        setUser(data.user);
        addToast({
          type: 'success',
          title: 'Welcome Back',
          message: data.message || `Signed in as ${data.user.fullName}`
        });
        return { success: true, user: data.user };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      addToast({ type: 'error', title: 'Authentication Failed', message: msg });
      return {
        success: false,
        message: msg,
        code: error.response?.data?.code,
        email: error.response?.data?.email
      };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Verification Code Dispatched',
          message: data.message
        });
        return { success: true, email: data.email, phone: data.phone, devOtp: data.devOtp };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      addToast({ type: 'error', title: 'Registration Error', message: msg });
      return { success: false, message: msg };
    }
  };

  const verifyOtp = async ({ email, otp }) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      if (data?.success) {
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        setUser(data.user);
        addToast({
          type: 'success',
          title: 'Account Verified',
          message: 'Welcome to Bail Reckoner!'
        });
        return { success: true, user: data.user };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed.';
      addToast({ type: 'error', title: 'Verification Failed', message: msg });
      return { success: false, message: msg };
    }
  };

  const resendOtp = async (email) => {
    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      if (data?.success) {
        addToast({
          type: 'info',
          title: 'Code Sent via SMS & Mail',
          message: data.message
        });
        return { success: true, phone: data.phone, devOtp: data.devOtp };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend code.';
      addToast({ type: 'warning', title: 'Cooldown Active', message: msg });
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
    } finally {
      setUser(null);
      setAccessToken(null);
      addToast({ type: 'info', title: 'Logged Out', message: 'You have been signed out.' });
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (data?.success) {
        setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
        addToast({ type: 'success', title: 'Password Updated', message: data.message });
        return { success: true };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update password.';
      addToast({ type: 'error', title: 'Error', message: msg });
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        changePassword,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
