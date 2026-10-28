import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, BookOpen, Scale, PhoneCall, ChevronDown, ChevronUp, Shield, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpPage = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'What is Section 187 BNSS (Default Bail) and how does it work?',
      a: 'Section 187(3) of the Bharatiya Nagarik Suraksha Sanhita, 2023 (replacing Section 167(2) CrPC) mandates that the police must complete investigation and file a chargesheet within 60 or 90 days from the first judicial remand. If they fail to do so, the accused has an absolute, indefeasible fundamental right under Article 21 of the Constitution to be released on default bail.'
    },
    {
      q: 'What is the First-Time Offender benefit under Section 479 BNSS?',
      a: 'Under the First Proviso to Section 479(1) BNSS (formerly Section 436A CrPC), if an undertrial has never been convicted of any offence in the past, they are entitled to release on bail once they have undergone detention for one-third (1/3) of the maximum statutory term prescribed for that offence, rather than one-half.'
    },
    {
      q: 'Who qualifies for free Legal Aid in Tamil Nadu?',
      a: 'Under Section 340 BNSS read with Section 12 of the Legal Services Authorities Act, 1987, any arrested person or undertrial unable to afford legal representation, women, children, members of SC/ST, and individuals below statutory income limits are entitled to free, qualified legal counsel through the District Legal Services Authority (DLSA).'
    },
    {
      q: 'What is a "Bail Bond" and who can act as a "Surety"?',
      a: 'A bail bond is a formal financial undertaking given to the court ensuring the accused will appear for all hearing dates. A surety is a responsible individual (often family member or friend) who deposits personal guarantee and proofs of solvency (such as Aadhaar, property tax receipts, or bank statements) affirming the accused will comply with court conditions.'
    },
    {
      q: 'What is the role of the Auto-Drafted Petition?',
      a: 'Bail Reckoner compiles all factual particulars, custody timelines, and relevant Supreme Court citations (e.g. Satender Kumar Antil v. CBI) into a court-ready petition. All petitions carry a prominent watermark "DRAFT: for review by a licensed advocate" to ensure an advocate verifies the document before presentation in court.'
    }
  ];

  const statutoryGlossary = [
    { bnss: 'Section 187 BNSS', crpc: 'Section 167(2) CrPC', desc: 'Police custody limits & 60/90-day statutory default bail' },
    { bnss: 'Section 479 BNSS', crpc: 'Section 436A CrPC', desc: 'Undertrial maximum detention threshold (1/3 for first-offenders)' },
    { bnss: 'Section 478 BNSS', crpc: 'Section 436 CrPC', desc: 'Bail as of mandatory right in bailable offences' },
    { bnss: 'Section 480 BNSS', crpc: 'Section 437 CrPC', desc: 'Magisterial bail in non-bailable offences' },
    { bnss: 'Section 482 BNSS', crpc: 'Section 438 CrPC', desc: 'Anticipatory bail before Sessions / High Court' },
    { bnss: 'Section 483 BNSS', crpc: 'Section 439 CrPC', desc: 'Special powers of High Court / Sessions Court regarding bail' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-teal-600" />
          Bail Reckoner Help & Statutory Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Plain-language legal assistance, procedure walk-throughs, and legal aid directory
        </p>
      </div>

      {/* Quick Helplines Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">National Legal Aid Toll-Free Helpline: 15100</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                24x7 free legal advice provided by NALSA and Tamil Nadu State Legal Services Authority
              </p>
            </div>
          </div>
          <Link
            to="/legal-aid"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shrink-0"
          >
            Find District DLSA <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Statutory Cross-Reference Glossary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-teal-600" />
          BNSS 2023 vs. CrPC 1973 Quick Cross-Reference Table
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          The Bharatiya Nagarik Suraksha Sanhita, 2023 replaced the historic Code of Criminal Procedure, 1973. Key bail provisions map as follows:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">New Law (BNSS 2023)</th>
                <th className="py-2.5 px-3">Historic Law (CrPC 1973)</th>
                <th className="py-2.5 px-3">Legal Subject Matter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {statutoryGlossary.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-bold text-teal-700">{g.bnss}</td>
                  <td className="py-2.5 px-3 text-slate-600">{g.crpc}</td>
                  <td className="py-2.5 px-3 text-slate-800">{g.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-teal-600" />
          Frequently Asked Questions (FAQ)
        </h3>
        <div className="divide-y divide-slate-100">
          {faqs.map((f, i) => (
            <div key={i} className="py-3.5">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-teal-700 text-sm gap-4"
              >
                <span>{f.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq === i && (
                <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Disclaimer Footer Note */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Important Legal Notice:</strong> Bail Reckoner is an administrative decision-support platform.
          All calculations, draft petitions, and timelines generated are for informational and legal assistance purposes only.
          Final authority to grant bail rests exclusively with the jurisdictional Court of Law.
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
