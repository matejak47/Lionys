import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const AdminLayout = () => {
    return (
        <div className="admin-layout">
            {/* 1. HORNÍ LIŠTA (Bude na všech admin stránkách) */}
            <Header />

            <div className="admin-body">
                {/* 2. LEVÉ MENU (Bude na všech admin stránkách) */}
                <Sidebar />

                {/* 3. HLAVNÍ OBSAH (Tady se bude měnit Dashboard, Nastavení atd.) */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;