export const getImageUrl = (path) => {
  if (!path) return null;

  // 1) Když je to už plná URL, vrať rovnou
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // 2) Pro obrázky chceme veřejný web (ne /api)
  const publicBase =
    import.meta.env.VITE_PUBLIC_URL || window.location.origin;

  const cleanBase = publicBase.endsWith("/")
    ? publicBase.slice(0, -1)
    : publicBase;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
};
