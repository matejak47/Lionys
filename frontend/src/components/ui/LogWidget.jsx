import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios'; // Náš axios

const LogWidget = () => {
    // Vytáhneme si i 'i18n', abychom znali aktuální jazyk pro datum
    const { t, i18n } = useTranslation(); 
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/logs?limit=5');
                setLogs(response.data);
            } catch (error) {
                console.error("Chyba logů:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // OPRAVA DATA: Použijeme aktuální jazyk (i18n.language) místo 'cs-CZ'
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(i18n.language, {
            day: 'numeric', month: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getActionColor = (action) => {
        if (action.includes("DELETE")) return "red";
        if (action.includes("LOGIN")) return "green";
        if (action.includes("UPDATE")) return "blue";
        return "gray";
    };

    return (
        <div className="log-widget card">
            <h3 className="widget-title">{t('dashboard.activity_title')}</h3>

            <div className="log-list">
                {loading ? (
                    /* OPRAVA: Použijeme překlad */
                    <p className="loading-text">{t('dashboard.loading_activity')}</p>
                ) : logs.length === 0 ? (
                    /* OPRAVA: Použijeme překlad */
                    <p className="empty-text">{t('dashboard.no_activity')}</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="log-item">
                            <div className={`log-indicator ${getActionColor(log.action)}`}></div>
                            <div className="log-content">
                                <div className="log-header">
                                    <span className="log-action">{log.action}</span>
                                    {/* Datum se teď formátuje podle jazyka */}
                                    <span className="log-time">{formatDate(log.created_at)}</span>
                                </div>
                                <div className="log-details">
                                    {log.details}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LogWidget;