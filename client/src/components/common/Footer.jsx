import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4 sm:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Persistent Legal Disclaimer */}
        <div className="flex items-start space-x-2.5 max-w-2xl">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-slate-300">
            <strong className="text-white font-medium">Statutory Disclaimer:</strong>{' '}
            {t('common.disclaimer')} Calculations are based on provisions of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) and the Bharatiya Nyaya Sanhita, 2023 (BNS).
          </p>
        </div>

        {/* Links and Authority Info */}
        <div className="flex items-center space-x-6 text-[11px] text-slate-400">
          <a
            href="https://slsa.tn.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            Tamil Nadu SLSA
          </a>
          <a
            href="https://nalsa.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            NALSA India
          </a>
          <span>Toll-Free Legal Aid: <strong>15100</strong></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
