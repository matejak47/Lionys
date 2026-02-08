import { useLocation } from 'react-router-dom';
import SidebarLink from './SidebarLink';

const SidebarGroup = ({ id, label, icon, children, isOpen, onToggle }) => {
    const location = useLocation();

    // Zjistíme, jestli je aktivní některé z dětí (aby svítil i rodič)
    // Pokud má některé dítě cestu, která odpovídá aktuální URL, rodič je "active"
    const isChildActive = children.some(child => location.pathname.startsWith(child.path));

    return (
        <div className="nav-group-wrapper">
            {/* Tlačítko Rodiče (Rozbalovač) */}
            <button 
                className={`nav-group-btn ${isChildActive ? 'active' : ''}`} 
                onClick={() => onToggle(id)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                </div>
                {/* Šipka, která se točí */}
                <span className={`arrow-icon ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {/* Seznam dětí (vykreslíme jen pokud je otevřeno) */}
            <div className={`nav-children ${isOpen ? 'expanded' : ''}`}>
                {isOpen && children.map((child) => (
                    <SidebarLink 
                        key={child.path}
                        to={child.path}
                        label={child.label}
                        // Děti nemají velkou ikonku, dáme jim tečku nebo nic
                        icon="•" 
                    />
                ))}
            </div>
        </div>
    );
};

export default SidebarGroup;