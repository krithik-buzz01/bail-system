import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  Clock,
  Calculator,
  FileText,
  Volume2,
  Gavel,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Lock,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/constants';

export const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === ROLES.ADMIN) return '/admin/dashboard';
    if (user.role === ROLES.JUDGE) return '/judge/queue';
    return '/citizen/dashboard';
  };

  const primaryFeatures = [
    {
      num: '01',
      title: 'Custody Freedom Clock & Deadlines',
      section: 'BNSS Section 187 (formerly CrPC 167(2))',
      description:
        'Live 60/90-day statutory countdown from judicial remand date with automated email alerts at T-7, T-3, T-1, and T-0 days to prevent unlawful custody.',
      icon: Clock,
      color: 'from-blue-600 to-teal-500'
    },
    {
      num: '02',
      title: 'Section 479 Detention Calculator',
      section: 'BNSS Section 479 (formerly CrPC 436A)',
      description:
        'Computes 1/3 threshold for first-time offenders and 1/2 for regular undertrials with leap-year awareness and multiple-case restriction flags.',
      icon: Calculator,
      color: 'from-teal-600 to-emerald-500'
    },
    {
      num: '03',
      title: 'Bail Draft Studio & Auto-Drafter',
      section: 'Sections 480 & 187 BNSS Petitions',
      description:
        'Instantly synthesizes formal court pleadings, grounds, and prayers with a watermark "DRAFT: for review by a licensed advocate".',
      icon: FileText,
      color: 'from-navy-800 to-navy-900'
    },
    {
      num: '04',
      title: 'Bilingual Rights Cards & Voice',
      section: 'Constitution Arts. 20-22 & BNSS Protections',
      description:
        'Accessible English and Tamil rights cards with Web Speech API voice read-aloud and printable one-page PDF cards for courtroom and family use.',
      icon: Volume2,
      color: 'from-amber-600 to-orange-500'
    },
    {
      num: '05',
      title: 'Explainable Legal Decision Support',
      section: 'Satender Kumar Antil (2022) SC Criteria',
      description:
        'Advisory bench panel showing statutory custody ratios, Antil Categories A-D, prior convictions, and human-in-the-loop judicial order drafting.',
      icon: Gavel,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      num: '06',
      title: 'Tamper-Evident SHA-256 Audit Trail',
      section: 'Cryptographic Hash Ledger',
      description:
        'Every sensitive action is immutably linked in an append-only ledger with real-time browser integrity verification.',
      icon: ShieldCheck,
      color: 'from-slate-800 to-navy-950'
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section with Gavel & Handcuffs Image Background */}
      <section
        className="relative overflow-hidden rounded-3xl text-white shadow-2xl border border-slate-700/50"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(8, 20, 42, 0.94) 0%, rgba(10, 25, 52, 0.88) 50%, rgba(5, 14, 30, 0.80) 100%), url('/images/legal-hero-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10 max-w-4xl p-8 sm:p-14 lg:p-16 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Statutory Bail Assessment & Legal Rights Platform
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed max-w-2xl font-normal">
            A production-quality decision-support system for undertrial prisoners, families, judicial benches, and legal aid registries. Automated calculation of statutory custody thresholds, default bail maturity dates, and bilingual rights cards.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to={getPortalLink()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-950 font-extrabold text-sm shadow-xl transition-all flex items-center space-x-2 transform hover:-translate-y-0.5"
            >
              <span>{user ? 'Go to Your Dashboard' : 'Open Bail Reckoner'}</span>
              <ArrowRight className="w-4 h-4 text-navy-950" />
            </Link>

            <Link
              to="/quick-check"
              className="px-5 py-3.5 rounded-xl bg-navy-800/90 hover:bg-navy-700 text-white border border-teal-500/40 font-bold text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>Public Quick Check</span>
            </Link>

            <Link
              to="/rights"
              className="px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Know Your Rights (EN / தமிழ்)
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Sec 187 (60/90 Days)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Sec 479 (1/3 First Offender)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Satender Antil Guidelines</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>NALSA 15100 Integration</span>
            </span>
          </div>
        </div>

        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
      </section>

      {/* The 6 Pillars of Bail Reckoner */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            The Six Pillars of Bail Reckoner
          </h2>
          <p className="text-xs text-slate-500">
            Engineered strictly according to the statutory reforms of BNSS 2023 and landmark Supreme Court rulings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {primaryFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-teal-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center shadow`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-300">{feat.num}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{feat.title}</h3>
                    <span className="text-[11px] text-teal-700 font-semibold block mt-0.5">
                      {feat.section}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  <span>Statutorily Grounded</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Portals Breakdown */}
      <section className="bg-slate-100 rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-200">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Three Dedicated Role-Based Portals
          </h2>
          <p className="text-xs text-slate-500">
            Dedicated workflows with strict Role-Based Access Control (RBAC) ensuring data boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 w-fit">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Citizen Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For undertrial prisoners' families and representatives. 4-step case wizard, document scanner with OCR suggestions, custody freedom clock, sureties, family delegates, and auto-draft petition.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline pt-2"
            >
              Citizen Sign In &rarr;
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-navy-50 text-navy-900 w-fit">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Judge Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Invite-only bench queue for Judicial Officers. Decision-Support Panel with explainable statutory triggers, Antil checklists, calendar clash detection, and tamper-logged orders.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block text-xs font-bold text-navy-800 hover:text-navy-900 hover:underline pt-2"
            >
              Judge Sign In &rarr;
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Admin & Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Court analytics, deadline watchtower, offence rule manager, case routing & judge assignment, surety verification, hearing control room, and SHA-256 audit ledger.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline pt-2"
            >
              Registry Login &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Official Legal Aid Banner */}
      <section className="bg-gradient-to-r from-teal-900 to-navy-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-800/40 px-2.5 py-1 rounded">
            Legal Services Authorities Act, 1987
          </span>
          <h3 className="text-xl sm:text-2xl font-bold">
            Free Legal Representation for Undertrials
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every undertrial prisoner has a statutory and constitutional right to free legal aid under Article 39A of the Constitution and Section 340 BNSS. Access Tamil Nadu DLSA contact directories and helpline 15100 directly.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/legal-aid"
            className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-navy-950 font-bold text-xs shadow-md transition"
          >
            DLSA Directory
          </Link>
          <a
            href="tel:15100"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center space-x-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
            <span>Toll-Free 15100</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
