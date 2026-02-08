import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import StatsCard from "../components/ui/StatsCard";
import LogWidget from "../components/ui/LogWidget";
import QuickActions from "../components/ui/QuickActions";
import SystemStatus from "../components/ui/SystemStatus";

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formátování velikosti (Byte -> MB)
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Chyba statistik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // --- NOVÁ LOGIKA PRO DISKOVÉ STATISTIKY ---
  const diskStats = stats?.storage;

  // Výpočet šířky segmentů relativně k celkové kapacitě disku (total_disk_size)
  const totalDiskSize = diskStats?.total_disk_size || 0;
  const uploadsWidth =
    totalDiskSize > 0
      ? (diskStats.uploads_folder_size / totalDiskSize) * 100
      : 0;
  const appWidth =
    totalDiskSize > 0 ? (diskStats.app_folder_size / totalDiskSize) * 100 : 0;
  const usedWidth =
    totalDiskSize > 0 ? (diskStats.used_disk_size / totalDiskSize) * 100 : 0;

  // Zbytek využitého místa (OS, DB, cache) - zajistíme, že součet segmentů se rovná usedWidth
  const otherUsedWidth = Math.max(0, usedWidth - uploadsWidth - appWidth);

  // Volné místo už je zajištěno pozadím containeru (.segmented-bar-container)

  return (
    <div className="dashboard-container">
      <h1 className="page-title">{t("menu.dashboard")}</h1>

      {/* 1. KARTY STATISTIK (Horní řádek) */}
      <div className="stats-grid">
        {/* 1. AKTIVNÍ SLUŽBY (Content) - Modrá 📝 */}
        <StatsCard
          title={t("dashboard.stats.services")}
          value={loading ? "..." : stats?.counts?.content_items || 0}
          icon="📝"
          color="blue"
          to="/admin/content"
        />

        <StatsCard
          title={t("dashboard.stats.users")}
          value={loading ? "..." : stats?.counts?.users || 0}
          icon="👥"
          color="green"
          to="/admin/users"
        />

        <StatsCard
          title={t("dashboard.stats.messages")}
          value={loading ? "..." : stats?.counts?.messages || 0}
          icon="📩"
          color="orange"
          to="/admin/messages"
        />
      </div>

      {/* 2. HLAVNÍ SEKCE */}
      <div className="dashboard-main-section">
        {/* Levá část - Logy + DISK */}
        <div
          className="logs-wrapper"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* A) Widget Logů */}
          <LogWidget />

          {/* B) Využití disku (Storage Widget) - VÍCESEGMENTOVÝ BAR */}
          <div
            className="card"
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
            }}
          >
            {/* NOVÝ ŘÁDEK: Využito z Celkové Kapacity (v jedné linii doprava) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "1rem",
              }}
            >
              {/* Nadpis */}
              <h3
                className="widget-title"
                style={{
                  margin: 0,
                  padding: 0,
                  borderBottom: "none",
                  fontSize: "1.2rem",
                }}
              >
                💾 {t("dashboard.storage_usage")}
              </h3>

              {/* Využito / Celkem (XXX GB z YYY GB) */}
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "var(--text-main)",
                  textAlign: "right",
                }}
              >
                {loading
                  ? "..."
                  : `${t("dashboard.storage_used")} ${formatBytes(
                      diskStats?.used_disk_size
                    )} ${t("dashboard.storage_from_word")} ${formatBytes(
                      diskStats?.total_disk_size
                    )}`}
              </span>
            </div>

            {/* Progress Bar - Více segmentů */}
            <div className="segmented-bar-container">
              {/* Segment 1: Uploads (Fotky) - Zelená */}
              <div
                className="storage-segment segment-uploads"
                style={{ width: `${uploadsWidth}%` }}
                title={`${t("dashboard.storage_uploads_used")}: ${formatBytes(
                  diskStats?.uploads_folder_size
                )}`}
              ></div>

              {/* Segment 2: App (Kód, binární soubory) - Žlutá */}
              <div
                className="storage-segment segment-app"
                style={{ width: `${appWidth}%` }}
                title={`${t("dashboard.storage_app_size")}: ${formatBytes(
                  diskStats?.app_folder_size
                )}`}
              ></div>

              {/* Segment 3: Other Used (OS, Logy, DB) - Modrá/Primary */}
              <div
                className="storage-segment"
                style={{
                  width: `${otherUsedWidth}%`,
                  backgroundColor: "var(--primary-hover)",
                }}
                title={`${t("dashboard.storage_other_used")}: ${formatBytes(
                  diskStats?.used_disk_size -
                    diskStats?.uploads_folder_size -
                    diskStats?.app_folder_size
                )}`}
              ></div>
            </div>

            {/* 2. LEGENDA A VELIKOSTI (BEZ VOLNÉHO MÍSTA) */}
            <div className="storage-legend">
              {/* Legenda: Uploads (Zelená) */}
              <div className="legend-item">
                <span className="legend-dot dot-uploads"></span>
                <span>
                  {t("dashboard.storage_uploads_used")}
                  <span
                    className="font-bold"
                    style={{ marginLeft: "6px", fontFamily: "monospace" }}
                  >
                    ({formatBytes(diskStats?.uploads_folder_size)})
                  </span>
                </span>
              </div>

              {/* Legenda: Program/Aplikace (Žlutá) */}
              <div className="legend-item">
                <span className="legend-dot dot-app"></span>
                <span>
                  {t("dashboard.storage_app_size")}
                  <span
                    className="font-bold"
                    style={{ marginLeft: "6px", fontFamily: "monospace" }}
                  >
                    ({formatBytes(diskStats?.app_folder_size)})
                  </span>
                </span>
              </div>

              {/* Legenda: Ostatní Využité (Tmavě Modrá) */}
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: "var(--primary-hover)" }}
                ></span>
                <span>
                  {t("dashboard.storage_other_used")}
                  <span
                    className="font-bold"
                    style={{ marginLeft: "6px", fontFamily: "monospace" }}
                  >
                    (
                    {formatBytes(
                      diskStats?.used_disk_size -
                        diskStats?.uploads_folder_size -
                        diskStats?.app_folder_size
                    )}
                    )
                  </span>
                </span>
              </div>

              {/* Legenda pro Volné místo byla odstraněna (dle požadavku) */}
            </div>
          </div>
        </div>

        {/* Pravá část - Sloupec widgetů */}
        <div className="widgets-sidebar">
          <QuickActions />
          <SystemStatus stats={stats} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
