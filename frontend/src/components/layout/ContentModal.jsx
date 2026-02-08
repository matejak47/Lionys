import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/image';

// Přijímá itemToEdit (obsahová položka) a seznam categories (pro dropdown)
const ContentModal = ({ isOpen, onClose, onSuccess, itemToEdit, categories }) => {
    const { t } = useTranslation();
    
    // Stavy formuláře
    const [categoryId, setCategoryId] = useState("");
    const [title, setTitle] = useState(""); // Nahrazuje 'name'
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState(""); // Hlavní text
    const [price, setPrice] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [position, setPosition] = useState(0.0);
    
    // Ukládáme URL primárního obrázku (image_url)
    const [imageUrl, setImageUrl] = useState(null); 
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    // EFEKT: Když se otevře okno nebo změní editovaná položka, naplníme formulář
    useEffect(() => {
        if (isOpen && itemToEdit) {
            // Režim EDITACE: Předvyplníme data
            setCategoryId(itemToEdit.category_id || "");
            setTitle(itemToEdit.title || "");
            setSlug(itemToEdit.slug || "");
            setDescription(itemToEdit.description || "");
            setContent(itemToEdit.content || "");
            setPrice(itemToEdit.price || "");
            setIsPublished(itemToEdit.is_published || false);
            setPosition(itemToEdit.position || 0.0);
            
            // Nastavíme URL obrázku
            setImageUrl(itemToEdit.image_url || null);
            
        } else if (isOpen && !itemToEdit) {
            // Režim VYTVOŘENÍ: Vyčistíme formulář
            resetForm();
        }
    }, [isOpen, itemToEdit]);

    const resetForm = () => {
        // Nastavíme defaultní hodnotu kategorie, pokud existuje (první v listu)
        const firstCategoryId = Object.keys(categories).length > 0 ? Object.keys(categories)[0] : "";
        setCategoryId(firstCategoryId); 
        
        setTitle("");
        setSlug("");
        setDescription("");
        setContent("");
        setPrice("");
        setIsPublished(false);
        setPosition(0.0);
        setImageUrl(null);
        setError(null);
        
        // Resetujeme input pro soubor
        document.getElementById('file-upload-image').value = "";
    };

    if (!isOpen) return null;
    
    // --- FUNKCE PRO NAHRÁNÍ SOUBORU (Stejná jako v CategoryModal) ---
    const handleFileUpload = async (e, setPathFunction) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPathFunction(response.data.url);
        } catch (err) {
            alert(t('content.modal.upload_error'));
        } finally {
            setIsUploading(false);
        }
    };

    // --- FUNKCE PRO SMAZÁNÍ FOTKY (Nastaví null) ---
    const handleDeleteImage = () => {
        setImageUrl(null);
        document.getElementById('file-upload-image').value = "";
    };


    // --- ODESLÁNÍ FORMULÁŘE ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
    category_id: Number(categoryId),
    title,
    slug: slug.trim() === "" ? null : slug,
    description,
    content,
    price: price !== "" ? Number(price) : null,
    is_published: Boolean(isPublished),
    position: position !== "" ? Number(position) : 0,
    image_url: imageUrl
};


            if (itemToEdit) {
                // --- UPDATE (PATCH) ---
                await api.patch(`/content/${itemToEdit.id}`, payload);
            } else {
                // --- CREATE (POST) ---
                await api.post('/content', payload);
            }
            
            onSuccess();
            onClose();

        } catch (err) {
            const msg = err.response?.data?.detail || t('content.modal.error_save');
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Texty podle režimu
    const titleText = itemToEdit ? t('content.modal.title_edit') : t('content.modal.title_add');
    const submitBtnText = itemToEdit ? t('content.modal.update') : t('content.modal.save');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}> {/* Větší šířka pro Content */}
                
                <div className="modal-header">
                    <h2 className="modal-title">{titleText}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    
                    {/* HORNÍ ČÁST: Kategorie, Název, Slug */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* 1. KATEGORIE */}
                        <div className="form-group" style={{ flex: 1.5 }}>
                            <label className="form-label">{t('content.modal.category_label')} *</label>
                            <select 
                                className="form-input" 
                                value={categoryId} 
                                onChange={(e) => setCategoryId(e.target.value)} 
                                required
                            >
                                {Object.entries(categories).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 2. NÁZEV */}
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">{t('content.modal.title_label')} *</label>
                            <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                    </div>

                    {/* SLUG */}
                    <div className="form-group">
                        <label className="form-label">{t('content.modal.slug_label')}</label>
                        <input type="text" className="form-input" placeholder={t('content.modal.slug_placeholder')} value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>

                    {/* FOTO A CENA */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        
                        {/* 1. PRIMÁRNÍ OBRÁZEK (image_url) */}
                        <div style={{ flex: 2 }}>
                            <label className="form-label">{t('content.modal.image_label')}</label>
                            <input id="file-upload-image" type="file" className="form-input" accept="image/*" onChange={(e) => handleFileUpload(e, setImageUrl)} />
                            
                            {imageUrl && (
                                <div className="preview-container">
                                    <img src={getImageUrl(imageUrl)} className="modal-preview-img" alt="Náhled" />
                                    <button type="button" className="btn-delete-photo" onClick={handleDeleteImage} title={t('content.modal.delete_image')}>
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* 2. CENA A POZICE */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">{t('content.modal.price_label')}</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)} 
                                    step="any"
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">{t('content.modal.position_label')}</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={position} 
                                    onChange={(e) => setPosition(e.target.value)} 
                                    step="any"
                                />
                            </div>
                        </div>
                    </div>

                    {/* STAV PUBLIKACE */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <input 
                            type="checkbox" 
                            id="is_published"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        <label htmlFor="is_published" className="form-label" style={{ display: 'inline', fontWeight: 'bold' }}>
                            {t('content.modal.is_published_label')}
                        </label>
                    </div>

                    {/* POPIS (Description) */}
                    <div className="form-group">
                        <label className="form-label">{t('content.modal.desc_label')}</label>
                        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    {/* HLAVNÍ OBSAH (Content) */}
                    <div className="form-group">
                        <label className="form-label">{t('content.modal.content_label')}</label>
                        {/* Zde by byl v reálné aplikaci Rich Text Editor, nyní je to jen textarea */}
                        <textarea className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} style={{ minHeight: '150px' }} />
                    </div>

                    {/* TLAČÍTKA */}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-danger" onClick={onClose} disabled={isSubmitting || isUploading}>
                            {t('content.modal.cancel')}
                        </button>
                        <button type="submit" className="btn" disabled={isSubmitting || isUploading}>
                            {isUploading ? t('content.modal.uploading') : (isSubmitting ? t('content.modal.saving') : submitBtnText)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContentModal;