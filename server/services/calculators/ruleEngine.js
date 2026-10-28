import { calculateBNSS187 } from './bnss187.js';
import { calculateBNSS479 } from './bnss479.js';
import { ANTIL_CATEGORIES } from '../../config/constants.js';

/**
 * Master Rule Engine for Bail Assessment under BNSS, 2023 & Supreme Court Guidelines
 * Evaluates:
 * - Section 478 BNSS (Bailable offences)
 * - Section 187 BNSS (Default Bail)
 * - Section 479 BNSS (Undertrial maximum detention)
 * - Satender Kumar Antil v. CBI (2022) Offence Categorization
 */
export const runBailAssessment = ({
  caseData,
  customThresholds = { generalDays: 60, heinousDays: 90 },
  currentDate = new Date()
}) => {
  const {
    personDetails,
    offences = [],
    arrestDate,
    remandDate,
    priorConviction = false,
    otherPendingCases = false,
    investigationStatus = 'In Progress',
    chargesheetDate = null
  } = caseData;

  const custodyDate = remandDate || arrestDate;

  // 1. Run BNSS 187 Default Bail Calculator
  const bnss187Result = calculateBNSS187({
    remandDate: custodyDate,
    offences,
    currentDate,
    customThresholds,
    investigationStatus,
    chargesheetDate
  });

  // 2. Run BNSS 479 Detention Limit Calculator
  const bnss479Result = calculateBNSS479({
    custodyStartDate: custodyDate,
    offences,
    firstOffender: !priorConviction,
    otherPendingCases,
    currentDate
  });

  // 3. Check if all offences are Bailable
  const isBailableAll = offences.length > 0 && offences.every((off) => Boolean(off.bailable));

  // 4. Determine overall Antil Category (highest severity among offences)
  let overallAntil = ANTIL_CATEGORIES.A;
  if (offences.some((o) => o.antilCategory === ANTIL_CATEGORIES.C)) {
    overallAntil = ANTIL_CATEGORIES.C;
  } else if (offences.some((o) => o.antilCategory === ANTIL_CATEGORIES.D)) {
    overallAntil = ANTIL_CATEGORIES.D;
  } else if (offences.some((o) => o.antilCategory === ANTIL_CATEGORIES.B)) {
    overallAntil = ANTIL_CATEGORIES.B;
  }

  // 5. Build statutory triggers met
  const statutoryTriggersMet = [];
  if (isBailableAll) statutoryTriggersMet.push('ALL_OFFENCES_BAILABLE');
  if (bnss187Result.isMatured) statutoryTriggersMet.push('SECTION_187_DEFAULT_BAIL_MATURED');
  if (bnss479Result.isEligible) statutoryTriggersMet.push('SECTION_479_DETENTION_LIMIT_ELIGIBLE');
  if (bnss479Result.thresholdReached && bnss479Result.multipleCasesFlagged) {
    statutoryTriggersMet.push('SECTION_479_FLAGGED_MULTIPLE_CASES');
  }
  if (!priorConviction) statutoryTriggersMet.push('FIRST_TIME_OFFENDER');
  if (overallAntil === ANTIL_CATEGORIES.A) statutoryTriggersMet.push('ANTIL_CATEGORY_A');

  // 6. Synthesize final Verdict and Next Steps
  let verdict = '';
  let legalBasis = '';
  let plainReasoning = '';
  const recommendedNextSteps = [];

  if (isBailableAll) {
    verdict = 'Bailable Offence - Bail as of Right';
    legalBasis = 'Section 478 Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Section 436 CrPC)';
    plainReasoning = 'All offences charged against the accused are bailable under the First Schedule of BNSS. Under Section 478 BNSS, bail is a mandatory statutory right upon furnishing reasonable surety or personal bond.';
    recommendedNextSteps.push('Submit a formal bail bond / application directly before the Court or Police Station under Section 478 BNSS.');
    recommendedNextSteps.push('If indigent and unable to furnish surety within a week, request discharge on personal recognizance under the proviso to Section 478 BNSS.');
  } else if (bnss187Result.isMatured) {
    verdict = 'Statutory Right to Default Bail Matured';
    legalBasis = bnss187Result.citation;
    plainReasoning = `The statutory investigation timeframe of ${bnss187Result.thresholdDays} days has elapsed since remand without a chargesheet being filed. An indefeasible statutory right to default bail has accrued.`;
    recommendedNextSteps.push('Immediately file an application for default bail under Section 187(3) BNSS before the jurisdictional Magistrate.');
    recommendedNextSteps.push('State readiness and willingness to furnish solvent sureties or personal bond.');
    recommendedNextSteps.push('Ensure application is submitted before any delayed chargesheet is accepted by the court.');
  } else if (bnss479Result.isEligible) {
    verdict = 'Eligible for Statutory Undertrial Release';
    legalBasis = bnss479Result.citation;
    plainReasoning = bnss479Result.plainReasoning;
    recommendedNextSteps.push('File a petition under Section 479 BNSS for immediate release on bail.');
    recommendedNextSteps.push('Attach jail custody certificate verifying custody duration from the Superintendent of Prison.');
    recommendedNextSteps.push('Highlight first-time offender status under First Proviso to Section 479(1) BNSS.');
  } else if (bnss479Result.thresholdReached && bnss479Result.multipleCasesFlagged) {
    verdict = 'Human Review Required: Multiple Cases Flagged';
    legalBasis = 'Section 479 Second Proviso BNSS, 2023';
    plainReasoning = 'The undertrial has completed the detention threshold, but the presence of other pending criminal cases restricts automatic statutory release. Judicial evaluation of the pending proceedings is required.';
    recommendedNextSteps.push('File petition under Section 479 BNSS bringing all pending case records and status to the court\'s attention.');
    recommendedNextSteps.push('Request the court to exercise its discretion in light of the nature of the other cases.');
  } else if (overallAntil === ANTIL_CATEGORIES.A && !priorConviction) {
    verdict = 'Likely Eligible for Regular Bail (Category A Offence)';
    legalBasis = 'Section 480 BNSS, 2023 read with Satender Kumar Antil v. CBI (2022)';
    plainReasoning = 'The offences carry a maximum punishment of 7 years or less and the accused is a first-time offender. Under Supreme Court guidelines in Satender Kumar Antil v. CBI, bail should ordinary be granted without unnecessary incarceration.';
    recommendedNextSteps.push('File regular bail application under Section 480 BNSS before the Magistrate or Sessions Court.');
    recommendedNextSteps.push('Cite Supreme Court directions in Satender Kumar Antil (Category A).');
  } else {
    verdict = 'Not Yet Statutorily Eligible for Automatic Release';
    legalBasis = 'Section 480 BNSS, 2023 (Regular Discretionary Bail)';
    plainReasoning = `Statutory periods under Section 187 (${bnss187Result.daysRemaining} days remaining) and Section 479 (${bnss479Result.daysRemaining || 'N/A'} days remaining) have not yet matured. Regular bail must be sought on merit under Section 480 BNSS.`;
    recommendedNextSteps.push('Apply for regular bail under Section 480 BNSS presenting factual defense, community ties, and lack of flight risk.');
    recommendedNextSteps.push('Monitor the live countdown for Section 187 default bail deadline.');
  }

  // Record rule versions used
  const ruleVersions = offences.map((off) => ({
    offenceId: off.offenceId || off._id,
    section: off.section,
    versionNumber: off.versionUsed || off.currentVersion || 1
  }));

  return {
    verdict,
    legalBasis,
    plainReasoning,
    recommendedNextSteps,
    isBailableAll,
    overallAntil,
    statutoryTriggersMet,
    bnss187: bnss187Result,
    bnss479: bnss479Result,
    ruleVersions,
    disclaimer: 'Guidance only, not legal advice. Please consult a lawyer or your District Legal Services Authority.'
  };
};
