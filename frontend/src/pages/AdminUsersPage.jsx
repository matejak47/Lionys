import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { getImageUrl } from "../utils/image";
import UserModal from "../components/layout/UserModal";

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // e-mail aktuálně přihlášeného uživatele (uložený při loginu)
  const loggedInEmail = localStorage.getItem("userEmail");

  // Modal pro vytvoření uživatele
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          "users.messages.error_load",
          "Nepodařilo se načíst uživatele."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (user) => {
    // pojistka – vlastní účet ne
    if (user.email === loggedInEmail) {
      alert(
        t(
          "users.messages.cannot_deactivate_self",
          "Nemůžete deaktivovat svůj vlastní účet."
        )
      );
      return;
    }

    const newValue = !user.is_active;

    try {
      await api.patch(`/users/${user.id}/active`, {
        is_active: newValue,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: newValue } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        t(
          "users.messages.toggle_error",
          "Nepodařilo se změnit stav účtu. Zkuste to prosím znovu."
        )
      );
    }
  };

  const handleToggleAdmin = async (user) => {
    // pojistka – sám sobě admin práva nešoupej (backend to taky hlídá)
    if (user.email === loggedInEmail) {
      alert(
        t(
          "users.messages.cannot_change_own_role",
          "Nemůžete měnit vlastní roli administrátora."
        )
      );
      return;
    }

    const newValue = !user.is_admin;

    try {
      await api.patch(`/users/${user.id}/role`, {
        is_admin: newValue,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_admin: newValue } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        t(
          "users.messages.toggle_role_error",
          "Nepodařilo se změnit roli uživatele. Zkuste to prosím znovu."
        )
      );
    }
  };

  const handleCreateUser = () => {
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  if (loading) {
    return (
      <div className="loading-text">
        {t("users.messages.loading", "Načítám uživatele…")}
      </div>
    );
  }

  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t("users.title", "Uživatelé")}</h1>
        <button className="btn btn-primary" onClick={handleCreateUser}>
          + {t("users.add_btn", "Nový uživatel")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-16 text-right">
                {t("users.table.id", "ID")}
              </th>
              <th className="w-20">
                {t("users.table.avatar", "Obrázek")}
              </th>
              <th>{t("users.table.email", "E-mail")}</th>
              <th>{t("users.table.created_at", "Vytvořen")}</th>
              <th className="text-center">
                {t("users.table.role", "Role")}
              </th>
              <th className="text-center">
                {t("users.table.active", "Aktivní")}
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  {t("users.table.empty", "Zatím žádní uživatelé.")}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const firstLetter =
                  user.email?.charAt(0).toUpperCase() || "?";
                const isMe = loggedInEmail && user.email === loggedInEmail;

                return (
                  <tr key={user.id}>
                    <td className="text-muted text-right">#{user.id}</td>

                    <td>
                      {user.avatar_path ? (
                        <img
                          src={getImageUrl(user.avatar_path)}
                          alt={user.email}
                          className="cat-thumb"
                        />
                      ) : (
                        <div className="cat-placeholder">
                          {firstLetter}
                        </div>
                      )}
                    </td>

                    <td className="font-bold">
                      {user.email}
                      {isMe && (
                        <span className="badge badge-self">
                          {t("users.badge_you", "Vy")}
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="text-muted">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString()
                          : "-"}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className="text-center">
                      {isMe ? (
                        // u sebe jen statický badge, neklikací
                        <span className="badge">
                          {user.is_admin
                            ? t("users.roles.admin", "Admin")
                            : t("users.roles.user", "Uživatel")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="badge badge-clickable"
                          onClick={() => handleToggleAdmin(user)}
                          title={t(
                            "users.roles.toggle",
                            "Přepnout roli admin/uživatel"
                          )}
                        >
                          {user.is_admin
                            ? t("users.roles.admin", "Admin")
                            : t("users.roles.user", "Uživatel")}
                        </button>
                      )}
                    </td>

                    {/* AKTIVNÍ */}
                    <td className="text-center">
                      {isMe ? (
                        <span className="text-muted">
                          {t(
                            "users.self_active_note",
                            "Váš účet nelze zde vypnout."
                          )}
                        </span>
                      ) : (
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={user.is_active}
                            onChange={() => handleToggleActive(user)}
                          />
                          <span className="slider" />
                        </label>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pro vytvoření uživatele */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default AdminUsersPage;