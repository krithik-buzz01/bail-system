import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';

const savedLanguage = localStorage.getItem('bail_reckoner_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta }
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('bail_reckoner_lang', lang);
};

export default i18n;
