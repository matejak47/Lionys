import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // 1. Pokud se ještě neví (načítá se token), ukaž nic nebo loading
    if (loading) {
        return <div>Načítám...</div>; 
    }

    // 2. Pokud uživatel NENÍ přihlášený, kopni ho na Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Pokud JE přihlášený, pusť ho dál (vykresli obsah)
    return children;
};

export default ProtectedRoute;