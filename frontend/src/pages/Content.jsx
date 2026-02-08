import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import ContentModal from '../components/layout/ContentModal'; // Předpokládaný modal
import { getImageUrl } from '../utils/image'; 
// Předpokládáme, že funkce pro formátování ceny (např. formatPrice) bude dostupná
// (Není kritická pro strukturu, ale je dobré ji tam nechat)

const Content = () => {
    const { t } = useTranslation();
    const [contentItems, setContentItems] = useState([]);
    const [categories, setCategories] = useState({}); // Pro mapování category_id -> name
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Pomocná funkce pro zobrazení ceny (pokud nemáš, přidej do utils/format.js)
    const formatPrice = (price) => {
        if (price === null) return '-';
        // Zde by měla být realná logiká formátování, např. 120.00 Kč
        return `${parseFloat(price).toFixed(0)} Kč`; 
    };

    // Načtení obsahu
    const fetchContentItems = async () => {
        try {
            const response = await api.get('/content'); 
            setContentItems(response.data);
        } catch (err) {
            setError(t('content.messages.error_load'));
        } finally {
            setLoading(false);
        }
    };
    
    // Načtení kategorií pro mapování ID na název
    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            const categoryMap = {};
            response.data.forEach(cat => {
                categoryMap[cat.id] = cat.name;
            });
            setCategories(categoryMap);
        } catch (err) {
            console.error("Nepodařilo se načíst kategorie.");
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchContentItems();
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(t('content.messages.confirm_delete', { title }))) return;
        try {
            await api.delete(`/content/${id}`);
            setContentItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert(t('content.messages.error_delete'));
        }
    };

    const handleSuccess = () => {
        fetchContentItems();
    };

    // --- MODAL FUNCTIONS ---
    const handleCreate = () => {
        setEditingItem(null); 
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
    };

    // Status badge komponenta
    const StatusBadge = ({ isPublished }) => {
        const className = isPublished ? 'badge green-text' : 'badge';
        const style = isPublished ? {} : { backgroundColor: '#fef3c7', color: '#b45309' }; // žlutá pro Koncept
        const text = isPublished ? t('content.table.status_published') : t('content.table.status_draft');
        return <span className={className} style={style}>{text}</span>;
    };


    if (loading) return <div className="loading-text">{t('content.messages.loading')}</div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{t('content.title')}</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + {t('content.add_btn')}
                </button>
            </div>

            <div className="card table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="w-16">ID</th>
                            <th className="w-20">{t('content.table.image')}</th>
                            <th className="w-16">{t('content.table.category')}</th>
                            <th>{t('content.table.title')}</th>
                            <th className="text-right">{t('content.table.price')}</th>
                            <th className="text-center">{t('content.table.status')}</th>
                            <th className="text-center w-16">{t('content.table.position')}</th>
                            <th className="text-right">{t('content.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contentItems.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-cell">
                                    {t('content.table.empty')}
                                </td>
                            </tr>
                        ) : (
                            contentItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="text-muted">#{item.id}</td>
                                    <td>
                                        {item.image_url ? (
                                            <img 
                                                src={getImageUrl(item.image_url)}
                                                alt={item.title} 
                                                className="cat-thumb"
                                            />
                                        ) : (
                                            <div className="cat-placeholder">
                                                {item.title.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {/* Použijeme slug-badge pro zvýraznění názvu kategorie */}
                                        <span className="slug-badge">
                                            {categories[item.category_id] || `ID: ${item.category_id}`}
                                        </span>
                                    </td>
                                    <td className="font-bold">{item.title}</td>
                                    <td className="text-right font-bold">
                                        {formatPrice(item.price)}
                                    </td>
                                    <td className="text-center">
                                        <StatusBadge isPublished={item.is_published} />
                                    </td>
                                    <td className="text-center text-muted">{item.position}</td>
                                    <td className="text-right">
                                        <button 
                                            className="btn-icon edit"
                                            title={t('content.table.edit')}
                                            style={{ marginRight: '0.5rem' }}
                                            onClick={() => handleEdit(item)} 
                                        >
                                            ✏️
                                        </button>

                                        <button 
                                            onClick={() => handleDelete(item.id, item.title)}
                                            className="btn-icon delete"
                                            title={t('content.table.delete')}
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
            {/* Je nutné předat list kategorií do modalu pro výběrové pole */}
            <ContentModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSuccess={handleSuccess}
                itemToEdit={editingItem} 
                categories={categories}
            />

        </div>
    );
};

export default Content;