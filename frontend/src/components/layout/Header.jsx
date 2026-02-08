import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Header = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    return (
        <header className="app-header">
            {/* LEVÁ ČÁST */}
            <div className="header-left">
                <h2 className="app-logo">{t('app_title')}</h2>
            </div>

            {/* STŘED: Jen tučný email */}
            <div className="header-center">
                <span className="current-user-email">
                    {user?.email}
                </span>
            </div>

            {/* PRAVÁ ČÁST */}
            <div className="header-right">
                <LanguageSwitcher />
                <div className="logout-wrapper">
                    <Button onClick={logout} variant="danger">
                        {t('menu.logout')}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;