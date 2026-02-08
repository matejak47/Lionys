import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // 1. Načte překlady ze složky /public/locales
  .use(Backend)
  // 2. Zjistí jazyk uživatele (z localStorage nebo nastavení prohlížeče)
  .use(LanguageDetector)
  // 3. Propojí to s Reactem
  .use(initReactI18next)
  // 4. Nastavení
  .init({
    fallbackLng: 'cs', // Když jazyk nepozná, hodí Češtinu
    debug: true,
    load: 'languageOnly',       // Vypisuje info do konzole (při vývoji super)
    
    interpolation: {
      escapeValue: false, // React se o bezpečnost stará sám
    }
  });

export default i18n;