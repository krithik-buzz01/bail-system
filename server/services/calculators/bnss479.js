import { normalizeToISTMidnight, calculateDaysBetween } from './bnss187.js';

/**
 * BNSS Section 479: Undertrial Detention Limit Calculator
 * (Formerly Section 436A of Code of Criminal Procedure, 1973)
 * 
 * Statutory Rules:
 * 1. An undertrial prisoner who has been detained for up to 1/2 of the maximum
 *    sentence for the offence is entitled to release on bail.
 * 2. First-time offender proviso: If the person has no prior convictions,
 *    the detention threshold is relaxed to 1/3 of the maximum imprisonment.
 * 3. Exception 1: Does NOT apply to offences punishable with death or life imprisonment.
 * 4. Exception 2: If accused faces multiple pending cases, the statutory benefit
 *    is restricted and must be flagged for judicial human review.
 */

/**
 * Adds fractional years to a date accounting for leap years and exact calendar months
 * @param {Date} startDate - Normalized start date
 * @param {number} totalYears - Max sentence years
 * @param {number} fraction - 1/3 or 1/2
 */
export const addFractionalYearsToDate = (startDate, totalYears, fraction) => {
  const normStart = normalizeToISTMidnight(startDate);
  const effectiveYears = totalYears * fraction;

  // Split into whole years, whole months, and remaining days
  const wholeYears = Math.floor(effectiveYears);
  const remainingFraction = effectiveYears - wholeYears;
  const wholeMonths = Math.floor(remainingFraction * 12);
  const fractionalMonth = (remainingFraction * 12) - wholeMonths;

  const target = new Date(normStart.getTime());
  target.setUTCFullYear(target.getUTCFullYear() + wholeYears);
  target.setUTCMonth(target.getUTCMonth() + wholeMonths);

  // If there is any leftover fraction of a month, add approximate days (30.4375 days/month)
  if (fractionalMonth > 0.0001) {
    const additionalDays = Math.round(fractionalMonth * 30.4375);
    target.setUTCDate(target.getUTCDate() + additionalDays);
  }

  return normalizeToISTMidnight(target);
};

/**
 * Calculates Section 479 BNSS Undertrial Detention Limit
 * 
 * @param {Object} params
 * @param {Date|string} params.custodyStartDate - Date custody began (arrest or remand)
 * @param {Array} params.offences - Array of offences charged
 * @param {boolean} [params.firstOffender=true] - True if accused has never been convicted previously
 * @param {boolean} [params.otherPendingCases=false] - True if accused has other pending cases/FIRs
 * @param {Date|string} [params.currentDate=new Date()] - Reference date for calculation
 */
export const calculateBNSS479 = ({
  custodyStartDate,
  offences = [],
  firstOffender = true,
  otherPendingCases = false,
  currentDate = new Date()
}) => {
  if (!custodyStartDate) {
    throw new Error('Custody start date is required for Section 479 BNSS calculation');
  }

  const steps = [];
  const normCustodyStart = normalizeToISTMidnight(custodyStartDate);
  const normCurrent = normalizeToISTMidnight(currentDate);

  steps.push(`Custody start date established as ${normCustodyStart.toLocaleDateString('en-IN')}.`);

  // 1. Check for offences punishable with death or life imprisonment
  const deathOrLifeOffence = offences.find((off) => Boolean(off.punishableDeathOrLife));

  if (deathOrLifeOffence) {
    steps.push(
      `Exclusion applied: Offence ${deathOrLifeOffence.section} (${deathOrLifeOffence.title}) carries death or life imprisonment. Under Section 479(1) BNSS, undertrials facing death or life imprisonment are excluded from statutory detention release.`
    );

    const daysServed = calculateDaysBetween(normCustodyStart, normCurrent);

    return {
      section: 'Section 479 BNSS, 2023',
      citation: 'Section 479(1) of Bharatiya Nagarik Suraksha Sanhita, 2023',
      isEligible: false,
      excludedDeathOrLife: true,
      multipleCasesFlagged: Boolean(otherPendingCases),
      daysServed,
      daysRemaining: null,
      thresholdDays: null,
      thresholdDate: null,
      fractionApplied: null,
      fractionLabel: 'Not applicable (Death/Life Imprisonment exclusion)',
      governingOffence: deathOrLifeOffence,
      steps,
      plainReasoning: `Statutory release under Section 479 BNSS is barred because offence ${deathOrLifeOffence.section} is punishable with death or imprisonment for life. Bail may only be considered on general discretionary grounds under Section 480 BNSS.`
    };
  }

  // 2. Identify governing offence with highest maximum punishment
  if (!offences || offences.length === 0) {
    throw new Error('At least one offence must be provided for Section 479 calculation');
  }

  let governingOffence = offences[0];
  for (const off of offences) {
    const currentMax = typeof off.maxSentenceYears === 'number' ? off.maxSentenceYears : 0;
    const govMax = typeof governingOffence.maxSentenceYears === 'number' ? governingOffence.maxSentenceYears : 0;
    if (currentMax > govMax) {
      governingOffence = off;
    }
  }

  const maxSentenceYears = Number(governingOffence.maxSentenceYears) || 0;
  steps.push(
    `Governing offence identified as ${governingOffence.section} (${governingOffence.title}) with a maximum imprisonment of ${maxSentenceYears} years.`
  );

  // 3. Determine applicable fraction: 1/3 for first-time offender (First Proviso), else 1/2
  const fraction = firstOffender ? (1 / 3) : (1 / 2);
  const fractionLabel = firstOffender
    ? 'One-third (1/3) threshold under First Proviso to Section 479(1) BNSS (First-time offender)'
    : 'One-half (1/2) threshold under Section 479(1) BNSS (Regular undertrial)';

  steps.push(
    firstOffender
      ? `Accused has no prior convictions. Applied First Proviso to Section 479(1) BNSS: one-third (1/3) of maximum sentence = ${(maxSentenceYears / 3).toFixed(2)} years.`
      : `Accused has prior convictions. Applied Section 479(1) BNSS: one-half (1/2) of maximum sentence = ${(maxSentenceYears / 2).toFixed(2)} years.`
  );

  // 4. Calculate threshold date and total required days
  const thresholdDate = addFractionalYearsToDate(normCustodyStart, maxSentenceYears, fraction);
  const thresholdDays = calculateDaysBetween(normCustodyStart, thresholdDate);
  const daysServed = calculateDaysBetween(normCustodyStart, normCurrent);
  const daysRemaining = Math.max(0, thresholdDays - daysServed);

  steps.push(
    `Statutory threshold is ${thresholdDays} calendar days. Threshold date calculated as ${thresholdDate.toLocaleDateString('en-IN')}.`
  );
  steps.push(
    `Accused has completed ${daysServed} days in custody as of ${normCurrent.toLocaleDateString('en-IN')}.`
  );

  const thresholdReached = daysServed >= thresholdDays;

  // 5. Check multiple pending cases restriction (flag for human judicial review)
  const multipleCasesFlagged = Boolean(otherPendingCases);
  if (multipleCasesFlagged) {
    steps.push(
      `Restriction flag: Accused has other pending criminal cases. Under Section 479 BNSS Second Proviso, statutory release is restricted and requires judicial consideration of pending matters.`
    );
  }

  // Final eligibility
  const isEligible = thresholdReached && !multipleCasesFlagged;

  let plainReasoning = '';
  if (isEligible) {
    plainReasoning = `The undertrial has completed ${daysServed} days in custody, exceeding the statutory requirement of ${thresholdDays} days (${fraction === 1/3 ? '1/3' : '1/2'} of ${maxSentenceYears} years) on ${thresholdDate.toLocaleDateString('en-IN')}. With no prior convictions and no other pending cases, the accused is entitled to release on bail under Section 479 BNSS.`;
  } else if (thresholdReached && multipleCasesFlagged) {
    plainReasoning = `The undertrial has served ${daysServed} of ${thresholdDays} days required under Section 479 BNSS. However, because other criminal proceedings are pending, automatic statutory release is restricted. The court must review the pending matters before ordering release.`;
  } else {
    plainReasoning = `The undertrial has served ${daysServed} days in custody out of the statutory ${thresholdDays} days required (${fraction === 1/3 ? '1/3' : '1/2'} of ${maxSentenceYears} years). Eligibility date will mature on ${thresholdDate.toLocaleDateString('en-IN')} (${daysRemaining} days remaining).`;
  }

  return {
    section: 'Section 479 BNSS, 2023',
    citation: firstOffender
      ? 'Section 479(1) First Proviso of Bharatiya Nagarik Suraksha Sanhita, 2023'
      : 'Section 479(1) of Bharatiya Nagarik Suraksha Sanhita, 2023',
    isEligible,
    thresholdReached,
    multipleCasesFlagged,
    excludedDeathOrLife: false,
    fractionApplied: fraction,
    fractionLabel,
    firstOffender,
    maxSentenceYears,
    governingOffence,
    custodyStartDate: normCustodyStart,
    thresholdDate,
    thresholdDays,
    daysServed,
    daysRemaining,
    steps,
    plainReasoning
  };
};
