import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // <--- ZNOVU IMPORTUJEME
import SidebarLink from "./SidebarLink";
import SidebarGroup from "./SidebarGroup";

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // ZÍSKÁME STAV UŽIVATELE A ADMINA
  const { user } = useAuth();
  const isAdmin = user?.is_admin || false;

  const [expandedGroup, setExpandedGroup] = useState(null);

  // --- DEFINICE MENU ITEMS ---
  const MENU_ITEMS = [
    {
      type: "link",
      path: "/admin",
      label: t("menu.dashboard"),
      icon: "📊",
      end: true,
    },

    {
      type: "group",
      id: "content_group",
      label: t("menu.content_group"),
      icon: "📝",
      children: [
        { path: "/admin/content", label: t("menu.content_items") },
        { path: "/admin/categories", label: t("menu.categories") },
      ],
    },

    {
      type: "link",
      path: "/admin/gallery",
      label: t("menu.gallery"),
      icon: "📸",
    },
    {
      type: "link",
      path: "/admin/messages",
      label: t("menu.messages", "Zprávy"),
      icon: "📩",
      adminOnly: true,
    },
    { type: "link", path: "/admin/audit", label: t("menu.audit"), icon: "🛡️" },

    // --- ADMIN LINK (Přidáno do statického pole) ---
    {
      type: "link",
      path: "/admin/users",
      label: t("menu.users_admin"),
      icon: "👥",
      adminOnly: true, // <--- NOVÁ VLAJKA PRO KONTROLU
    },

    {
      type: "link",
      path: "/admin/settings",
      label: t("menu.settings"),
      icon: "⚙️",
    },
  ];

  useEffect(() => {
    // ... (Logika pro useEffect zůstává stejná, jen MUSÍ POUŽÍT NOVOU DEFINICI MENU_ITEMS)
    const currentMenu = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

    currentMenu.forEach((item) => {
      if (item.type === "group") {
        const shouldBeOpen = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        );
        if (shouldBeOpen) {
          setExpandedGroup(item.id);
        }
      }
    });
    // eslint-disable-next-line
  }, [location.pathname, isAdmin]); // ZÁVISLOST NA isAdmin JE DŮLEŽITÁ!

  const handleToggle = (id) => {
    setExpandedGroup((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item, index) => {
          // 🚨 NOVÁ KONTROLA: ZOBRAZIT POUZE ADMINŮM
          if (item.adminOnly && !isAdmin) {
            return null; // Přeskočí renderování tohoto odkazu pro ne-adminy
          }

          // 1. Pokud je to SKUPINA
          if (item.type === "group") {
            return (
              <SidebarGroup
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                children={item.children}
                isOpen={expandedGroup === item.id}
                onToggle={handleToggle}
              />
            );
          }

          // 2. Pokud je to ODKAZ
          return (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              end={item.end}
            />
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
