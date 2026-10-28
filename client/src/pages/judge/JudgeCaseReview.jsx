import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Gavel,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  FileText,
  User,
  Building,
  Calendar,
  Send,
  History,
  Info
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DECISION_OUTCOMES } from '../../config/constants';
import CountdownTimer from '../../components/common/CountdownTimer';

export const JudgeCaseReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [caseFile, setCaseFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Decision Form State
  const [outcome, setOutcome] = useState(DECISION_OUTCOMES.GRANTED);
  const [reasons, setReasons] = useState('');
  const [suretyAmount, setSuretyAmount] = useState(25000);
  const [suretiesCount, setSuretiesCount] = useState(1);
  const [nextHearingDate, setNextHearingDate] = useState('');

  // Selected Conditions Checklist
  const standardConditions = [
    'Execute personal bond with solvent surety in the like amount',
    'Surrender passport or travel documents before the trial court',
    'Report to the jurisdictional Police Station every Monday between 10:00 AM and 11:00 AM',
    'Shall not tamper with prosecution witnesses or evidence directly or indirectly',
    'Shall not leave the territorial jurisdiction without prior leave of the Court',
    'Shall appear promptly before the Court on every date of hearing'
  ];
  const [selectedConditions, setSelectedConditions] = useState([
    standardConditions[0],
    standardConditions[3]
  ]);

  // Triggers Considered Checkbox State (Feature 5)
  const [triggersConsidered, setTriggersConsidered] = useState({
    bnss187Considered: true,
    bnss479Considered: true,
    bailableFlagConsidered: true,
    antilGuidelinesConsidered: true,
    priorConvictionConsidered: true
  });

  const fetchCaseFile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/judge/cases/${id}`);
      if (data?.success) {
        setCaseFile(data.caseFile);

        // Prepopulate if decision already exists
        if (data.caseFile.existingDecision) {
          const dec = data.caseFile.existingDecision;
          setOutcome(dec.outcome);
          setReasons(dec.reasons);
          setSuretyAmount(dec.suretyAmount || 0);
          setSuretiesCount(dec.suretiesCount || 1);
          if (dec.conditions) setSelectedConditions(dec.conditions);
          if (dec.triggersConsidered) setTriggersConsidered(dec.triggersConsidered);
          if (dec.nextHearingDate) {
            setNextHearingDate(new Date(dec.nextHearingDate).toISOString().split('T')[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load judicial case file:', err);
      addToast({
        type: 'error',
        title: 'Unauthorized / Not Found',
        message: err.response?.data?.message || 'Failed to open case file.'
      });
      navigate('/judge/queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseFile();
  }, [id]);

  const toggleCondition = (cond) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!reasons || reasons.trim().length < 5) {
      addToast({ type: 'warning', title: 'Judicial Reasons Required', message: 'Please enter reasons for decision.' });
      return;
    }

    if (!window.confirm(`Confirm order: Pronounce [${outcome}] for this application?`)) return;

    setSubmitting(true);
    try {
      const payload = {
        outcome,
        reasons,
        conditions: outcome.includes('Granted') ? selectedConditions : [],
        suretyAmount: outcome.includes('Granted') ? Number(suretyAmount) : 0,
        suretiesCount: outcome.includes('Granted') ? Number(suretiesCount) : 0,
        nextHearingDate: nextHearingDate || null,
        triggersConsidered
      };

      const { data } = await api.post(`/judge/cases/${id}/decision`, payload);
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Judicial Order Recorded',
          message: data.message
        });
        await fetchCaseFile();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.response?.data?.message || 'Error recording decision.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !caseFile) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading bench case file & decision support metrics...</p>
      </div>
    );
  }

  const { application, caseDetails, citizen, documents, assessment, decisionSupport, existingDecision } = caseFile;
  const person = caseDetails.personDetails || {};
  const offences = caseDetails.offences || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-900">
              Bench Docket
            </span>
            <h1 className="text-xl font-bold text-slate-900">{application.applicationNumber}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {caseDetails.caseNumber}
            </span>
            <span
              className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
                application.status === 'Decided'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}
            >
              {application.status}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            FIR: <strong>{caseDetails.firNumber}</strong> ({caseDetails.policeStation} PS, {caseDetails.district}) &bull; Court:{' '}
            <strong>{caseDetails.court}</strong>
          </p>
        </div>

        <Link
          to="/judge/queue"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
        >
          &larr; Back to Bench Queue
        </Link>
      </div>

      {/* Grid: Case Details & Feature 5 Decision Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Decision Support Panel & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature 5: Decision Support Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-navy-900 text-teal-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Feature 5: Judicial Decision-Support Panel
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Explainable statutory triggers & Satender Kumar Antil (2022) criteria
                  </p>
                </div>
              </div>

              {/* Advisory Badge */}
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                <Info className="w-3 h-3 text-amber-600" />
                <span>Advisory Only &bull; Human-in-the-Loop</span>
              </span>
            </div>

            {/* Triggers Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {decisionSupport.statutoryTriggers.map((t, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    t.isMet
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{t.trigger}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        t.isMet ? 'bg-emerald-200/60 text-emerald-900' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.isMet ? 'Trigger Met' : 'General Scrutiny'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{t.statusText}</p>
                  <div className="pt-1 text-[10px] text-slate-500 border-t border-black/5 flex justify-between">
                    <span>Source: {t.ruleSource}</span>
                    <span>v{t.version}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Statutory Reasoning Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900">Rule Engine Advisory Summary:</span>
              <p className="text-slate-700 leading-relaxed">{assessment.plainReasoning}</p>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
              Attached Case Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400">No documents uploaded by applicant.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {documents.map((doc) => (
                  <div key={doc._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">{doc.originalName}</p>
                      <span className="text-[10px] text-slate-400">{doc.fileType} &bull; {(doc.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <a
                      href={`/uploads/${doc.fileName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-[11px] font-semibold"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Accused Details & Countdown */}
        <div className="space-y-6">
          {/* Section 187 Countdown */}
          {assessment?.bnss187 && <CountdownTimer bnss187={assessment.bnss187} compact={false} />}

          {/* Accused & Case Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pb-2 border-b border-slate-100">
              Accused Person & Timeline
            </h3>
            <div className="space-y-2 text-slate-700">
              <div>Name: <strong className="text-slate-900">{person.fullName}</strong></div>
              <div>Age / Gender: <strong>{person.age} yrs, {person.gender}</strong></div>
              <div>Remand Date: <strong>{new Date(caseDetails.remandDate).toLocaleDateString('en-IN')}</strong></div>
              <div>Prior Convictions: <strong>{caseDetails.priorConviction ? 'Yes' : 'None (First Offender)'}</strong></div>
              <div>Other Pending Matters: <strong>{caseDetails.otherPendingCases ? 'Yes' : 'None'}</strong></div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 text-[11px] block">Offences Charged:</span>
              {offences.map((off, idx) => (
                <div key={idx} className="text-[11px] text-slate-600">
                  &bull; <strong>{off.section}</strong>: {off.title} ({off.antilCategory}, Max: {off.maxSentenceYears} yrs)
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Recording Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gavel className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900">
              {existingDecision ? 'Update Pronounced Judicial Order' : 'Pronounce & Record Judicial Order'}
            </h3>
          </div>
          {existingDecision && (
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Order on Record: {existingDecision.outcome}
            </span>
          )}
        </div>

        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          {/* Outcome Radio Buttons */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-2">Judicial Determination / Order *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Bail Granted', val: DECISION_OUTCOMES.GRANTED, color: 'text-emerald-700 border-emerald-300 bg-emerald-50/50' },
                { label: 'Granted with Conditions', val: DECISION_OUTCOMES.CONDITIONAL, color: 'text-teal-700 border-teal-300 bg-teal-50/50' },
                { label: 'Bail Rejected', val: DECISION_OUTCOMES.REJECTED, color: 'text-rose-700 border-rose-300 bg-rose-50/50' }
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`p-3 rounded-xl border-2 flex items-center space-x-3 cursor-pointer transition-all ${
                    outcome === opt.val
                      ? `${opt.color} ring-2 ring-teal-500 font-bold`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value={opt.val}
                    checked={outcome === opt.val}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Judicial Reasons */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">
              Judicial Reasons / Grounds of Order *
            </label>
            <textarea
              rows={3}
              required
              value={reasons}
              onChange={(e) => setReasons(e.target.value)}
              placeholder="State reasons considering undertrial detention duration, nature of accusation, flight risk, and statutory considerations under BNSS..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Conditions & Surety (if Granted) */}
          {outcome !== DECISION_OUTCOMES.REJECTED && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Bail Conditions & Surety Bonds
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Surety Amount (INR)</label>
                  <input
                    type="number"
                    value={suretyAmount}
                    onChange={(e) => setSuretyAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Number of Sureties</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={suretiesCount}
                    onChange={(e) => setSuretiesCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Conditions Checklist */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Select Conditions Imposed:</label>
                <div className="space-y-1.5">
                  {standardConditions.map((cond, idx) => {
                    const isChecked = selectedConditions.includes(cond);
                    return (
                      <label
                        key={idx}
                        className={`p-2.5 rounded-lg border flex items-center space-x-2.5 cursor-pointer text-xs ${
                          isChecked ? 'bg-teal-50 border-teal-300 text-teal-950 font-medium' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCondition(cond)}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Next Hearing Date */}
          <div className="w-full sm:w-1/2">
            <label className="block font-semibold text-slate-700 mb-1">Next Hearing Date (if required)</label>
            <input
              type="date"
              value={nextHearingDate}
              onChange={(e) => setNextHearingDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Triggers Considered Checklist (Feature 5 Requirement) */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">
              Statutory Triggers Consideration Record (Recorded in Audit Ledger):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triggersConsidered.bnss187Considered}
                  onChange={(e) =>
                    setTriggersConsidered({ ...triggersConsidered, bnss187Considered: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span>Considered Section 187 investigation timeline (60/90 days)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triggersConsidered.bnss479Considered}
                  onChange={(e) =>
                    setTriggersConsidered({ ...triggersConsidered, bnss479Considered: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span>Considered Section 479 undertrial detention threshold</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triggersConsidered.bailableFlagConsidered}
                  onChange={(e) =>
                    setTriggersConsidered({ ...triggersConsidered, bailableFlagConsidered: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span>Considered statutory bailable / non-bailable classification</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={triggersConsidered.antilGuidelinesConsidered}
                  onChange={(e) =>
                    setTriggersConsidered({ ...triggersConsidered, antilGuidelinesConsidered: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span>Considered Satender Kumar Antil (2022) guidelines</span>
              </label>
            </div>
          </div>

          {/* Submit Order Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              <Gavel className="w-4 h-4 text-teal-400" />
              <span>{submitting ? 'Pronouncing & Recording Order...' : 'Pronounce & Record Judicial Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JudgeCaseReview;
