import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const AdminMessagesPage = () => {
  const { t } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useMemo(() => (unreadOnly ? "?unread=true" : ""), [unreadOnly]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/messages/${query}`);
      setMessages(res.data);
      // když je selected zpráva pryč (např. unread filtr), zruš výběr
      if (selected && !res.data.some((m) => m.id === selected.id)) {
        setSelected(null);
      }
    } catch (e) {
      console.error(e);
      setError(t("messages.errors.load_list", "Nepodařilo se načíst zprávy."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openMessage = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      setSelected(res.data);
    } catch (e) {
      console.error(e);
      alert(t("messages.errors.load_detail", "Nepodařilo se načíst detail zprávy."));
    }
  };

  const markRead = async (id, isRead) => {
    try {
      await api.patch(`/messages/${id}/read?is_read=${isRead}`);
      setSelected((s) => (s ? { ...s, is_read: isRead } : s));
      await fetchMessages();
    } catch (e) {
      console.error(e);
      alert(t("messages.errors.toggle_read", "Nepodařilo se změnit stav přečtení."));
    }
  };

  if (loading) {
    return <div className="loading-text">{t("messages.loading", "Načítám zprávy…")}</div>;
  }

  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t("messages.title", "Zprávy")}</h1>

        <label className="messages-filter">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={() => setUnreadOnly((v) => !v)}
          />
          {t("messages.filter.unread_only", "Jen nepřečtené")}
        </label>
      </div>

      <div className="card messages-layout">
        {/* LEFT LIST */}
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-cell">
              {unreadOnly
                ? t("messages.empty.unread", "Žádné nepřečtené zprávy.")
                : t("messages.empty.all", "Zatím žádné zprávy.")}
            </div>
          ) : (
            messages.map((m) => {
              const isSelected = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openMessage(m.id)}
                  className={[
                    "message-item",
                    m.is_read ? "" : "unread",
                    isSelected ? "selected" : "",
                  ].join(" ")}
                  title={t("messages.list.open", "Otevřít zprávu")}
                >
                  <div className="message-item__top">
                    <div className="message-item__subject">
                      {m.subject?.trim() ? m.subject : t("messages.no_subject", "(bez předmětu)")}
                    </div>
                    {!m.is_read && <span className="badge badge-unread">{t("messages.badge.unread", "Nová")}</span>}
                  </div>

                  <div className="message-item__meta">
                    <span className="message-item__email">{m.email}</span>
                    <span className="dot">•</span>
                    <span className="message-item__date">
                      {m.created_at ? new Date(m.created_at).toLocaleString() : "-"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT DETAIL */}
        <div className="messages-detail">
          {!selected ? (
            <div className="messages-placeholder">
              {t("messages.placeholder", "Vyber zprávu vlevo.")}
            </div>
          ) : (
            <>
              <div className="messages-detail__header">
                <div>
                  <h2 className="messages-detail__title">
                    {selected.subject?.trim()
                      ? selected.subject
                      : t("messages.no_subject", "(bez předmětu)")}
                  </h2>

                  <div className="messages-detail__meta">
                    <span className="text-muted">
                      {t("messages.detail.from", "Od")}:{" "}
                      <b>{selected.name?.trim() ? selected.name : t("messages.detail.unknown_name", "Neznámý")}</b>
                      {" • "}
                      <b>{selected.email}</b>
                      {" • "}
                      {selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>

                <div className="messages-detail__actions">
                  {selected.is_read ? (
                    <button className="btn" onClick={() => markRead(selected.id, false)}>
                      {t("messages.actions.mark_unread", "Označit jako nepřečtené")}
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => markRead(selected.id, true)}>
                      {t("messages.actions.mark_read", "Označit jako přečtené")}
                    </button>
                  )}
                </div>
              </div>

              <div className="messages-detail__body">
                {selected.body || ""}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
