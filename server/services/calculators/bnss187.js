/**
 * BNSS Section 187: Default Bail Deadline Calculator
 * (Formerly Section 167(2) Code of Criminal Procedure, 1973)
 * 
 * Accused in custody is entitled to statutory default bail if the investigating
 * agency fails to file a chargesheet within:
 * - 90 days: Where offence is punishable with death, imprisonment for life, or >= 10 years
 * - 60 days: For any other offence
 */

/**
 * Normalizes a date to midnight in IST (Indian Standard Time, UTC + 05:30)
 */
export const normalizeToISTMidnight = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date passed to normalizeToISTMidnight');
  }
  // Offset in ms for IST (5 hours 30 mins)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + IST_OFFSET_MS);

  // Extract Year, Month, Date in IST
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();

  // Return UTC timestamp corresponding to midnight IST
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
};

/**
 * Calculates calendar days difference between two dates normalized to IST
 */
export const calculateDaysBetween = (startDate, endDate) => {
  const start = normalizeToISTMidnight(startDate).getTime();
  const end = normalizeToISTMidnight(endDate).getTime();
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Evaluates Default Bail eligibility and deadlines under Section 187 BNSS, 2023
 * 
 * @param {Object} params
 * @param {Date|string} params.remandDate - Date of first remand by Magistrate
 * @param {Array} params.offences - Array of offences charged
 * @param {Date|string} [params.currentDate] - Reference date (defaults to now)
 * @param {Object} [params.customThresholds] - Admin-configured thresholds ({ generalDays: 60, heinousDays: 90 })
 * @param {string} [params.investigationStatus] - 'In Progress' or 'Chargesheet Filed'
 * @param {Date|string} [params.chargesheetDate] - Date chargesheet was filed (if applicable)
 */
export const calculateBNSS187 = ({
  remandDate,
  offences = [],
  currentDate = new Date(),
  customThresholds = { generalDays: 60, heinousDays: 90 },
  investigationStatus = 'In Progress',
  chargesheetDate = null
}) => {
  if (!remandDate) {
    throw new Error('Remand date is required for Section 187 BNSS calculation');
  }

  const normRemand = normalizeToISTMidnight(remandDate);
  const normCurrent = normalizeToISTMidnight(currentDate);

  // Check if any offence falls under heinous criteria (Death, Life, or >= 10 years imprisonment)
  const heinousOffence = offences.find((off) => {
    const isDeathOrLife = Boolean(off.punishableDeathOrLife);
    const isTenPlus = typeof off.maxSentenceYears === 'number' && off.maxSentenceYears >= 10;
    return isDeathOrLife || isTenPlus;
  });

  const isHeinous = Boolean(heinousOffence);
  const thresholdDays = isHeinous
    ? customThresholds.heinousDays || 90
    : customThresholds.generalDays || 60;

  // Deadline is Remand Date + thresholdDays
  const deadlineDate = new Date(normRemand.getTime() + thresholdDays * 24 * 60 * 60 * 1000);

  // Days elapsed since remand
  const daysElapsed = calculateDaysBetween(normRemand, normCurrent);
  const daysRemaining = Math.max(0, thresholdDays - daysElapsed);
  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / thresholdDays) * 100)));

  // If chargesheet was filed before deadline, default bail is extinguished
  let chargesheetFiledInTime = false;
  if (investigationStatus === 'Chargesheet Filed' && chargesheetDate) {
    const normChargesheet = normalizeToISTMidnight(chargesheetDate);
    if (normChargesheet <= deadlineDate) {
      chargesheetFiledInTime = true;
    }
  }

  const isMatured = daysElapsed >= thresholdDays && !chargesheetFiledInTime;

  let plainReasoning = '';
  let citation = 'Section 187(3) of Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)';

  if (chargesheetFiledInTime) {
    plainReasoning = `The investigating agency filed the chargesheet within the statutory period of ${thresholdDays} days. Default bail under Section 187 BNSS is no longer available; regular bail under Section 480 BNSS must be sought.`;
  } else if (isMatured) {
    plainReasoning = `The statutory investigation period of ${thresholdDays} days expired on ${deadlineDate.toLocaleDateString('en-IN')}. Since no chargesheet was filed within this period, the accused has an INDEFEASIBLE right to default bail under Section 187(3) BNSS, upon furnishing bail bonds.`;
  } else {
    plainReasoning = `The accused has spent ${daysElapsed} days in custody out of the statutory limit of ${thresholdDays} days. Default bail right will mature on ${deadlineDate.toLocaleDateString('en-IN')} (${daysRemaining} days remaining) if no chargesheet is filed.`;
  }

  return {
    section: 'Section 187 BNSS, 2023',
    citation,
    heinousCategory: isHeinous,
    triggerOffence: heinousOffence ? `${heinousOffence.section} (${heinousOffence.title})` : null,
    thresholdDays,
    remandDate: normRemand,
    deadlineDate,
    currentDate: normCurrent,
    daysElapsed,
    daysRemaining,
    progressPercentage,
    isMatured,
    chargesheetFiledInTime,
    plainReasoning
  };
};
