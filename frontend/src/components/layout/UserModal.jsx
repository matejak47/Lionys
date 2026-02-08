import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

const UserModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // dočasné heslo, které vrátí backend
  const [tempPassword, setTempPassword] = useState(null);

  // stav pro hlášku po kopírování
  const [copyMessage, setCopyMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEmail("");
    setIsAdmin(false);
    setIsActive(true);
    setIsSubmitting(false);
    setError(null);
    setTempPassword(null);
    setCopyMessage(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setTempPassword(null);
    setCopyMessage(null);

    try {
      const payload = {
        email,
        is_admin: isAdmin,
        is_active: isActive,
      };

      const response = await api.post("/users/", payload);
      const data = response.data;

      // uložíme dočasné heslo z backendu
      setTempPassword(data.temp_password || null);

      // refresh tabulky na stránce
      onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        t("users.modal.error_save", "Nepodařilo se uložit uživatele.");
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;

    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopyMessage(
        t(
          "users.modal.copy_success",
          "Heslo bylo zkopírováno do schránky."
        )
      );
    } catch (err) {
      console.error(err);
      setCopyMessage(
        t(
          "users.modal.copy_error",
          "Nepodařilo se zkopírovat heslo."
        )
      );
    }
  };

  const title = t("users.modal.title_add", "Nový uživatel");
  const submitBtnText = isSubmitting
    ? t("users.modal.saving", "Ukládám…")
    : t("users.modal.save", "Vytvořit");

  return (
    <div className="modal-overlay" onClick={handleCloseClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={handleCloseClick}>
            &times;
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {t("users.modal.email_label", "E-mail")} *
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group form-group-inline">
            <label className="form-label-inline">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />{" "}
              {t("users.modal.is_admin_label", "Administrátor")}
            </label>
          </div>

          <div className="form-group form-group-inline">
            <label className="form-label-inline">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />{" "}
              {t("users.modal.is_active_label", "Aktivní účet")}
            </label>
          </div>

          {tempPassword && (
            <div className="form-group">
              <label className="form-label">
                {t(
                  "users.modal.temp_password_label",
                  "Dočasné heslo (předat uživateli)"
                )}
              </label>
              <div className="temp-password-box" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{ padding: "4px 8px" }}>{tempPassword}</code>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyPassword}
                >
                  {t("users.modal.copy_password_btn", "Zkopírovat heslo")}
                </button>
              </div>
              {copyMessage && (
                <div className="info-msg" style={{ marginTop: "4px" }}>
                  {copyMessage}
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCloseClick}
            >
              {t("users.modal.cancel", "Zavřít")}
            </button>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {submitBtnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
