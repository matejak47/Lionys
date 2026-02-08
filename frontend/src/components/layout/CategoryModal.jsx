import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import { getImageUrl } from "../../utils/image";

const CategoryModal = ({ isOpen, onClose, onSuccess, categoryToEdit }) => {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(0);

  const [imagePath, setImagePath] = useState(null);
  const [iconPath, setIconPath] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && categoryToEdit) {
      setName(categoryToEdit.name || "");
      setSlug(categoryToEdit.slug || "");
      setDescription(categoryToEdit.description || "");
      setPosition(categoryToEdit.position || 0);
      setImagePath(categoryToEdit.image_path || null);
      setIconPath(categoryToEdit.icon_path || null);
    } else if (isOpen && !categoryToEdit) {
      resetForm();
    }
  }, [isOpen, categoryToEdit]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setPosition(0);
    setImagePath(null);
    setIconPath(null);
    setError(null);

    document.getElementById("file-upload-image").value = "";
    document.getElementById("file-upload-icon").value = "";
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e, setPathFunction) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPathFunction(response.data.url);
    } catch (err) {
      alert(t("categories.modal.upload_error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = () => {
    setImagePath(null);
    document.getElementById("file-upload-image").value = "";
  };

  const handleDeleteIcon = () => {
    setIconPath(null);
    document.getElementById("file-upload-icon").value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        slug: slug.trim() === "" ? null : slug,
        description,
        position,
        image_path: imagePath,
        icon_path: iconPath,
      };

      if (categoryToEdit) {
        await api.patch(`/categories/${categoryToEdit.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail || t("categories.modal.error_save");
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = categoryToEdit
    ? t("categories.modal.title_edit")
    : t("categories.modal.title_add");
  const submitBtnText = categoryToEdit
    ? t("categories.modal.update")
    : t("categories.modal.save");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {t("categories.modal.name_label")} *
            </label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("categories.modal.slug_label")}
            </label>
            <input
              className="form-input"
              placeholder={t("categories.modal.slug_placeholder")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("categories.modal.position_label")}
            </label>
            <input
              type="number"
              className="form-input"
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">
                {t("categories.modal.image_label")}
              </label>
              <input
                id="file-upload-image"
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setImagePath)}
              />

              {imagePath && (
                <div className="preview-container">
                  <img
                    src={getImageUrl(imagePath)}
                    className="modal-preview-img"
                    alt="preview"
                  />
                  <button
                    type="button"
                    className="btn-delete-photo"
                    onClick={handleDeleteImage}
                  >
                    {t("categories.modal.delete_image")}
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label className="form-label">
                {t("categories.modal.icon_label")}
              </label>
              <input
                id="file-upload-icon"
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setIconPath)}
              />

              {iconPath && (
                <div className="preview-container">
                  <img
                    src={getImageUrl(iconPath)}
                    className="modal-preview-img"
                    style={{ height: "60px" }}
                    alt="icon"
                  />
                  <button
                    type="button"
                    className="btn-delete-photo"
                    onClick={handleDeleteIcon}
                  >
                    {t("categories.modal.delete_icon")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("categories.modal.desc_label")}
            </label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-danger" onClick={onClose}>
              {t("categories.modal.cancel")}
            </button>
            <button type="submit" className="btn">
              {isUploading
                ? t("categories.modal.uploading")
                : isSubmitting
                ? t("categories.modal.saving")
                : submitBtnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
