import React from 'react';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const CountdownTimer = ({ bnss187, compact = false }) => {
  if (!bnss187) return null;

  const {
    thresholdDays = 60,
    daysElapsed = 0,
    daysRemaining = 0,
    progressPercentage = 0,
    isMatured = false,
    deadlineDate,
    heinousCategory = false
  } = bnss187;

  const formattedDeadline = deadlineDate
    ? new Date(deadlineDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Pending';

  const isUrgent = daysRemaining <= 3 && !isMatured;
  const isApproaching = daysRemaining > 3 && daysRemaining <= 7 && !isMatured;

  const badgeColor = isMatured
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isUrgent
    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
    : isApproaching
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-sky-100 text-sky-800 border-sky-300';

  const progressColor = isMatured
    ? 'bg-emerald-500'
    : isUrgent
    ? 'bg-rose-500'
    : isApproaching
    ? 'bg-amber-500'
    : 'bg-teal-500';

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
        >
          <Clock className="w-3 h-3 mr-1" />
          {isMatured ? 'Right Matured' : `${daysRemaining}d left`}
        </span>
        <span className="text-[11px] text-slate-500">Target: {formattedDeadline}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${isMatured ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Section 187 BNSS: Investigation Countdown
            </h4>
            <p className="text-[11px] text-slate-500">
              {heinousCategory ? '90-Day Heinous Threshold' : '60-Day General Threshold'}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {isMatured ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Default Bail Matured!
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 mr-1" />
              {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Remaining
            </>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span>Served: {daysElapsed} days</span>
          <span>Statutory Limit: {thresholdDays} days</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${progressColor}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span>Deadline Date: <strong className="text-slate-700 font-semibold">{formattedDeadline}</strong></span>
        <span className="text-[11px] text-teal-700 font-medium">Sec 187(3) BNSS</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
