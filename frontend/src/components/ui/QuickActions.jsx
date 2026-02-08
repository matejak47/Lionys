import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const QuickActions = () => {
    const { t } = useTranslation();

    return (
        <div className="card quick-actions-widget">
            <h3 className="widget-title">{t('dashboard.quick_actions')}</h3>
            
            <div className="actions-grid">
                {/* 1. Tlačítko: Přidat obsah */}
                <Link to="/admin/content" className="action-btn blue">
                    <span className="action-icon">📝</span>
                    {t('dashboard.actions.add_content')}
                </Link>

                {/* 2. Tlačítko: Nahrát fotku */}
                <Link to="/admin/gallery" className="action-btn green">
                    <span className="action-icon">📸</span>
                    {t('dashboard.actions.upload_photo')}
                </Link>

                {/* 3. Tlačítko: Nastavení */}
                <Link to="/admin/settings" className="action-btn gray">
                    <span className="action-icon">⚙️</span>
                    {t('dashboard.actions.edit_settings')}
                </Link>
            </div>
        </div>
    );
};

export default QuickActions;