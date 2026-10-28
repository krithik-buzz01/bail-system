import { calculateBNSS187, normalizeToISTMidnight, calculateDaysBetween } from '../services/calculators/bnss187.js';

describe('BNSS Section 187: Default Bail Calculator Tests', () => {
  const generalOffence = {
    section: 'Section 303(2) BNS',
    title: 'Theft',
    maxSentenceYears: 3,
    punishableDeathOrLife: false
  };

  const heinousOffenceTenYears = {
    section: 'Section 309(4) BNS',
    title: 'Robbery',
    maxSentenceYears: 10,
    punishableDeathOrLife: false
  };

  const deathOrLifeOffence = {
    section: 'Section 103(1) BNS',
    title: 'Murder',
    maxSentenceYears: 99,
    punishableDeathOrLife: true
  };

  test('Test 1: Applies 60-day threshold for offences with < 10 years imprisonment', () => {
    const remandDate = '2026-01-01';
    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: '2026-01-10'
    });

    expect(result.thresholdDays).toBe(60);
    expect(result.heinousCategory).toBe(false);
    expect(result.daysElapsed).toBe(9);
    expect(result.daysRemaining).toBe(51);
    expect(result.isMatured).toBe(false);
  });

  test('Test 2: Applies 90-day threshold for offence with maxSentenceYears >= 10', () => {
    const remandDate = '2026-01-01';
    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence, heinousOffenceTenYears],
      currentDate: '2026-01-15'
    });

    expect(result.thresholdDays).toBe(90);
    expect(result.heinousCategory).toBe(true);
    expect(result.daysElapsed).toBe(14);
    expect(result.daysRemaining).toBe(76);
  });

  test('Test 3: Applies 90-day threshold for offence punishable with death or life', () => {
    const remandDate = '2026-01-01';
    const result = calculateBNSS187({
      remandDate,
      offences: [deathOrLifeOffence],
      currentDate: '2026-01-01'
    });

    expect(result.thresholdDays).toBe(90);
    expect(result.heinousCategory).toBe(true);
    expect(result.daysRemaining).toBe(90);
  });

  test('Test 4: Exactly on the 60th day - right to default bail matures', () => {
    const remandDate = '2026-01-01';
    // 60 days after Jan 1 is March 2 (2026 is non-leap: Jan=31, Feb=28 -> 31+28=59 -> March 2 is day 60)
    const exactDay60 = new Date(new Date('2026-01-01T00:00:00.000Z').getTime() + 60 * 24 * 60 * 60 * 1000);

    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: exactDay60
    });

    expect(result.daysElapsed).toBe(60);
    expect(result.daysRemaining).toBe(0);
    expect(result.isMatured).toBe(true);
    expect(result.progressPercentage).toBe(100);
  });

  test('Test 5: One day before 60-day threshold - right is NOT yet matured', () => {
    const remandDate = '2026-01-01';
    const day59 = new Date(new Date('2026-01-01T00:00:00.000Z').getTime() + 59 * 24 * 60 * 60 * 1000);

    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: day59
    });

    expect(result.daysElapsed).toBe(59);
    expect(result.daysRemaining).toBe(1);
    expect(result.isMatured).toBe(false);
  });

  test('Test 6: Day 61 (past threshold) without chargesheet - right remains matured', () => {
    const remandDate = '2026-01-01';
    const day65 = new Date(new Date('2026-01-01T00:00:00.000Z').getTime() + 65 * 24 * 60 * 60 * 1000);

    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: day65,
      investigationStatus: 'In Progress'
    });

    expect(result.daysElapsed).toBe(65);
    expect(result.daysRemaining).toBe(0);
    expect(result.isMatured).toBe(true);
  });

  test('Test 7: Chargesheet filed within 60 days extinguishes statutory default bail', () => {
    const remandDate = '2026-01-01';
    const day45 = new Date(new Date('2026-01-01T00:00:00.000Z').getTime() + 45 * 24 * 60 * 60 * 1000);
    const day65 = new Date(new Date('2026-01-01T00:00:00.000Z').getTime() + 65 * 24 * 60 * 60 * 1000);

    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: day65,
      investigationStatus: 'Chargesheet Filed',
      chargesheetDate: day45
    });

    expect(result.chargesheetFiledInTime).toBe(true);
    expect(result.isMatured).toBe(false);
  });

  test('Test 8: Custom admin-configured thresholds (e.g. 45 days / 75 days) respected', () => {
    const remandDate = '2026-01-01';
    const result = calculateBNSS187({
      remandDate,
      offences: [generalOffence],
      currentDate: '2026-01-10',
      customThresholds: { generalDays: 45, heinousDays: 75 }
    });

    expect(result.thresholdDays).toBe(45);
  });
});
