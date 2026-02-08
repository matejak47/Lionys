import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import CategoryModal from "../components/layout/CategoryModal";
import { getImageUrl } from "../utils/image";

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for editing category (null = new)
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      setError(t("categories.messages.error_load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(t("categories.messages.confirm_delete", { name })))
      return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSuccess = () => {
    fetchCategories();
  };

  // --- MODAL FUNCTIONS ---

  // 1. Click "+ New Category"
  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // 2. Click "Edit" (Pencil)
  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  // 3. Close modal
  const handleCloseModal = () => {
    setEditingCategory(null);
    setIsModalOpen(false);
  };

  if (loading)
    return (
      <div className="loading-text">{t("categories.messages.loading")}</div>
    );
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t("categories.title")}</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + {t("categories.add_btn")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-16 text-right">ID</th>
              <th className="w-20">{t("categories.table.image")}</th>
              <th>{t("categories.table.name")}</th>
              <th>{t("categories.table.slug")}</th>
              <th className="w-16 text-center">
                {t("categories.table.position")}
              </th>
              <th className="text-right">{t("categories.table.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  {t("categories.table.empty")}
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="text-muted text-right">#{cat.id}</td>{" "}
                  {/* ZMĚNA: ID DATA doprava */}
                  <td>
                    {cat.image_path ? (
                      <img
                        src={getImageUrl(cat.image_path)}
                        alt={cat.name}
                        className="cat-thumb"
                      />
                    ) : (
                      <div className="cat-placeholder">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="font-bold">{cat.name}</td>
                  <td>
                    <span className="slug-badge">{cat.slug}</span>
                  </td>
                  <td className="text-center font-bold">{cat.position}</td>{" "}
                  {/* OK: Pozice DATA na střed */}
                  <td className="text-right">
                    <button
                      className="btn-icon edit"
                      title="Upravit"
                      style={{ marginRight: "0.5rem" }}
                      onClick={() => handleEdit(cat)}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="btn-icon delete"
                      title={t("categories.table.delete")}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL WINDOW */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        categoryToEdit={editingCategory}
      />
    </div>
  );
};

export default Categories;
