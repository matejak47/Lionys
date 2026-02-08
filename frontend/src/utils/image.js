export const getImageUrl = (path) => {
    if (!path) return null;

    // 1. Pokud je to externí odkaz (např. https://google.com/logo.png), vrátíme ho rovnou
    if (path.startsWith('http')) return path;

    // 2. Načteme adresu serveru z ENV souboru
    // Vite automaticky vybere správný soubor (.development nebo .production)
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // Pokud náhodou ENV chybí, vrátíme path samotnou (nebo fallback na localhost)
    if (!baseUrl) {
        console.warn("Chybí VITE_API_BASE_URL v .env souboru!");
        return `http://localhost:8000${path.startsWith('/') ? path : '/' + path}`;
    }

    // 3. Ošetříme lomítka, aby nevzniklo "http://localhost:8000//static/..."
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanBase}${cleanPath}`;
};