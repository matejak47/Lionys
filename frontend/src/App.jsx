import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Importujeme Layout a hlavní stránky
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// --- 1. IMPORTUJEME NOVÉ STRÁNKY (které jsme vytvořili před chvílí) ---
import Content from './pages/Content';
import Gallery from './pages/Gallery';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Categories from './pages/Categories'
import AdminUserPage from './pages/AdminUsersPage';
import AdminMessagesPage from './pages/AdminMessagesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Veřejná cesta - Login */}
          <Route path="/login" element={<Login />} />

          {/* CHRÁNĚNÁ ADMIN SEKCE */}
          <Route 
            path="/admin" 
            element={
              // Celý tento blok je chráněný. Kdo nemá token, sem se nedostane.
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
              {/* --- 2. ZAPOJENÍ STRÁNEK --- */}
              {/* Tyto cesty se automaticky napojí za "/admin" */}
              
              {/* /admin */}
              <Route index element={<Dashboard />} />
              
              {/* /admin/content */}
              <Route path="content" element={<Content />} />
              
              {/* /admin/gallery */}
              <Route path="gallery" element={<Gallery />} />
              
              {/* /admin/audit */}
              <Route path="audit" element={<AuditLogs />} />
              
              {/* /admin/settings */}
              <Route path="settings" element={<Settings />} />
              
              <Route path="categories" element={<Categories />} />

              {/* /admin/users */}
              <Route path="users" element={<AdminUserPage />} />

              {/* /admin/messages */}
              <Route path="messages" element={<AdminMessagesPage />} />

          </Route>

          {/* Přesměrování z úvodní stránky */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;