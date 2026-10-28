import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Clock,
  Download,
  Send,
  Upload,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Scale,
  Calendar,
  Building2,
  FileCheck2,
  Info,
  Users,
  UserPlus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Check,
  Activity,
  ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import CountdownTimer from '../../components/common/CountdownTimer';
import { useToast } from '../../context/ToastContext';

export const CaseDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('assessment');
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [application, setApplication] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Feature 7: Sureties state
  const [sureties, setSureties] = useState([]);
  const [suretiesSummary, setSuretiesSummary] = useState(null);
  const [showAddSuretyModal, setShowAddSuretyModal] = useState(false);
  const [suretyForm, setSuretyForm] = useState({
    fullName: '',
    relationship: 'Family Member',
    phone: '',
    address: '',
    solvencyAmount: 25000,
    idProofType: 'Aadhaar',
    idProofNumber: ''
  });
  const [suretyFile, setSuretyFile] = useState(null);
  const [savingSurety, setSavingSurety] = useState(false);

  // Feature 9: Delegates state
  const [delegates, setDelegates] = useState([]);
  const [showInviteDelegateModal, setShowInviteDelegateModal] = useState(false);
  const [delegateForm, setDelegateForm] = useState({
    delegateEmail: '',
    delegateName: '',
    delegatePhone: '',
    relationship: 'Spouse'
  });
  const [invitingDelegate, setInvitingDelegate] = useState(false);

  // Feature 10: Timeline state
  const [timeline, setTimeline] = useState(null);

  // Feature 11: Document Vault & OCR state
  const [ocrList, setOcrList] = useState([]);
  const [uploadingOcr, setUploadingOcr] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrType, setOcrType] = useState('Remand Order');

  // Feature 12: Compliance state
  const [compliance, setCompliance] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    policeStation: '',
    officerName: '',
    receiptNumber: '',
    notes: ''
  });
  const [loggingCheckin, setLoggingCheckin] = useState(false);

  // Feature 15: Legal Aid state
  const [legalAid, setLegalAid] = useState(null);
  const [legalAidForm, setLegalAidForm] = useState({
    district: '',
    incomeCategory: 'Incarcerated Undertrial',
    reasonForRequest: 'Unable to afford private legal counsel for trial defense.'
  });
  const [submittingAid, setSubmittingAid] = useState(false);

  // Feature 6: Audit trail
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/citizen/cases/${id}`);
      if (data?.success) {
        setCaseData(data.case);
        setDocuments(data.documents || []);
        setApplication(data.application);
        setAssessment(data.assessment);
      }
    } catch (err) {
      console.error('Failed to load case file:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSureties = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/sureties`);
      if (data?.success) {
        setSureties(data.sureties || []);
        setSuretiesSummary(data.summary);
      }
    } catch (err) {}
  };

  const fetchDelegates = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/delegates`);
      if (data?.success) {
        setDelegates(data.delegates || []);
      }
    } catch (err) {}
  };

  const fetchTimeline = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/timeline`);
      if (data?.success) {
        setTimeline(data);
      }
    } catch (err) {}
  };

  const fetchCompliance = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/compliance`);
      if (data?.success) {
        setCompliance(data);
      }
    } catch (err) {}
  };

  const fetchLegalAid = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/legal-aid`);
      if (data?.success) {
        setLegalAid(data.request);
      }
    } catch (err) {}
  };

  const fetchAudit = async () => {
    try {
      const { data } = await api.get(`/citizen/cases/${id}/audit`);
      if (data?.success) {
        setAuditLogs(data.auditHistory || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCaseDetails();
    fetchSureties();
    fetchDelegates();
    fetchTimeline();
    fetchCompliance();
    fetchLegalAid();
    fetchAudit();
  }, [id]);

  // Submit Application
  const handleSubmitApplication = async () => {
    if (!window.confirm('Submit this bail application to the Court Registry for review and judge allocation?')) {
      return;
    }

    try {
      setSubmittingApp(true);
      const { data } = await api.post(`/citizen/cases/${id}/submit`, {
        urgentHearingRequested: assessment?.bnss187?.isMatured || false,
        urgentGrounds: assessment?.bnss187?.isMatured ? 'Section 187 default bail deadline matured' : ''
      });

      if (data?.success) {
        addToast('Bail Application submitted to Court Queue!', 'success');
        setApplication(data.application);
        fetchCaseDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit application', 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Download Draft PDF
  const handleDownloadDraft = async () => {
    try {
      const response = await api.get(`/citizen/cases/${id}/draft-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Draft_Bail_Petition_${caseData?.caseNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Auto-Draft Bail Petition PDF downloaded with DRAFT watermark.', 'success');
    } catch (err) {
      addToast('Failed to download draft petition.', 'error');
    }
  };

  // Download Assessment PDF
  const handleDownloadAssessment = async () => {
    try {
      const response = await api.get(`/citizen/cases/${id}/assessment-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bail_Assessment_${caseData?.caseNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Assessment Report PDF downloaded.', 'success');
    } catch (err) {
      addToast('Failed to download assessment PDF.', 'error');
    }
  };

  // Feature 7: Add Surety
  const handleAddSuretySubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingSurety(true);
      const formData = new FormData();
      Object.keys(suretyForm).forEach((key) => formData.append(key, suretyForm[key]));
      if (suretyFile) formData.append('proofFile', suretyFile);

      const { data } = await api.post(`/citizen/cases/${id}/sureties`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.success) {
        addToast('Surety registered and sent to Registry for verification', 'success');
        setShowAddSuretyModal(false);
        setSuretyForm({
          fullName: '',
          relationship: 'Family Member',
          phone: '',
          address: '',
          solvencyAmount: 25000,
          idProofType: 'Aadhaar',
          idProofNumber: ''
        });
        setSuretyFile(null);
        fetchSureties();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add surety', 'error');
    } finally {
      setSavingSurety(false);
    }
  };

  // Feature 9: Invite Delegate
  const handleInviteDelegateSubmit = async (e) => {
    e.preventDefault();
    try {
      setInvitingDelegate(true);
      const { data } = await api.post(`/citizen/cases/${id}/delegates`, delegateForm);
      if (data?.success) {
        addToast(`Invitation sent to ${delegateForm.delegateEmail}`, 'success');
        setShowInviteDelegateModal(false);
        setDelegateForm({ delegateEmail: '', delegateName: '', delegatePhone: '', relationship: 'Spouse' });
        fetchDelegates();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to invite delegate', 'error');
    } finally {
      setInvitingDelegate(false);
    }
  };

  const handleRevokeDelegate = async (delegateId) => {
    if (!window.confirm('Revoke access for this delegate? They will immediately lose case access.')) return;
    try {
      const { data } = await api.post(`/citizen/cases/${id}/delegates/${delegateId}/revoke`, {
        reason: 'Revoked by primary citizen'
      });
      if (data?.success) {
        addToast('Delegate access revoked', 'info');
        fetchDelegates();
      }
    } catch (err) {
      addToast('Failed to revoke delegate', 'error');
    }
  };

  // Feature 11: Upload and OCR Document
  const handleOcrUpload = async (e) => {
    e.preventDefault();
    if (!ocrFile) return;

    try {
      setUploadingOcr(true);
      const formData = new FormData();
      formData.append('file', ocrFile);
      formData.append('fileType', ocrType);

      const { data } = await api.post(`/citizen/cases/${id}/documents/ocr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.success) {
        addToast('Document uploaded and OCR fields extracted!', 'success');
        setOcrFile(null);
        fetchCaseDetails();
      }
    } catch (err) {
      addToast('Failed to run OCR on document', 'error');
    } finally {
      setUploadingOcr(false);
    }
  };

  // Feature 12: Log Checkin
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoggingCheckin(true);
      const { data } = await api.post(`/citizen/cases/${id}/compliance/checkin`, {
        ...checkinForm,
        checkinDate: new Date()
      });
      if (data?.success) {
        addToast('Check-in logged successfully! Compliance score updated.', 'success');
        setShowCheckinModal(false);
        fetchCompliance();
      }
    } catch (err) {
      addToast('Failed to log check-in', 'error');
    } finally {
      setLoggingCheckin(false);
    }
  };

  // Feature 15: Submit Legal Aid
  const handleLegalAidSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAid(true);
      const { data } = await api.post(`/citizen/cases/${id}/legal-aid`, {
        ...legalAidForm,
        district: caseData?.district || 'Chennai'
      });
      if (data?.success) {
        addToast('Legal aid application transmitted to DLSA!', 'success');
        fetchLegalAid();
      }
    } catch (err) {
      addToast('Failed to submit legal aid request', 'error');
    } finally {
      setSubmittingAid(false);
    }
  };

  if (loading || !caseData) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-medium mt-3">Loading case particulars...</p>
      </div>
    );
  }

  const bnss187 = assessment?.bnss187;
  const bnss479 = assessment?.bnss479;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {caseData.caseNumber}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {caseData.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {caseData.personDetails?.fullName || 'Accused Case Record'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              FIR: <strong>{caseData.firNumber}</strong> • {caseData.policeStation} • {caseData.district}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadDraft}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-teal-600" />
              Auto-Draft Petition
            </button>

            <button
              onClick={handleDownloadAssessment}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              Assessment PDF
            </button>

            {!application ? (
              <button
                onClick={handleSubmitApplication}
                disabled={submittingApp}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submittingApp ? 'Submitting...' : 'Submit to Court Queue'}
              </button>
            ) : (
              <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                App No: {application.applicationNumber}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs for All 15 Matrix Features */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 text-xs font-semibold scrollbar-none">
          {[
            { id: 'assessment', label: '1. Statutory Rights', icon: Scale },
            { id: 'sureties', label: '7. Sureties', icon: ShieldCheck },
            { id: 'delegates', label: '9. Family Access', icon: Users },
            { id: 'timeline', label: '10. Timeline', icon: Clock },
            { id: 'ocr', label: '11. Document Vault & OCR', icon: FileText },
            { id: 'compliance', label: '12. Conditions Compliance', icon: Activity },
            { id: 'legalaid', label: '15. Legal Aid', icon: Building2 },
            { id: 'audit', label: '6. Audit Trail', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Statutory Assessment, Section 187 & Section 479 */}
      {activeTab === 'assessment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 187 Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Feature 1</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                bnss187?.isMatured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {bnss187?.isMatured ? 'MATURED' : `${bnss187?.daysRemaining} DAYS REMAINING`}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Section 187 BNSS Default Bail Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Statutory investigation cut-off ({bnss187?.thresholdDays} days) counted from first judicial remand date ({new Date(caseData.remandDate).toLocaleDateString('en-IN')}).
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-600 mb-1 font-semibold">
                <span>Days Elapsed: {bnss187?.daysElapsed}</span>
                <span>Deadline: {new Date(bnss187?.deadlineDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${bnss187?.isMatured ? 'bg-emerald-500' : 'bg-teal-600'}`}
                  style={{ width: `${Math.min(100, bnss187?.progressPercent || 0)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bnss187?.isMatured
                ? 'Investigation window has elapsed without a chargesheet. An indefeasible right to bail has accrued under Section 187(3) BNSS.'
                : `Accused will be entitled to mandatory default bail if chargesheet is not filed within ${bnss187?.daysRemaining} days.`}
            </p>
          </div>

          {/* Section 479 Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Feature 2</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {caseData.priorConviction ? '1/2 Sentence Rule' : '1/3 First-Offender Rule'}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Section 479 Undertrial Detention Limit
            </h3>
            <p className="text-xs text-slate-500">
              Maximum detention allowance before statutory release under Section 479 BNSS (formerly Sec 436A CrPC).
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Threshold Fraction:</span>
                <span className="text-teal-700">{caseData.priorConviction ? 'One-Half (1/2)' : 'One-Third (1/3)'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Eligibility Status:</span>
                <span className={bnss479?.isEligible ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                  {bnss479?.isEligible ? 'Threshold Reached' : 'Detention threshold not yet reached'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bnss479?.plainReasoning || 'Calculated taking into account leap-year calendar days and statutory exclusions for life imprisonment offences.'}
            </p>
          </div>

          {/* Decision Support & Antil Guidance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 sm:col-span-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Feature 5: Decision Support & "Why this result?"
            </h3>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 text-xs text-slate-700 leading-relaxed space-y-2">
              <div>
                <strong>Statutory Verdict:</strong> {assessment?.verdict}
              </div>
              <div>
                <strong>Legal Grounding:</strong> {assessment?.legalBasis}
              </div>
              <div>
                <strong>Next Legal Steps:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {assessment?.recommendedNextSteps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature 7 - Sureties Readiness */}
      {activeTab === 'sureties' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Surety Readiness Checker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure local solvent sureties are verified by Registry before the bail order is pronounced.
              </p>
            </div>
            <button
              onClick={() => setShowAddSuretyModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Surety
            </button>
          </div>

          {/* Readiness Checklist Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Registered Sureties:</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{suretiesSummary?.total || 0}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Registry Verified:</span>
              <div className="text-base font-bold text-emerald-700 mt-0.5">{suretiesSummary?.verifiedCount || 0}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Readiness Status:</span>
              <div className="mt-0.5">
                {suretiesSummary?.isReady ? (
                  <span className="text-emerald-700 font-bold">✓ Ready for Release</span>
                ) : (
                  <span className="text-amber-700 font-bold">Needs 2 Verified Sureties</span>
                )}
              </div>
            </div>
          </div>

          {/* Sureties Table */}
          {sureties.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No sureties added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Name</th>
                    <th className="py-2">Relationship</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Solvency Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sureties.map((s) => (
                    <tr key={s._id}>
                      <td className="py-2.5 font-bold text-slate-900">{s.fullName}</td>
                      <td className="py-2.5 text-slate-600">{s.relationship}</td>
                      <td className="py-2.5 text-slate-600">{s.phone}</td>
                      <td className="py-2.5 text-slate-900 font-semibold">₹{s.solvencyAmount?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          s.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Surety Modal */}
          {showAddSuretyModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Register New Surety</h3>
                <form onSubmit={handleAddSuretySubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Full Name</label>
                    <input
                      required
                      value={suretyForm.fullName}
                      onChange={(e) => setSuretyForm({ ...suretyForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Relationship to Accused</label>
                    <input
                      required
                      value={suretyForm.relationship}
                      onChange={(e) => setSuretyForm({ ...suretyForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Phone Number</label>
                    <input
                      required
                      value={suretyForm.phone}
                      onChange={(e) => setSuretyForm({ ...suretyForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Solvency Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={suretyForm.solvencyAmount}
                      onChange={(e) => setSuretyForm({ ...suretyForm, solvencyAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ID Proof Number (Aadhaar / Voter ID)</label>
                    <input
                      required
                      value={suretyForm.idProofNumber}
                      onChange={(e) => setSuretyForm({ ...suretyForm, idProofNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Upload Solvency / ID Proof</label>
                    <input
                      type="file"
                      onChange={(e) => setSuretyFile(e.target.files[0])}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddSuretyModal(false)}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSurety}
                      className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                    >
                      {savingSurety ? 'Saving...' : 'Register Surety'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Feature 9 - Family & Representative Delegates */}
      {activeTab === 'delegates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Family & Representative Access
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant read-only access to trusted family members or advocates to monitor case progress.
              </p>
            </div>
            <button
              onClick={() => setShowInviteDelegateModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Invite Delegate
            </button>
          </div>

          {delegates.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No authorized delegates yet.</p>
          ) : (
            <div className="space-y-3">
              {delegates.map((d) => (
                <div key={d._id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{d.delegateName} ({d.relationship})</h4>
                    <p className="text-slate-500 mt-0.5">{d.delegateEmail}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {d.status}
                    </span>
                  </div>
                  {d.status !== 'Revoked' && (
                    <button
                      onClick={() => handleRevokeDelegate(d._id)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Invite Delegate Modal */}
          {showInviteDelegateModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Authorize Case Delegate</h3>
                <form onSubmit={handleInviteDelegateSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Delegate Name</label>
                    <input
                      required
                      value={delegateForm.delegateName}
                      onChange={(e) => setDelegateForm({ ...delegateForm, delegateName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Delegate Email Address</label>
                    <input
                      type="email"
                      required
                      value={delegateForm.delegateEmail}
                      onChange={(e) => setDelegateForm({ ...delegateForm, delegateEmail: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Relationship</label>
                    <input
                      required
                      value={delegateForm.relationship}
                      onChange={(e) => setDelegateForm({ ...delegateForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowInviteDelegateModal(false)}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={invitingDelegate}
                      className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                    >
                      {invitingDelegate ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Feature 10 - Plain-Language Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Plain-Language Case Milestones & "What Happens Next?"
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear statutory guidance on every procedural milestone under the BNSS.
            </p>
          </div>

          <div className="space-y-4">
            {timeline?.milestones?.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{m.stage}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    m.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-slate-600">{m.description}</p>
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900">
                  <strong>What Happens Next:</strong> {m.nextAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Feature 11 - Document Vault & OCR */}
      {activeTab === 'ocr' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Document Vault with Intelligent OCR
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your remand order or FIR. The engine extracts statutory fields for your confirmation.
              </p>
            </div>
          </div>

          {/* Upload & Run OCR Form */}
          <form onSubmit={handleOcrUpload} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
            <select
              value={ocrType}
              onChange={(e) => setOcrType(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white"
            >
              <option value="Remand Order">Remand Order</option>
              <option value="FIR Copy">FIR Copy</option>
              <option value="Chargesheet">Chargesheet</option>
            </select>
            <input
              type="file"
              required
              onChange={(e) => setOcrFile(e.target.files[0])}
              className="text-xs flex-1"
            />
            <button
              type="submit"
              disabled={uploadingOcr}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shrink-0 transition"
            >
              {uploadingOcr ? 'Analyzing OCR...' : 'Upload & Run OCR'}
            </button>
          </form>

          {/* Documents List */}
          <div className="space-y-3">
            {documents.map((d) => (
              <div key={d._id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{d.originalName} ({d.fileType})</h4>
                  <p className="text-slate-400 mt-0.5">Uploaded {new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Feature 12 - Conditions Compliance */}
      {activeTab === 'compliance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Bail Conditions Compliance Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Log weekly police station check-ins to maintain an impeccable compliance record.
              </p>
            </div>
            <button
              onClick={() => setShowCheckinModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <Check className="w-4 h-4" /> Log Station Check-in
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-medium">Compliance Score:</span>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">{compliance?.stats?.complianceScore || 100}%</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Verified Check-ins:</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{compliance?.stats?.verifiedCheckins || 0}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Missed:</span>
              <div className="text-base font-bold text-red-600 mt-0.5">{compliance?.stats?.missedCheckins || 0}</div>
            </div>
          </div>

          {/* Log Checkin Modal */}
          {showCheckinModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Log Police Station Check-in</h3>
                <form onSubmit={handleCheckinSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Police Station</label>
                    <input
                      required
                      value={checkinForm.policeStation}
                      onChange={(e) => setCheckinForm({ ...checkinForm, policeStation: e.target.value })}
                      placeholder={caseData.policeStation}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Officer In-Charge Name</label>
                    <input
                      value={checkinForm.officerName}
                      onChange={(e) => setCheckinForm({ ...checkinForm, officerName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Station General Diary (GD) Entry / Receipt No.</label>
                    <input
                      value={checkinForm.receiptNumber}
                      onChange={(e) => setCheckinForm({ ...checkinForm, receiptNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCheckinModal(false)}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loggingCheckin}
                      className="px-4 py-1.5 bg-teal-600 text-white font-bold rounded-lg"
                    >
                      {loggingCheckin ? 'Logging...' : 'Confirm Check-in'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Feature 15 - Legal Aid */}
      {activeTab === 'legalaid' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              District Legal Services Authority (DLSA) Assistance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Request free statutory legal aid counsel under Section 340 BNSS.
            </p>
          </div>

          {legalAid ? (
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-teal-900">Request Status: {legalAid.status}</span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800">{legalAid.district} DLSA</span>
              </div>
              {legalAid.assignedAdvocate?.name ? (
                <div className="p-3 bg-white rounded-lg border border-teal-200 space-y-1">
                  <div className="font-bold text-slate-900">Assigned DLSA Advocate: {legalAid.assignedAdvocate.name}</div>
                  <div className="text-slate-600">Phone: {legalAid.assignedAdvocate.phone || 'Available via DLSA office'}</div>
                  <div className="text-slate-600">Enrollment: {legalAid.assignedAdvocate.enrollmentNumber}</div>
                </div>
              ) : (
                <p className="text-slate-600">Application under review by DLSA Secretary.</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleLegalAidSubmit} className="space-y-4 max-w-lg text-xs">
              <div>
                <label className="block font-semibold mb-1">Income / Eligibility Category</label>
                <select
                  value={legalAidForm.incomeCategory}
                  onChange={(e) => setLegalAidForm({ ...legalAidForm, incomeCategory: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Incarcerated Undertrial">Incarcerated Undertrial</option>
                  <option value="Below Poverty Line">Below Poverty Line (BPL Card)</option>
                  <option value="Marginal Income">Marginal Income (&lt; Rs. 3 Lakh/yr)</option>
                  <option value="Special Category (Women/SC/ST)">Special Category (Women / SC / ST)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Reason for Requesting State Legal Aid</label>
                <textarea
                  rows={3}
                  required
                  value={legalAidForm.reasonForRequest}
                  onChange={(e) => setLegalAidForm({ ...legalAidForm, reasonForRequest: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={submittingAid}
                className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg text-xs"
              >
                {submittingAid ? 'Submitting...' : 'Transmit to District Legal Aid Office'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 8: Feature 6 - Tamper-Evident Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              Cryptographic SHA-256 Case Audit History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only immutable log of every action taken on this case.
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">#{log.sequenceNumber} [{log.action}]</span>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Hash: {log.hash?.substring(0, 24)}...</div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
