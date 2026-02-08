import { useNavigate } from "react-router-dom";

const StatsCard = ({ title, value, icon, color = "blue", to }) => {
    const navigate = useNavigate();
    const colorClass = `icon-${color}`;

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <div
            className={`stats-card ${to ? "clickable" : ""}`}
            onClick={handleClick}
        >
            <div className={`stats-icon-wrapper ${colorClass}`}>
                {icon}
            </div>
            <div className="stats-info">
                <span className="stats-value">{value}</span>
                <span className="stats-title">{title}</span>
            </div>
        </div>
    );
};

export default StatsCard;
