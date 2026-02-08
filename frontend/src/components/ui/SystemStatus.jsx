import { useTranslation } from 'react-i18next';

// Komponenta přijímá data 'stats' a 'loading' od rodiče (Dashboardu)
const SystemStatus = ({ stats, loading }) => {
    const { t } = useTranslation();
    const isDbConnected = stats?.database_status?.includes("Connected");

    return (
        <div className="card system-status-widget">
            <h3 className="widget-title">{t('dashboard.system_status')}</h3>

            <div className="status-list">
                {/* 1. Verze Aplikace */}
                <div className="status-item">
                    <span className="status-label">{t('dashboard.system.version')}</span>
                    <span className="status-value badge">
                        v{loading ? '...' : stats?.system_version}
                    </span>
                </div>

                {/* 2. Databáze */}
                <div className="status-item">
                    <span className="status-label">{t('dashboard.system.database')}</span>
                    <span className={`status-value ${isDbConnected ? 'green-text' : ''}`}>
                        {loading ? '...' : stats?.database_status}
                    </span>
                </div>

                {/* 3. API Status (když se načetlo stats, API běží) */}
                <div className="status-item">
                    <span className="status-label">{t('dashboard.system.api')}</span>
                    <span className="status-value green-text">
                        Online ✅
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SystemStatus;