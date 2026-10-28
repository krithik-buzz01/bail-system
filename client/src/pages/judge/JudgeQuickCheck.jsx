import React, { useState, useEffect } from 'react';
import { Calculator, Scale, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const JudgeQuickCheck = () => {
  const { addToast } = useToast();
  const [offencesList, setOffencesList] = useState([]);
  const [selectedOffenceId, setSelectedOffenceId] = useState('');
  const [remandDate, setRemandDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFirstOffender, setIsFirstOffender] = useState(true);
  const [hasOtherCases, setHasOtherCases] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchOffences = async () => {
      try {
        const { data } = await api.get('/offences');
        if (data?.success) {
          setOffencesList(data.offences || []);
          if (data.offences?.length > 0) {
            setSelectedOffenceId(data.offences[0]._id);
          }
        }
      } catch (err) {}
    };
    fetchOffences();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
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
      }
    } catch (err) {
      addToast('Calculation error', 'error');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-teal-600" />
          Bench Quick Calculator (On-Bench Judicial Decision Support)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Perform immediate statutory inquiries during courtroom arguments under BNSS 187 & 479
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleCalculate} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b">Case Query Parameters</h2>
          <div>
            <label className="block text-xs font-semibold mb-1">Charged Offence</label>
            <select
              value={selectedOffenceId}
              onChange={(e) => setSelectedOffenceId(e.target.value)}
              className="w-full text-xs border rounded-lg p-2.5 bg-white"
            >
              {offencesList.map((off) => (
                <option key={off._id} value={off._id}>
                  {off.section} - {off.title} ({off.maxSentenceYears} yrs, {off.bailable ? 'Bailable' : 'Non-Bailable'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">First Remand Date</label>
            <input
              type="date"
              required
              value={remandDate}
              onChange={(e) => setRemandDate(e.target.value)}
              className="w-full text-xs border rounded-lg p-2"
            />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFirstOffender}
                onChange={(e) => setIsFirstOffender(e.target.checked)}
                className="rounded text-teal-600 w-4 h-4"
              />
              <span>First-time offender (1/3 custody threshold rule)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasOtherCases}
                onChange={(e) => setHasOtherCases(e.target.checked)}
                className="rounded text-teal-600 w-4 h-4"
              />
              <span>Multiple pending proceedings (flagged for review)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={calculating}
            className="w-full py-2.5 bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition"
          >
            {calculating ? 'Evaluating...' : 'Query Statutory Thresholds'}
          </button>
        </form>

        <div>
          {result ? (
            <div className="bg-white rounded-2xl border border-teal-200 p-6 space-y-4 shadow-sm">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                {result.overallAntil || 'Category A'}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{result.verdict}</h3>
              <p className="text-xs text-teal-700 font-semibold">{result.legalBasis}</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border">
                {result.plainReasoning}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-500 font-medium">Sec 187 Window:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{result.bnss187?.thresholdDays} Days</div>
                  <div className="text-[11px] text-teal-700 font-semibold">{result.bnss187?.daysRemaining} days left</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-500 font-medium">Sec 479 Threshold:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{result.bnss479?.custodyThresholdFraction} Term</div>
                  <div className="text-[11px] text-slate-600">{result.bnss479?.isEligible ? 'Eligible' : 'Not yet eligible'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-400">
              Select an offence and remand date to perform an on-bench query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeQuickCheck;
