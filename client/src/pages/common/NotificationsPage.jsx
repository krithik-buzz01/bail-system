import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Clock, ExternalLink, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      addToast('Notification marked as read', 'success');
    } catch (err) {
      addToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all as read', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DEADLINE':
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'DECISION':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'HEARING':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" />
            Notifications & Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time statutory deadline alerts, hearing reminders, and judicial decisions
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-slate-200 h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Notifications</h3>
          <p className="text-sm text-slate-500 mt-1">You are up to date on all case filings and statutory timelines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`bg-white rounded-xl border transition p-4 flex items-start gap-4 ${
                !n.isRead ? 'border-teal-300 bg-teal-50/20 shadow-sm' : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 mt-3">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View Case File <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
