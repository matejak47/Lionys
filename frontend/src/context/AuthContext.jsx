import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios'; // Náš axios instance

// 1. Vytvoříme kontext
const AuthContext = createContext();

// 2. Provider komponenta
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- FUNKCE: PŘIHLÁŠENÍ ---
    const login = async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': undefined }
            });

            const data = response.data; // Obsahuje: access_token, force_password_change, is_admin

            // 1. KONTROLA: Vynucená změna hesla
            if (data.force_password_change === true) {
                // NEUKLÁDÁME token do localStorage! Vrátíme ho pro použití na Login stránce.
                return { 
                    success: true, 
                    needsPasswordChange: true, 
                    tempToken: data.access_token 
                };
            }

            // 2. STANDARDNÍ PŘIHLÁŠENÍ: Uložíme token a načteme data.
            localStorage.setItem('access_token', data.access_token);
            
            // Nastavíme Auth hlavičku v Axiosu pro budoucí loadUser/API volání
            api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            
            await loadUser();
            
            return { success: true };

        } catch (error) {
            console.error("Chyba přihlášení:", error);
            
            let errorMessage = "Chyba přihlášení";
            if (error.response && error.response.data && typeof error.response.data.detail === 'string') {
                errorMessage = error.response.data.detail;
            }
            return { success: false, error: errorMessage };
        }
    };

    // --- NOVÁ FUNKCE: ZMĚNA HESLA (Adminem vynucená) ---
    const changePassword = async (tempToken, oldPassword, newPassword) => {
        try {
            // Posíláme JSON na náš PATCH endpoint /me/password
            await api.patch('/auth/me/password', 
                {
                    old_password: oldPassword,
                    new_password: newPassword
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${tempToken}`, // Používáme dočasný token
                        'Content-Type': 'application/json' 
                    }
                }
            );

            // Úspěch: Heslo změněno a force_password_change je vypnuto.
            return true; 

        } catch (error) {
            console.error("Chyba při změně hesla:", error.response || error);
            // Vracíme false, pokud staré heslo nesedí (backend vrátí 400)
            return false;
        }
    };

    // --- FUNKCE: ODHLÁŠENÍ (Beze změny) ---
    const logout = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error("Chyba při logování odhlášení (ignoruji):", error);
        } finally {
            localStorage.removeItem('access_token');
            setUser(null);
            delete api.defaults.headers.common['Authorization'];
        }
    };

    // --- FUNKCE: NAČTENÍ UŽIVATELE (Při F5) ---
    const loadUser = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            
            // Nastavení tokenu pro Axios (pokud je v localStorage, ale není v paměti)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const response = await api.get('/auth/me');
            setUser(response.data);

        } catch (error) {
            console.error("Neplatný token nebo chyba načítání:", error);
            localStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // --- EFEKT: Spustí se při startu ---
    useEffect(() => {
        loadUser();
    }, []);

    // Co posíláme dál do aplikace
    const value = {
        user,
        login,
        logout,
        loading,
        changePassword, // <--- EXPORT NOVÉ FUNKCE
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. Hook pro snadné použití
export const useAuth = () => {
    return useContext(AuthContext);
};