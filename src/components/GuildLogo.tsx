
const SHIELD_PATH = "M29.88 74.26c-25.82,-7.57 -29.61,-27.15 -29.61,-27.15 0,0 -0.13,-41.48 0.06,-42.73 0.2,-1.23 0.83,-2.94 2.09,-3.59 0.56,-0.28 1.08,-0.5 1.89,-0.54 0.62,-0.03 1.42,-0.05 2.35,0.31 0.82,0.29 2.95,1.71 5.23,2.35 3.7,1.01 8.93,1.33 17.99,1.6 9.07,-0.27 14.3,-0.59 18,-1.6 2.27,-0.64 4.41,-2.06 5.22,-2.35 0.94,-0.36 1.73,-0.34 2.36,-0.31 0.8,0.04 1.33,0.26 1.87,0.54 1.28,0.65 1.91,2.36 2.11,3.59 0.19,1.25 0.06,42.73 0.06,42.73 0,0 -3.79,19.58 -29.62,27.15l0 0z";

const BG_COLORS: Record<number, string> = {
  1: "#D6027E", 2: "#BA00CE", 3: "#7B01CE", 4: "#4700AB",
  5: "#2D00CE", 6: "#0036CE", 7: "#0863D0", 8: "#0089CE",
  9: "#01C6CE", 10: "#00CE51", 11: "#83CD00", 12: "#CECB00",
  13: "#CE8E00", 14: "#C76F00", 15: "#CE4900", 16: "#E1120B"
};

const ICON_COLORS: Record<number, string> = {
  1: "#FFFFFF", 2: "#BECFFF", 3: "#B5FBFF", 5: "#FFFFFF", 6: "#FFF5BC", 7: "#FFCCCC"
};

interface GuildLogoProps {
  logo?: string;
  size?: number;
  className?: string;
  title?: string;
}

export function GuildLogo({ logo, size = 32, className = '', title }: GuildLogoProps) {
  if (!logo) {
    return (
      <div
        className={`guild-logo-placeholder ${className}`}
        style={{ width: size, height: Math.round((size * 74.57) / 59.77) }}
        title={title}
      >
        <span>🛡️</span>
      </div>
    );
  }

  const parts = logo.split('_').map(Number);
  const backgroundColorId = parts[1] || 1;
  const iconId = parts[2] || 1;
  const iconColorId = parts[3] || 1;
  const bgColor = BG_COLORS[backgroundColorId] || "#7B01CE";
  const iconColor = ICON_COLORS[iconColorId] || "#FFFFFF";
  const height = Math.round((size * 74.57) / 59.77);
  const iconFontSize = Math.round(size * 0.62);

  return (
    <div
      className={`guild-logo-root ${className}`}
      style={{ width: size, height }}
      title={title}
    >
      <svg
        className="guild-logo-svg"
        viewBox="0 0 59.77 74.57"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`sheen-${logo}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="38%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.26" />
          </linearGradient>
        </defs>
        <path
          d={SHIELD_PATH}
          fill={bgColor}
          stroke="#ffd90f"
          strokeOpacity="0.3"
          strokeWidth="1.2"
        />
        <path
          d={SHIELD_PATH}
          fill={`url(#sheen-${logo})`}
          pointerEvents="none"
          style={{ mixBlendMode: 'soft-light', opacity: 0.9 }}
        />
        {/* Shading on right side */}
        <path
          d="M29.88 74.25c25.83,-7.57 29.62,-27.14 29.62,-27.14 0,0 0.13,-41.49 -0.06,-42.73 -0.2,-1.23 -0.83,-2.94 -2.09,-3.6 -0.56,-0.27 -1.08,-0.49 -1.89,-0.54 -0.62,-0.03 -1.42,-0.05 -2.36,0.31 -0.81,0.3 -2.95,1.71 -5.22,2.35 -3.7,1.01 -8.93,1.34 -18,1.6l0 69.75z"
          fill="rgba(0,0,0,0.22)"
        />
      </svg>
      <div className="guild-logo-icon-wrap" style={{ color: iconColor, fontSize: iconFontSize }}>
        <i className={`rok-guild-${iconId} guild-logo-icon`} />
      </div>
    </div>
  );
}
