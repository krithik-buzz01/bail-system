import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FilePlus2,
  BookOpen,
  PhoneCall,
  History,
  Users,
  ShieldAlert,
  Inbox,
  Mail,
  Gavel,
  BarChart3,
  Calendar,
  Radar,
  Calculator,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  HelpCircle,
  Bell,
  Clock,
  SendHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/constants';

export const Sidebar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  const citizenNav = [
    { name: 'Dashboard & Deadlines', to: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'Register New Case', to: '/citizen/cases/new', icon: FilePlus2 },
    { name: 'Hearing Calendar', to: '/citizen/calendar', icon: Calendar },
    { name: 'Quick Check Calculator', to: '/quick-check', icon: Calculator },
    { name: 'Know Your Rights (EN/TA)', to: '/rights', icon: BookOpen },
    { name: 'Legal Aid Services', to: '/legal-aid', icon: PhoneCall },
    { name: 'Notifications History', to: '/notifications', icon: Bell },
    { name: 'In-App Help & Guide', to: '/help', icon: HelpCircle }
  ];

  const adminNav = [
    { name: 'Analytics & Overview', to: '/admin/dashboard', icon: BarChart3 },
    { name: 'Default-Bail Deadlines', to: '/admin/deadlines', icon: Clock },
    { name: 'Court Eligibility Radar', to: '/admin/radar', icon: Radar },
    { name: 'Application Registry', to: '/admin/applications', icon: Inbox },
    { name: 'Surety Verifications', to: '/admin/sureties', icon: ShieldCheck },
    { name: 'Master Hearing Calendar', to: '/admin/hearings', icon: Calendar },
    { name: 'Delegation Management', to: '/admin/delegations', icon: UserCheck },
    { name: 'Conditions Compliance', to: '/admin/compliance', icon: CheckSquare },
    { name: 'Legal Aid Requests', to: '/admin/legal-aid-requests', icon: SendHorizontal },
    { name: 'Legal Aid Directory', to: '/admin/legal-aid', icon: PhoneCall },
    { name: 'Offence & Antil Rules', to: '/admin/offences', icon: ShieldAlert },
    { name: 'Audit Trail & Integrity', to: '/admin/audit-trail', icon: History },
    { name: 'User & Judge Accounts', to: '/admin/users', icon: Users },
    { name: 'Email Dispatch Logs', to: '/admin/email-logs', icon: Mail },
    { name: 'Bilingual Rights Cards', to: '/rights', icon: BookOpen },
    { name: 'In-App Help & Guide', to: '/help', icon: HelpCircle }
  ];

  const judgeNav = [
    { name: 'Assigned Bench Queue', to: '/judge/queue', icon: Gavel },
    { name: 'Eligibility Radar Board', to: '/judge/radar', icon: Radar },
    { name: 'Bench Hearing Calendar', to: '/judge/calendar', icon: Calendar },
    { name: 'Bench Quick Calculator', to: '/judge/quick-check', icon: Calculator },
    { name: 'Courtroom Rights Card', to: '/rights', icon: BookOpen },
    { name: 'Legal Aid Directory', to: '/legal-aid', icon: PhoneCall },
    { name: 'Notifications History', to: '/notifications', icon: Bell },
    { name: 'In-App Help & Guide', to: '/help', icon: HelpCircle }
  ];

  const navItems =
    user.role === ROLES.ADMIN
      ? adminNav
      : user.role === ROLES.JUDGE
      ? judgeNav
      : citizenNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-5 px-3">
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {user.role} Portal Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs border border-teal-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-teal-600" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Helpful Quick Hotline Info */}
      <div className="pt-3 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center justify-between">
            <span>NALSA Legal Aid</span>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Toll Free</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Helpline: <strong className="text-teal-700 font-bold">15100</strong>
          </p>
          <p className="text-[10px] text-slate-400">24x7 Free aid for undertrials</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
