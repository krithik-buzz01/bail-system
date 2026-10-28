import { calculateBNSS479, addFractionalYearsToDate } from '../services/calculators/bnss479.js';

describe('BNSS Section 479: Undertrial Detention Limit Calculator Tests (15+ Edge Cases)', () => {
  const threeYearOffence = {
    section: 'Section 303(2) BNS',
    title: 'Theft',
    maxSentenceYears: 3,
    punishableDeathOrLife: false
  };

  const sevenYearOffence = {
    section: 'Section 318(4) BNS',
    title: 'Cheating',
    maxSentenceYears: 7,
    punishableDeathOrLife: false
  };

  const tenYearOffence = {
    section: 'Section 309(4) BNS',
    title: 'Robbery',
    maxSentenceYears: 10,
    punishableDeathOrLife: false
  };

  const sixMonthOffence = {
    section: 'Section 281 BNS',
    title: 'Rash Driving',
    maxSentenceYears: 0.5,
    punishableDeathOrLife: false
  };

  const murderOffence = {
    section: 'Section 103(1) BNS',
    title: 'Murder',
    maxSentenceYears: 99,
    punishableDeathOrLife: true
  };

  const dacoityOffence = {
    section: 'Section 310(2) BNS',
    title: 'Dacoity',
    maxSentenceYears: 10,
    punishableDeathOrLife: true
  };

  // Edge Case 1: First-time offender with 3-year max sentence (1/3 = 1 year)
  test('Edge Case 1: First-time offender with 3-year sentence applies 1/3 threshold (1 year)', () => {
    const custodyStartDate = '2025-01-01';
    const currentDate = '2026-01-01'; // Exactly 1 year served (365 days)

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: true,
      currentDate
    });

    expect(result.fractionApplied).toBe(1 / 3);
    expect(result.firstOffender).toBe(true);
    expect(result.thresholdReached).toBe(true);
    expect(result.isEligible).toBe(true);
    expect(result.daysRemaining).toBe(0);
  });

  // Edge Case 2: Regular undertrial (prior conviction) with 3-year sentence applies 1/2 threshold (1.5 years)
  test('Edge Case 2: Regular undertrial with prior conviction applies 1/2 threshold (1.5 years)', () => {
    const custodyStartDate = '2025-01-01';
    const currentDate = '2026-01-01'; // 1 year served (not yet 1.5 years)

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: false, // Has prior convictions
      currentDate
    });

    expect(result.fractionApplied).toBe(1 / 2);
    expect(result.firstOffender).toBe(false);
    expect(result.thresholdReached).toBe(false);
    expect(result.isEligible).toBe(false);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  // Edge Case 3: Regular undertrial completes 1/2 sentence (1.5 years)
  test('Edge Case 3: Regular undertrial reaches eligibility after serving 1/2 of sentence (1.5 years)', () => {
    const custodyStartDate = '2024-01-01';
    const currentDate = '2025-07-02'; // 1.5 years later

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: false,
      currentDate
    });

    expect(result.fractionApplied).toBe(0.5);
    expect(result.thresholdReached).toBe(true);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 4: First offender with 7-year sentence (1/3 = 2 years 4 months)
  test('Edge Case 4: First offender with 7-year sentence evaluates 1/3 threshold (2.33 years)', () => {
    const custodyStartDate = '2023-01-01';
    const currentDate = '2025-05-02'; // > 2 years 4 months

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [sevenYearOffence],
      firstOffender: true,
      currentDate
    });

    expect(result.fractionApplied).toBe(1 / 3);
    expect(result.thresholdReached).toBe(true);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 5: Multiple offences in case: governed by highest punishment
  test('Edge Case 5: When multiple offences are charged, governing offence is the one with highest punishment', () => {
    const custodyStartDate = '2025-01-01';
    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence, sevenYearOffence, sixMonthOffence],
      firstOffender: true,
      currentDate: '2025-06-01'
    });

    expect(result.governingOffence.section).toBe(sevenYearOffence.section);
    expect(result.maxSentenceYears).toBe(7);
  });

  // Edge Case 6: Death or Life Imprisonment exclusion (Section 103 BNS Murder)
  test('Edge Case 6: Offence punishable with death or life imprisonment is strictly excluded', () => {
    const custodyStartDate = '2020-01-01';
    const result = calculateBNSS479({
      custodyStartDate,
      offences: [murderOffence],
      firstOffender: true,
      currentDate: '2026-01-01' // 6 years in custody
    });

    expect(result.excludedDeathOrLife).toBe(true);
    expect(result.isEligible).toBe(false);
    expect(result.plainReasoning).toContain('punishable with death or imprisonment for life');
  });

  // Edge Case 7: Dacoity with life imprisonment alternative is excluded
  test('Edge Case 7: Offence with life imprisonment alternative is excluded under Section 479(1)', () => {
    const custodyStartDate = '2020-01-01';
    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence, dacoityOffence],
      firstOffender: true,
      currentDate: '2026-01-01'
    });

    expect(result.excludedDeathOrLife).toBe(true);
    expect(result.isEligible).toBe(false);
  });

  // Edge Case 8: Multiple pending cases restriction (human judicial review flag)
  test('Edge Case 8: When accused has other pending cases, benefit is restricted and flagged for review', () => {
    const custodyStartDate = '2024-01-01';
    const currentDate = '2025-05-01'; // > 1 year served for 3 year offence

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: true,
      otherPendingCases: true, // Has other pending cases
      currentDate
    });

    expect(result.thresholdReached).toBe(true);
    expect(result.multipleCasesFlagged).toBe(true);
    expect(result.isEligible).toBe(false); // Restricted from automatic eligibility
    expect(result.plainReasoning).toContain('pending matters');
  });

  // Edge Case 9: Leap Year handling (2024 is a leap year with 366 days)
  test('Edge Case 9: Leap year custody period correctly incorporates 366 calendar days', () => {
    const custodyStartDate = '2024-01-01'; // Leap year start
    const calculatedTarget = addFractionalYearsToDate(custodyStartDate, 3, 1 / 3); // 1 calendar year later

    // Jan 1 2024 to Jan 1 2025 has 366 days due to Feb 29 2024
    const diffMs = calculatedTarget.getTime() - new Date(custodyStartDate).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(days).toBe(366);
  });

  // Edge Case 10: Non-leap Year comparison (2023 has 365 days)
  test('Edge Case 10: Non-leap year custody period correctly reflects 365 calendar days', () => {
    const custodyStartDate = '2023-01-01';
    const calculatedTarget = addFractionalYearsToDate(custodyStartDate, 3, 1 / 3);

    const diffMs = calculatedTarget.getTime() - new Date(custodyStartDate).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(days).toBe(365);
  });

  // Edge Case 11: Exactly on the threshold date
  test('Edge Case 11: Exactly on threshold date, daysRemaining is 0 and threshold is reached', () => {
    const custodyStartDate = '2025-01-01';
    const targetDate = addFractionalYearsToDate(custodyStartDate, 3, 1 / 3);

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: true,
      currentDate: targetDate
    });

    expect(result.thresholdReached).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 12: Exactly 1 day before threshold date
  test('Edge Case 12: Exactly 1 day before threshold date, daysRemaining is 1 and is not yet eligible', () => {
    const custodyStartDate = '2025-01-01';
    const targetDate = addFractionalYearsToDate(custodyStartDate, 3, 1 / 3);
    const dayBefore = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: true,
      currentDate: dayBefore
    });

    expect(result.thresholdReached).toBe(false);
    expect(result.daysRemaining).toBe(1);
    expect(result.isEligible).toBe(false);
  });

  // Edge Case 13: 1 day after threshold date
  test('Edge Case 13: 1 day after threshold date, daysServed exceeds threshold', () => {
    const custodyStartDate = '2025-01-01';
    const targetDate = addFractionalYearsToDate(custodyStartDate, 3, 1 / 3);
    const dayAfter = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [threeYearOffence],
      firstOffender: true,
      currentDate: dayAfter
    });

    expect(result.thresholdReached).toBe(true);
    expect(result.daysServed).toBeGreaterThan(result.thresholdDays);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 14: Short-term sentence (0.5 years / 6 months rash driving)
  test('Edge Case 14: Offence with 6 months max imprisonment computes 1/3 as 2 months', () => {
    const custodyStartDate = '2026-01-01';
    const targetDate = addFractionalYearsToDate(custodyStartDate, 0.5, 1 / 3); // 2 months -> March 2026

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [sixMonthOffence],
      firstOffender: true,
      currentDate: targetDate
    });

    expect(result.thresholdReached).toBe(true);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 15: 10-year offence with first-offender (1/3 = 3.33 years)
  test('Edge Case 15: 10-year offence for first-offender yields approximately 3.33 years threshold', () => {
    const custodyStartDate = '2022-01-01';
    const currentDate = '2025-06-01'; // ~3.4 years later

    const result = calculateBNSS479({
      custodyStartDate,
      offences: [tenYearOffence],
      firstOffender: true,
      currentDate
    });

    expect(result.fractionApplied).toBe(1 / 3);
    expect(result.thresholdReached).toBe(true);
    expect(result.isEligible).toBe(true);
  });

  // Edge Case 16: Missing custody start date throws error
  test('Edge Case 16: Throws validation error if custody start date is missing', () => {
    expect(() => {
      calculateBNSS479({
        custodyStartDate: null,
        offences: [threeYearOffence]
      });
    }).toThrow('Custody start date is required');
  });

  // Edge Case 17: Empty offences array throws error
  test('Edge Case 17: Throws validation error if offences array is empty', () => {
    expect(() => {
      calculateBNSS479({
        custodyStartDate: '2025-01-01',
        offences: []
      });
    }).toThrow('At least one offence must be provided');
  });
});
