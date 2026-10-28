import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  FolderOpen,
  Gavel,
  Clock,
  Mail,
  ShieldCheck,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import api from '../../api/client';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/analytics');
        if (data?.success) {
          setAnalytics(data.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Compiling registry analytics & court statistics...</p>
      </div>
    );
  }

  const { summary, casesByStatus, casesByCategory, applicationsPerWeek, emailStats } = analytics;

  const STATUS_COLORS = ['#94a3b8', '#0284c7', '#f59e0b', '#0d9488', '#10b981', '#8b5cf6'];
  const CATEGORY_COLORS = {
    'Category A': '#10b981',
    'Category B': '#ef4444',
    'Category C': '#f59e0b',
    'Category D': '#6366f1'
  };

  const emailData = [
    { name: 'Sent', count: emailStats.sent + emailStats.simulated, fill: '#10b981' },
    { name: 'Failed', count: emailStats.failed, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Court Registry & System Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on undertrial cases, statutory classifications, applications workflow, and email delivery.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Total Registered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalUsers}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <FolderOpen className="w-4 h-4 text-sky-600" />
            <span>Total Cases</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalCases}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Applications Filed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalApplications}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <Gavel className="w-4 h-4 text-purple-600" />
            <span>Active Judges</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.activeJudges}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Avg Decision Time</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary.avgDecisionDays} <span className="text-xs font-normal text-slate-400">days</span>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Cases by Workflow Status</h3>
            <p className="text-xs text-slate-500">Distribution across registry progression</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casesByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#008dda" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by Antil Offence Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Satender Kumar Antil (2022) Classifications</h3>
            <p className="text-xs text-slate-500">Offence severity categorization (Cat A to D)</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casesByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#41b06e" radius={[4, 4, 0, 0]}>
                  {casesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#41b06e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications Per Week */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Application Filing Trend</h3>
            <p className="text-xs text-slate-500">Bail applications received per week</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={applicationsPerWeek} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0b192c" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Email Delivery Statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">System Email Delivery Status</h3>
            <p className="text-xs text-slate-500">Sent vs Failed notifications tracked in EmailLog</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {emailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Delivered: {emailStats.sent + emailStats.simulated}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span>Failed: {emailStats.failed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
