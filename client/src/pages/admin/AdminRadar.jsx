import React, { useState, useEffect } from 'react';
import { Radar, Download, ArrowRight, Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminRadar = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRadar = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/radar');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/admin/radar/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Bail_Eligibility_Radar_Export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Eligibility Radar CSV exported successfully.', 'success');
    } catch (err) {
      addToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Radar className="w-6 h-6 text-teal-600" />
            Feature 13: Court-Wide Statutory Eligibility Radar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            State-wide judicial radar board tracking matured default bail (Sec 187) and undertrial detention thresholds (Sec 479)
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <Download className="w-4 h-4 text-teal-400" /> Export Radar CSV
        </button>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-red-200 bg-red-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Matured & Undecided Matters</span>
            <div className="text-3xl font-black text-red-700 mt-1">{data?.stats?.totalMatured || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Accused entitled to mandatory default bail</p>
          </div>
          <ShieldAlert className="w-10 h-10 text-red-500 opacity-40" />
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Critical Window (&le; 7 Days)</span>
            <div className="text-3xl font-black text-amber-800 mt-1">{data?.stats?.totalApproaching || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Police investigation window maturing shortly</p>
          </div>
          <Clock className="w-10 h-10 text-amber-500 opacity-40" />
        </div>
      </div>

      {/* Matured Cases Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Matured Undertrial Applications Across Benches</h2>

        {data?.maturedCases?.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400">Zero unaddressed matured cases currently.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Case Number</th>
                  <th className="py-2.5 px-3">Accused Name</th>
                  <th className="py-2.5 px-3">District & Court</th>
                  <th className="py-2.5 px-3">Assigned Bench</th>
                  <th className="py-2.5 px-3">Custody Days</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data?.maturedCases?.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-teal-800">{c.caseNumber}</td>
                    <td className="py-3 px-3 text-slate-900 font-semibold">{c.accusedName}</td>
                    <td className="py-3 px-3 text-slate-600">{c.district} • {c.court}</td>
                    <td className="py-3 px-3 text-slate-800">{c.assignedJudge}</td>
                    <td className="py-3 px-3 text-red-600 font-bold">{c.daysElapsed} Days</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 text-[11px]">
                        MATURED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRadar;
