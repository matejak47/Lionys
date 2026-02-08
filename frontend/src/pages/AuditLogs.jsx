import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import api from '../api/axios';

const AuditLogs = () => {
    const { t, i18n } = useTranslation();

    // --- STAVY ---
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);      // stránka určující skip
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [separatorIndex, setSeparatorIndex] = useState(null);

    // --- FILTRY ---
    const [filterEmail, setFilterEmail] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const LIMIT = 20;
    const abortControllerRef = useRef(null);

    // --- FETCH FUNKCE ---
    const fetchLogs = async (isReset = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);

        try {
            const skip = page * LIMIT;

            const params = new URLSearchParams({
                skip,
                limit: LIMIT
            });

            if (filterEmail) params.append("email", filterEmail);
            if (filterAction) params.append("action", filterAction);
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);

            const response = await api.get(`/logs?${params.toString()}`, {
                signal: abortControllerRef.current.signal
            });

            const newLogs = response.data;

            if (isReset) {
                // NOVÉ HLEDÁNÍ
                setLogs(newLogs);
                setSeparatorIndex(null);
                setHasMore(newLogs.length === LIMIT);
                return;
            }

            // PŘIDÁVÁME DALŠÍ STRÁNKU
            if (newLogs.length > 0) {
                setSeparatorIndex(logs.length);
            }

            setLogs(prev => [...prev, ...newLogs]);

            if (newLogs.length < LIMIT) {
                setHasMore(false);
            }

        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error("Chyba při načítání:", error);
            }
        } finally {
            if (!abortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    };

    // --- NAČTENÍ PŘI STARTU ---
    useEffect(() => {
        fetchLogs(true);
        // eslint-disable-next-line
    }, []);

    // --- FETCH KDYŽ SE ZMĚNÍ PAGE ---
   useEffect(() => {
    fetchLogs(page === 0);

    // reset seznamu jen když je page 0
    if (page === 0) {
        setSeparatorIndex(null);
    }
}, [page]);


    // --- KLIKNUTÍ NA SEARCH ---
    const handleSearch = (e) => {
        if (e) e.preventDefault();

        setHasMore(true);
        setPage(0);     // stránka 0 = skip 0
        fetchLogs(true); // reset fetch
    };

    // --- KLIKNUTÍ NA LOAD MORE ---
    const handleLoadMore = () => {
        if (!hasMore) return;
        setPage(prev => prev + 1);
    };

    // --- POMOCNÉ FUNKCE ---
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleString(i18n.language);

    const getActionColor = (action) => {
        if (!action) return "gray";
        if (action.includes("DELETE")) return "red";
        if (action.includes("LOGIN")) return "green";
        if (action.includes("LOGOUT")) return "gray";
        if (action.includes("UPDATE")) return "blue";
        return "orange";
    };

    return (
        <div className="audit-container">
            <div className="audit-header-wrapper">
                <div className="audit-header">
                    <h1 className="page-title">{t("audit.title")}</h1>
                    <span className="audit-count">
                        {t("audit.total_loaded", { count: logs.length })}
                    </span>
                </div>

                {/* FILTRY */}
                <form className="filters-bar card" onSubmit={handleSearch}>
                    <div className="filter-group">
                        <label>{t("audit.filter_user")}</label>
                        <input
                            type="text"
                            className="filter-input"
                            value={filterEmail}
                            placeholder={t("audit.filter_email_placeholder")}
                            onChange={(e) => setFilterEmail(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>{t("audit.filter_action")}</label>
                        <select
                            className="filter-input"
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                        >
                            <option value="">{t("audit.filter_action_all")}</option>
                            <option value="LOGIN_SUCCESS">{t("audit.action_login")}</option>
                            <option value="LOGOUT">{t("audit.action_logout")}</option>
                            <option value="UPDATE">{t("audit.action_update")}</option>
                            <option value="DELETE">{t("audit.action_delete")}</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>{t("audit.filter_from")}</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>{t("audit.filter_to")}</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>

                    <div className="filter-group filter-btn-group">
                        <label>&nbsp;</label>
                        <button className="btn btn-primary" type="submit">
                            {t("audit.search_btn")}
                        </button>
                    </div>
                </form>
            </div>

            {/* SEZNAM LOGŮ */}
            <div className="audit-list">
                {logs.length === 0 && !loading && (
                    <p className="empty-text">{t("audit.empty_state")}</p>
                )}

                {logs.map((log, index) => (
                    <div key={log.id}>
                        {index === separatorIndex && (
                            <div className="audit-separator">
                                <span>{t("audit.new_records_separator")}</span>
                            </div>
                        )}

                        <div className="audit-row card">
                            <div className={`audit-indicator ${getActionColor(log.action)}`} />
                            <div className="audit-content">
                                <div className="audit-top">
                                    <span className="audit-action">{log.action}</span>
                                    <span className="audit-time">{formatDate(log.created_at)}</span>
                                </div>
                                <div className="audit-details">{log.details}</div>
                                <div className="audit-meta">
                                    <small>
                                        {log.user_email || `User ID: ${log.user_id}`}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* LOAD MORE */}
            <div style={{ textAlign: "center", marginTop: "2rem", paddingBottom: "2rem" }}>
                {loading ? (
                    <div className="loading-spinner">⏳ {t("audit.loading_more")}</div>
                ) : hasMore ? (
                    <button onClick={handleLoadMore} className="btn" style={{ maxWidth: "200px" }}>
                        {t("audit.load_more_btn")}
                    </button>
                ) : logs.length > 0 ? (
                    <div className="end-of-list">✅ {t("audit.end_of_list")}</div>
                ) : null}
            </div>
        </div>
    );
};

export default AuditLogs;
