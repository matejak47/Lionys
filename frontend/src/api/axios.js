import axios from 'axios';

// 1. Vytvoříme instanci (základní nastavení)
const api = axios.create({
    // TADY JE TA ZMĚNA:
    // import.meta.env je způsob, jak Vite čte .env soubory
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor (Odposlech před odesláním)
// Tohle se spustí PŘEDTÍM, než jakýkoliv požadavek odejde z prohlížeče
api.interceptors.request.use(
    (config) => {
        // Zkusíme najít token v úložišti prohlížeče (localStorage)
        const token = localStorage.getItem('access_token');
        
        // Pokud token máme, přilepíme ho do hlavičky jako "Občanku"
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;