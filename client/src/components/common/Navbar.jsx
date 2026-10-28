import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  Bell,
  Globe,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Check,
  HelpCircle,
  Calculator,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changeLanguage } from '../../i18n';
import api from '../../api/client';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentLang = i18n.language || 'en';

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const { data } = await api.get('/notifications');
          if (data?.success) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (e) {}
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll for active session
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ta' : 'en';
    changeLanguage(nextLang);
  };

  return (
    <header className="bg-navy-900 border-b border-navy-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="bg-gradient-to-tr from-teal-500 to-teal-400 p-2 rounded-lg text-white shadow-md">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight group-hover:text-teal-400 transition-colors">
                  Bail Reckoner
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-navy-800 text-teal-400 border border-teal-500/30">
                  BNSS 2023
                </span>
              </div>
            </Link>

            {/* Quick utility links */}
            <div className="hidden lg:flex items-center space-x-1 pl-4 border-l border-navy-800 text-xs">
              <Link
                to="/quick-check"
                className="flex items-center space-x-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-navy-800 transition"
              >
                <Calculator className="w-3.5 h-3.5 text-teal-400" />
                <span>Quick Check</span>
              </Link>
              <Link
                to="/rights"
                className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-navy-800 transition"
              >
                Rights Card
              </Link>
              <Link
                to="/legal-aid"
                className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-navy-800 transition"
              >
                Legal Aid
              </Link>
              <Link
                to="/help"
                className="flex items-center space-x-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-navy-800 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>Help</span>
              </Link>
            </div>
          </div>

          {/* Controls: Language, Notifications, User */}
          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-colors"
              title="Toggle Language / மொழியை மாற்றவும்"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentLang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark all read</span>
                            </button>
                          )}
                          <Link
                            to="/notifications"
                            onClick={() => setShowNotifs(false)}
                            className="text-xs text-navy-700 hover:text-teal-600 font-medium flex items-center space-x-0.5"
                          >
                            <span>View all</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                if (n.link) navigate(n.link);
                                setShowNotifs(false);
                              }}
                              className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-sky-50/50 font-medium' : ''
                              }`}
                            >
                              <div className="font-semibold text-slate-900">{n.title}</div>
                              <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifs(false)}
                          className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                          See All Notifications History →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-xs font-medium transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                      {user.fullName ? user.fullName[0] : 'U'}
                    </div>
                    <span className="hidden md:inline-block max-w-[120px] truncate">{user.fullName}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile & Language</span>
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setShowUserMenu(false)}
                        className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <span>Notifications History</span>
                      </Link>
                      <Link
                        to="/change-password"
                        onClick={() => setShowUserMenu(false)}
                        className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Security / Password</span>
                      </Link>
                      <Link
                        to="/help"
                        onClick={() => setShowUserMenu(false)}
                        className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>In-App Help & Guide</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-white shadow transition-all"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
