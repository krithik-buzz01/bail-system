import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FilePlus2,
  FolderOpen,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  CheckCircle2,
  Scale,
  Calendar,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import CountdownTimer from '../../components/common/CountdownTimer';

export const CitizenDashboard = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/citizen/dashboard');
        if (data?.success) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error('Failed to load citizen dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading your cases...</p>
        </div>
      </div>
    );
  }

  const cases = dashboardData?.cases || [];
  const maturedCasesCount = cases.filter((c) => c.liveAssessment?.bnss187?.isMatured).length;
  const activeCasesCount = cases.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-navy-950/60 px-2.5 py-1 rounded-md mb-2">
            Citizen & Undertrial Representative Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Undertrial Custody & Bail Tracker</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Evaluate bail eligibility under BNSS Section 187 (Default Bail) and Section 479 (Detention Limits) with automated date arithmetic.
          </p>
        </div>
        <Link
          to="/citizen/cases/new"
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>{t('dashboard.new_case_btn')}</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Cases</p>
            <h3 className="text-xl font-bold text-slate-900">{activeCasesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Default Bail Matured</p>
            <h3 className="text-xl font-bold text-slate-900">{maturedCasesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Under Investigation</p>
            <h3 className="text-xl font-bold text-slate-900">
              {cases.filter((c) => c.investigationStatus === 'In Progress').length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Court Queue</p>
            <h3 className="text-xl font-bold text-slate-900">
              {cases.filter((c) => c.application).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">{t('dashboard.cases_overview')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, Section 187 investigation countdowns, and court petition files
            </p>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sm text-slate-700">No cases recorded yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add details of an undertrial prisoner or accused person to calculate default bail dates and generate court applications.
            </p>
            <Link
              to="/citizen/cases/new"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold shadow transition-all mt-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Add First Case</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cases.map((caseItem) => {
              const live = caseItem.liveAssessment;
              const person = caseItem.personDetails;
              const offences = caseItem.offences || [];

              const statusColor =
                caseItem.status === 'Decided'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : caseItem.status === 'Hearing Scheduled'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : caseItem.status === 'Assigned'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : caseItem.status === 'Submitted'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div key={caseItem._id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Primary Info */}
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{caseItem.caseNumber}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {caseItem.status}
                        </span>
                        {live?.isBailableAll && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Bailable Offence
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700">
                        Accused: <strong>{person?.fullName}</strong> ({person?.age} yrs, {person?.gender}) &bull; Crime No.{' '}
                        <strong>{caseItem.firNumber}</strong> ({caseItem.policeStation} PS, {caseItem.district})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Offences:{' '}
                        {offences.map((o) => `${o.section} (${o.title})`).join(', ') || 'None specified'}
                      </p>
                    </div>

                    {/* Section 187 Countdown */}
                    <div className="w-full lg:w-72">
                      {live?.bnss187 && <CountdownTimer bnss187={live.bnss187} compact={false} />}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 flex-shrink-0 w-full lg:w-auto justify-end">
                      <Link
                        to={`/citizen/cases/${caseItem._id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Case File</span>
                      </Link>
                      <a
                        href={`/api/citizen/cases/${caseItem._id}/assessment-pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-teal-600 transition-colors"
                        title="Download Assessment Report PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
