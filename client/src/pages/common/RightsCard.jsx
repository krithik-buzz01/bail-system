import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  Square,
  Download,
  BookOpen,
  ShieldCheck,
  Globe,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const RightsCard = () => {
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const currentLang = i18n.language || 'en';
  const isTamil = currentLang === 'ta';

  const [rights, setRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSpeakingKey, setActiveSpeakingKey] = useState(null);

  useEffect(() => {
    const fetchRights = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/rights');
        if (data?.success) {
          setRights(data.rights || []);
        }
      } catch (err) {
        console.error('Failed to load rights content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRights();

    // Cancel speech on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech API Read-Aloud with graceful fallback
  const handleReadAloud = (right) => {
    if (!('speechSynthesis' in window)) {
      addToast({
        type: 'warning',
        title: 'Speech Unavailable',
        message: 'Your browser does not support the Web Speech API audio synthesis.'
      });
      return;
    }

    // If currently speaking this right, stop it
    if (activeSpeakingKey === right.key) {
      window.speechSynthesis.cancel();
      setActiveSpeakingKey(null);
      return;
    }

    window.speechSynthesis.cancel();

    const title = isTamil ? right.titleTa : right.titleEn;
    const description = isTamil ? right.descriptionTa : right.descriptionEn;
    const legalBasis = right.legalBasis;
    const textToSpeak = `${title}. ${description}. Legal authority: ${legalBasis}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isTamil ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.95; // Gentle pace for legal clarity

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) => (isTamil ? v.lang.startsWith('ta') : v.lang.startsWith('en'))
    );
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => setActiveSpeakingKey(right.key);
    utterance.onend = () => setActiveSpeakingKey(null);
    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      setActiveSpeakingKey(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopAllSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-navy-800/80 px-2.5 py-1 rounded-md border border-teal-500/20">
              Constitutional & Statutory Protections
            </span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              BNSS 2023 & Arts. 20, 21, 22
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('rights.title')}</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">{t('rights.subtitle')}</p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {activeSpeakingKey && (
            <button
              onClick={handleStopAllSpeech}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>{t('common.stop')}</span>
            </button>
          )}

          <a
            href={`/api/rights/pdf?lang=${currentLang}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('rights.download_card')}</span>
          </a>
        </div>
      </div>

      {/* Persistent Information Notice */}
      <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start space-x-3 text-xs text-sky-950">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Every citizen detained or arrested in the territory of India possesses non-negotiable statutory safeguards. Click <strong>"{t('common.read_aloud')}"</strong> on any right to hear clear voice narration in your selected language ({isTamil ? 'தமிழ்' : 'English'}).
        </p>
      </div>

      {/* Rights Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading legal rights cards...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rights.map((right, index) => {
            const isSpeaking = activeSpeakingKey === right.key;
            const title = isTamil ? right.titleTa : right.titleEn;
            const description = isTamil ? right.descriptionTa : right.descriptionEn;

            return (
              <div
                key={right._id || right.key}
                className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  isSpeaking
                    ? 'bg-teal-50/90 border-teal-500 shadow-md ring-2 ring-teal-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {right.category || 'Safeguard'}
                      </span>
                    </div>

                    {/* Read Aloud Button */}
                    <button
                      onClick={() => handleReadAloud(right)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                        isSpeaking
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                          <span>{t('common.stop')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t('common.listen')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{description}</p>
                </div>

                {/* Legal Authority Citation */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">{t('rights.legal_basis_label')}:</span>
                  <span className="font-semibold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200/50">
                    {right.legalBasis}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RightsCard;
