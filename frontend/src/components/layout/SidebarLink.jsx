import { NavLink } from 'react-router-dom';

const SidebarLink = ({ to, icon, label, end = false }) => {
    return (
        <NavLink 
            to={to} 
            end={end} // 'end' zajistí, že odkaz /admin nesvítí, když jsme na /admin/settings
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
        </NavLink>
    );
};

export default SidebarLink;