import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calculator, Share2, Copy, Check, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Scale } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const QuickCheck = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const shareToken = searchParams.get('share');

  const [offencesList, setOffencesList] = useState([]);
  const [selectedOffenceId, setSelectedOffenceId] = useState('');
  const [remandDate, setRemandDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFirstOffender, setIsFirstOffender] = useState(true);
  const [hasOtherCases, setHasOtherCases] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOffences = async () => {
      try {
        const { data } = await api.get('/offences');
        if (data?.success) {
          setOffencesList(data.offences || []);
          if (data.offences?.length > 0 && !selectedOffenceId) {
            setSelectedOffenceId(data.offences[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load offences:', err);
      }
    };
    fetchOffences();
  }, []);

  useEffect(() => {
    if (shareToken) {
      const loadShared = async () => {
        try {
          const { data } = await api.get(`/quick-check/${shareToken}`);
          if (data?.success && data.share) {
            setResult(data.share.results);
            setRemandDate(new Date(data.share.remandDate).toISOString().split('T')[0]);
            setIsFirstOffender(data.share.isFirstOffender);
            setHasOtherCases(data.share.hasOtherCases);
            setShareUrl(window.location.href);
          }
        } catch (err) {
          addToast('Shared calculation not found or expired', 'error');
        }
      };
      loadShared();
    }
  }, [shareToken]);

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOffenceId) {
      addToast('Please select a statutory offence', 'error');
      return;
    }

    try {
      setCalculating(true);
      const { data } = await api.post('/quick-check', {
        offenceIds: [selectedOffenceId],
        remandDate,
        isFirstOffender,
        hasOtherCases
      });

      if (data?.success) {
        setResult(data.results);
        setShareUrl(data.shareUrl);
        addToast('Bail calculation completed!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Calculation error', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Shareable link copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveToCase = () => {
    navigate('/cases/new', {
      state: {
        offenceId: selectedOffenceId,
        remandDate,
        isFirstOffender,
        hasOtherCases
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Instant Statutory Calculator (BNSS 2023)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Public Bail Quick Check</h1>
        <p className="text-sm text-slate-600 mt-2">
          Verify statutory default bail (Sec 187) and undertrial detention limit (Sec 479) in seconds without signing up.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-teal-600" />
            Enter Statutory Particulars
          </h2>

          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Offence (BNS 2023)</label>
              <select
                value={selectedOffenceId}
                onChange={(e) => setSelectedOffenceId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {offencesList.map((off) => (
                  <option key={off._id} value={off._id}>
                    {off.section} - {off.title} ({off.maxSentenceYears} yrs, {off.bailable ? 'Bailable' : 'Non-Bailable'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of First Remand to Custody
              </label>
              <input
                type="date"
                required
                value={remandDate}
                onChange={(e) => setRemandDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Date when the Magistrate ordered judicial custody.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFirstOffender}
                  onChange={(e) => setIsFirstOffender(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Accused is a first-time offender (entitled to 1/3 threshold)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOtherCases}
                  onChange={(e) => setHasOtherCases(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Accused has other pending criminal proceedings</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="w-full mt-4 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {calculating ? 'Computing Rights...' : 'Calculate Statutory Entitlement'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="space-y-4">
          {result ? (
            <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Assessment Result</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                  {result.overallAntil || 'Category A'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{result.verdict}</h3>
                <p className="text-xs text-teal-700 font-semibold mt-0.5">{result.legalBasis}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{result.plainReasoning}</p>
              </div>

              {/* Statutory Countdown Blocks */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Sec 187 Investigation Window</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {result.bnss187?.thresholdDays} Days
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {result.bnss187?.isMatured ? (
                      <span className="text-emerald-700 font-bold">✓ Right Matured</span>
                    ) : (
                      <span>{result.bnss187?.daysRemaining} days left</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Sec 479 Detention Threshold</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {result.bnss479?.custodyThresholdFraction || (isFirstOffender ? '1/3' : '1/2')} Term
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {result.bnss479?.isEligible ? (
                      <span className="text-emerald-700 font-bold">✓ Threshold Reached</span>
                    ) : (
                      <span>Not yet reached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Share & Save Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                {shareUrl && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Share'}
                    </button>
                  </div>
                )}

                {user?.role === 'citizen' && (
                  <button
                    type="button"
                    onClick={handleSaveToCase}
                    className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 flex items-center justify-center gap-1.5 transition"
                  >
                    Save as Official Case in My Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">Awaiting Particulars</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Fill the offence and remand date to see the automated statutory breakdown and generate a shareable link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickCheck;
