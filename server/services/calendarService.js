import Hearing from '../models/Hearing.js';

/**
 * Checks whether a proposed hearing clashes with any existing scheduled hearing for the given judge
 * @param {string} judgeId 
 * @param {Date|string} hearingDate 
 * @param {string} startTime 
 * @param {string} endTime 
 * @param {string} excludeHearingId 
 */
export const checkHearingClash = async ({ judgeId, hearingDate, startTime = '10:30', endTime = '11:00', excludeHearingId = null }) => {
  const targetDate = new Date(hearingDate);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

  const query = {
    judgeId,
    hearingDate: { $gte: startOfDay, $lte: endOfDay },
    status: 'Scheduled'
  };

  if (excludeHearingId) {
    query._id = { $ne: excludeHearingId };
  }

  const existingHearings = await Hearing.find(query).lean();

  // Helper to convert "HH:MM" to minutes from midnight
  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const newStartMin = toMinutes(startTime);
  const newEndMin = toMinutes(endTime);

  const clashes = existingHearings.filter((h) => {
    const hStart = toMinutes(h.startTime || '10:30');
    const hEnd = toMinutes(h.endTime || '11:00');
    // Overlap condition: startA < endB && startB < endA
    return newStartMin < hEnd && hStart < newEndMin;
  });

  return {
    hasClash: clashes.length > 0,
    clashingHearings: clashes
  };
};

/**
 * Generates an iCalendar (.ics) string for a hearing
 */
export const generateIcsContent = ({ hearing, caseData, courtRoom, judgeName }) => {
  const dateObj = new Date(hearing.hearingDate);
  
  const [startH, startM] = (hearing.startTime || '10:30').split(':').map(Number);
  const [endH, endM] = (hearing.endTime || '11:00').split(':').map(Number);

  const pad = (n) => String(n).padStart(2, '0');

  const dtStart = `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(startH)}${pad(startM)}00`;
  const dtEnd = `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(endH)}${pad(endM)}00`;
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const uid = `hearing-${hearing._id}@bailreckoner.gov.in`;
  const summary = `Bail Hearing: Case ${caseData?.caseNumber || 'Court Matter'}`;
  const description = `Bail Application Hearing before ${judgeName || 'Hon. Judge'}\\nCourtroom: ${courtRoom || hearing.courtRoom}\\nPurpose: ${hearing.purpose || 'Statutory Hearing'}`;
  const location = `${courtRoom || hearing.courtRoom}, District & Sessions Court, Tamil Nadu`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bail Reckoner TN//BNSS 2023 Judicial Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Bail Hearing tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Bail Hearing in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};
