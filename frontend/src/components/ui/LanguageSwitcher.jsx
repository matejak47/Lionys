import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="lang-switcher">
      {/* Tlačítka s dynamickou třídou 'active' */}
      <button 
        className={`lang-btn ${i18n.resolvedLanguage === 'cs' ? 'active' : ''}`}
        onClick={() => changeLanguage('cs')}
      >
        CZ
      </button>
      
      <button 
        className={`lang-btn ${i18n.resolvedLanguage === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      
      <button 
        className={`lang-btn ${i18n.resolvedLanguage === 'de' ? 'active' : ''}`}
        onClick={() => changeLanguage('de')}>
        DE
      </button>
    </div>
  );
};

export default LanguageSwitcher;