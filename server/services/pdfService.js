import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Adds the mandatory semi-transparent draft watermark across every page
 */
const addDraftWatermark = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc.rotate(-45, { origin: [300, 400] });
    doc.fontSize(36);
    doc.fillColor('#94a3b8');
    doc.fillOpacity(0.18);
    doc.text('DRAFT: for review by a licensed advocate', -50, 380, {
      align: 'center',
      width: 700
    });
    doc.restore();
  }
};

/**
 * Feature 3: Auto-Draft Bail Application PDF Generator
 */
export const generateBailDraftPdf = ({ caseData, template, assessment }, stream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      bufferPages: true
    });

    doc.pipe(stream);

    const person = caseData.personDetails || {};
    const offences = caseData.offences || [];
    const offencesStr = offences.map((o) => `${o.section} (${o.act}) - ${o.title}`).join(', ');

    // Header: Court Details
    doc.fontSize(13).font('Helvetica-Bold').text(
      `IN THE COURT OF ${caseData.court ? caseData.court.toUpperCase() : 'THE SESSIONS JUDGE / MAGISTRATE'}`,
      { align: 'center' }
    );
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`AT ${caseData.district ? caseData.district.toUpperCase() : 'DISTRICT'}, TAMIL NADU`, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text(`CRIMINAL MISCELLANEOUS PETITION NO. _______ OF ${new Date().getFullYear()}`, { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').text(`(In Crime No. ${caseData.firNumber} of ${caseData.policeStation} Police Station)`, { align: 'center' });
    doc.moveDown(1.5);

    // Parties
    doc.fontSize(10).font('Helvetica-Bold').text('IN THE MATTER OF:');
    doc.fontSize(10).font('Helvetica').text(
      `${person.fullName}, Age ${person.age || '—'} years, ${person.gender || ''}, residing at ${person.address || '—'}`
    );
    doc.fontSize(10).font('Helvetica-Bold').text('... PETITIONER / ACCUSED');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('VERSUS');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(
      `STATE REPRESENTED BY THE INSPECTOR OF POLICE,\n${caseData.policeStation} Police Station, ${caseData.district} District.`
    );
    doc.fontSize(10).font('Helvetica-Bold').text('... RESPONDENT / PROSECUTION');
    doc.moveDown(1.5);

    // Petition Title
    const petitionTitle = assessment && assessment.verdict.includes('Default Bail')
      ? 'PETITION FOR STATUTORY DEFAULT BAIL UNDER SECTION 187(3) OF BHARTIYA NAGARIK SURAKSHA SANHITA, 2023'
      : assessment && assessment.verdict.includes('479')
      ? 'PETITION FOR RELEASE ON BAIL UNDER SECTION 479 OF BHARTIYA NAGARIK SURAKSHA SANHITA, 2023'
      : 'PETITION FOR REGULAR BAIL UNDER SECTION 480 OF BHARTIYA NAGARIK SURAKSHA SANHITA, 2023';

    doc.fontSize(11).font('Helvetica-Bold').text(petitionTitle, { align: 'center', underline: true });
    doc.moveDown(1);

    // Formal Address
    doc.fontSize(10).font('Helvetica-Bold').text('MOST RESPECTFULLY SHEWETH:');
    doc.moveDown(0.5);

    // Paragraph 1: Accusation
    doc.font('Helvetica').text(
      `1. That the Petitioner has been falsely implicated in Crime No. ${caseData.firNumber} registered at ${caseData.policeStation} Police Station for alleged offences under ${offencesStr || 'applicable sections of law'}.`
    );
    doc.moveDown(0.6);

    // Paragraph 2: Custody timeline
    const remandStr = caseData.remandDate ? new Date(caseData.remandDate).toLocaleDateString('en-IN') : 'N/A';
    const arrestStr = caseData.arrestDate ? new Date(caseData.arrestDate).toLocaleDateString('en-IN') : 'N/A';
    doc.text(
      `2. That the Petitioner was arrested on ${arrestStr} and was produced before this Hon'ble Court and remanded to judicial custody on ${remandStr}. The Petitioner has been in continuous incarceration since then.`
    );
    doc.moveDown(0.6);

    // Paragraph 3: Grounds derived from Assessment Engine
    doc.font('Helvetica-Bold').text('3. GROUNDS FOR BAIL:');
    doc.font('Helvetica');

    const grounds = [];
    if (assessment) {
      if (assessment.bnss187 && assessment.bnss187.isMatured) {
        grounds.push(
          `A. INDEFEASIBLE DEFAULT BAIL RIGHT: The statutory investigation period of ${assessment.bnss187.thresholdDays} days expired on ${new Date(assessment.bnss187.deadlineDate).toLocaleDateString('en-IN')}. No police report/chargesheet was filed within the statutory period, entitling the Petitioner to mandatory bail under Section 187(3) BNSS, 2023.`
        );
      }
      if (assessment.bnss479 && assessment.bnss479.isEligible) {
        grounds.push(
          `B. STATUTORY DETENTION LIMIT EXCEEDED: The Petitioner has undergone detention of ${assessment.bnss479.daysServed} days, which exceeds ${assessment.bnss479.fractionApplied === 1/3 ? 'one-third (first offender)' : 'one-half'} of the maximum sentence under Section 479 BNSS, 2023.`
        );
      }
      if (assessment.isBailableAll) {
        grounds.push(
          `C. BAILABLE AS OF RIGHT: All offences charged are classified as bailable under the First Schedule of BNSS, 2023; bail is an absolute right under Section 478 BNSS.`
        );
      }
    }

    // Standard civil liberty & Antil grounds
    grounds.push(
      'D. The Petitioner is an innocent citizen with roots in society, has permanent residence, and there is no risk of absconding or tampering with evidence.'
    );
    grounds.push(
      'E. The Petitioner is ready and willing to furnish solvent sureties and comply with any reasonable conditions imposed by this Hon\'ble Court.'
    );
    grounds.push(
      'F. Continued incarceration without trial violates the fundamental guarantee of personal liberty under Article 21 of the Constitution of India.'
    );

    grounds.forEach((g) => {
      doc.text(g, { indent: 15 });
      doc.moveDown(0.4);
    });
    doc.moveDown(0.5);

    // Prayer Clause
    doc.font('Helvetica-Bold').text('4. PRAYER:');
    doc.font('Helvetica').text(
      'Wherefore, in the light of the facts and statutory grounds stated above, it is most respectfully prayed that this Hon\'ble Court may be pleased to enlarge the Petitioner on bail in Crime No. ' +
        caseData.firNumber +
        ' on the file of the Respondent Police Station, and pass such other or further orders as this Hon\'ble Court may deem fit and proper in the interest of justice.',
      { indent: 15 }
    );
    doc.moveDown(1.5);

    // Signatures
    doc.font('Helvetica-Bold').text('ADVOCATE FOR PETITIONER', 60, doc.y, { align: 'left' });
    doc.text('PETITIONER / AUTHORISED AGENT', 340, doc.y - 12, { align: 'right' });
    doc.moveDown(2);

    // Verification Block
    doc.fontSize(9).font('Helvetica-Bold').text('VERIFICATION', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica').text(
      `I, ${person.fullName}, the Petitioner / relative of the accused above-named, do hereby verify that the contents of paragraphs 1 to 4 are true and correct to the best of my knowledge and legal advice received. Verified at ${caseData.district || 'Tamil Nadu'} on this ${new Date().toLocaleDateString('en-IN')}.`,
      { align: 'justify' }
    );
    doc.moveDown(1);
    doc.text('DEPONENT', { align: 'right' });

    // Watermark across all pages
    addDraftWatermark(doc);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

/**
 * Generates Assessment Report PDF
 */
export const generateAssessmentPdf = ({ caseData, assessment }, stream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });

    doc.pipe(stream);

    // Banner Header
    doc.rect(0, 0, 612, 60).fill('#0b192c');
    doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text('BAIL RECKONER', 50, 18);
    doc.fontSize(10).fillColor('#41b06e').text('STATUTORY ASSESSMENT REPORT | BNSS 2023', 50, 38);

    doc.moveDown(2.5);
    doc.fillColor('#0f172a');

    // Case Details Table-like summary
    doc.fontSize(12).font('Helvetica-Bold').text('CASE OVERVIEW', { underline: true });
    doc.moveDown(0.5);

    const person = caseData.personDetails || {};
    doc.fontSize(9).font('Helvetica');
    doc.text(`Case Number: ${caseData.caseNumber}  |  FIR: ${caseData.firNumber} (${caseData.policeStation})`);
    doc.text(`Accused Name: ${person.fullName}  |  Age: ${person.age}  |  Gender: ${person.gender}`);
    doc.text(`Remand Date: ${caseData.remandDate ? new Date(caseData.remandDate).toLocaleDateString('en-IN') : 'N/A'}`);
    doc.text(`Court: ${caseData.court}  |  District: ${caseData.district}`);
    doc.text(`Prior Convictions: ${caseData.priorConviction ? 'Yes' : 'None (First-time offender)'}`);
    doc.text(`Other Pending Cases: ${caseData.otherPendingCases ? 'Yes' : 'No'}`);
    doc.moveDown(1);

    // Offences
    doc.fontSize(11).font('Helvetica-Bold').text('OFFENCES CHARGED:');
    doc.moveDown(0.3);
    const offences = caseData.offences || [];
    offences.forEach((off, idx) => {
      doc.fontSize(9).font('Helvetica').text(
        `${idx + 1}. ${off.section} (${off.act}) - ${off.title} | Max Sentence: ${off.maxSentenceYears} yrs | ${off.bailable ? 'Bailable' : 'Non-bailable'} | Antil: ${off.antilCategory}`
      );
    });
    doc.moveDown(1);

    // Verdict Box
    const isEligible = assessment.verdict.toLowerCase().includes('eligible') || assessment.isBailableAll;
    const boxBg = isEligible ? '#ecfdf5' : '#fef2f2';
    const boxBorder = isEligible ? '#10b981' : '#ef4444';

    doc.rect(50, doc.y, 512, 60).fillAndStroke(boxBg, boxBorder);
    const textY = doc.y + 12;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(`VERDICT: ${assessment.verdict}`, 65, textY);
    doc.fontSize(9).font('Helvetica').text(`Legal Basis: ${assessment.legalBasis}`, 65, textY + 20);
    doc.y = textY + 55;
    doc.moveDown(0.8);

    // Section 187 Summary
    doc.fontSize(11).font('Helvetica-Bold').text('1. DEFAULT BAIL STATUS (SECTION 187 BNSS)');
    doc.fontSize(9).font('Helvetica');
    if (assessment.bnss187) {
      doc.text(`Investigation Deadline Threshold: ${assessment.bnss187.thresholdDays} Days`);
      doc.text(`Days In Custody: ${assessment.bnss187.daysElapsed}  |  Days Remaining: ${assessment.bnss187.daysRemaining}`);
      doc.text(`Maturity Date: ${new Date(assessment.bnss187.deadlineDate).toLocaleDateString('en-IN')}`);
      doc.text(`Status: ${assessment.bnss187.isMatured ? 'MATURED - Right Accrued' : 'Counting Down'}`);
    }
    doc.moveDown(0.8);

    // Section 479 Summary
    doc.fontSize(11).font('Helvetica-Bold').text('2. UNDERTRIAL DETENTION LIMIT (SECTION 479 BNSS)');
    doc.fontSize(9).font('Helvetica');
    if (assessment.bnss479) {
      if (assessment.bnss479.excludedDeathOrLife) {
        doc.text('Excluded: Offence punishable with death or life imprisonment.');
      } else {
        doc.text(`Fraction Applied: ${assessment.bnss479.fractionApplied === 1/3 ? '1/3 (First Offender)' : '1/2 (Regular Undertrial)'}`);
        doc.text(`Statutory Threshold: ${assessment.bnss479.thresholdDays} Days`);
        doc.text(`Days Served: ${assessment.bnss479.daysServed}  |  Days Remaining: ${assessment.bnss479.daysRemaining}`);
        doc.text(`Status: ${assessment.bnss479.isEligible ? 'ELIGIBLE FOR RELEASE' : 'Threshold Not Reached'}`);
      }
    }
    doc.moveDown(0.8);

    // Plain Language Reasoning
    doc.fontSize(11).font('Helvetica-Bold').text('PLAIN LANGUAGE REASONING:');
    doc.fontSize(9).font('Helvetica').text(assessment.plainReasoning || 'N/A', { align: 'justify' });
    doc.moveDown(0.8);

    // Next Steps
    doc.fontSize(11).font('Helvetica-Bold').text('RECOMMENDED NEXT STEPS:');
    const steps = assessment.recommendedNextSteps || [];
    steps.forEach((st) => {
      doc.fontSize(9).font('Helvetica').text(`• ${st}`);
    });
    doc.moveDown(1.5);

    // Persistent Disclaimer Footer
    doc.fontSize(8).fillColor('#64748b').font('Helvetica-Oblique').text(
      'DISCLAIMER: This assessment report is generated for informational and legal-literacy guidance under the Bharatiya Nagarik Suraksha Sanhita, 2023. It does not constitute formal legal advice. Undertrials and their families are advised to consult a licensed advocate or contact the District Legal Services Authority (DLSA) for legal aid.',
      { align: 'center' }
    );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

/**
 * Feature 4: Printable One-Page Rights Card PDF Generator (English / Tamil)
 */
export const generateRightsCardPdf = ({ rightsList = [], language = 'en' }, stream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 35, bottom: 35, left: 45, right: 45 }
    });

    doc.pipe(stream);

    const isTamil = language === 'ta';

    // Header
    doc.rect(0, 0, 612, 55).fill('#0b192c');
    doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold').text(
      isTamil
        ? 'ARRESTEE RIGHTS CARD / கைது செய்யப்பட்டோரின் உரிமைகள்'
        : 'ARRESTEE RIGHTS CARD | BNSS 2023 & CONSTITUTION',
      45,
      14
    );
    doc.fontSize(9).fillColor('#41b06e').text(
      isTamil
        ? 'சட்ட உதவி மற்றும் அரசியலமைப்பு உரிமைகள் வழிகாட்டி'
        : 'Statutory Safeguards under BNSS 2023 & Constitutional Articles 21, 22',
      45,
      32
    );

    doc.moveDown(2);
    doc.fillColor('#0f172a');

    rightsList.forEach((right, index) => {
      if (doc.y > 720) {
        doc.addPage();
      }

      const title = isTamil ? `${right.titleTa} (${right.titleEn})` : right.titleEn;
      const desc = isTamil ? right.descriptionTa : right.descriptionEn;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0369a1').text(`${index + 1}. ${title}`);
      doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(desc, { indent: 12 });
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b').text(`Legal Basis: ${right.legalBasis}`, { indent: 12 });
      doc.moveDown(0.5);
    });

    // Footer
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#94a3b8').text(
      'National Legal Services Authority Helpline: 15100 | Tamil Nadu State Legal Services Authority: slsa.tn.gov.in',
      { align: 'center' }
    );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};
