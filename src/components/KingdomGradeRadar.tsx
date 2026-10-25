export interface RadarMetric {
  key: string;
  label: string;
  grade: string;
  percentile: number;
}

interface KingdomGradeRadarProps {
  grades?: RadarMetric[];
  snapshotDate?: string;
  lang?: 'vi' | 'en';
}

const DEFAULT_GRADES: RadarMetric[] = [
  { key: 'power', label: 'Power', grade: 'D', percentile: 17.5 },
  { key: 'tech', label: 'Tech', grade: 'C', percentile: 24.6 },
  { key: 'activity', label: 'Activity', grade: 'D', percentile: 13.3 },
  { key: 'development', label: 'Development', grade: 'C', percentile: 28.7 },
  { key: 'field', label: 'Field', grade: 'D', percentile: 19.1 },
  { key: 'garrison', label: 'Garrison', grade: 'C', percentile: 22.0 }
];

const VI_LABELS: Record<string, string> = {
  power: 'Sức mạnh',
  tech: 'Công nghệ',
  activity: 'Hoạt động',
  development: 'Phát triển',
  field: 'Đánh đồng',
  garrison: 'Thủ thành'
};

export function KingdomGradeRadar({
  grades = DEFAULT_GRADES,
  snapshotDate = '2026-10-24',
  lang = 'vi'
}: KingdomGradeRadarProps) {
  const metrics = grades.length === 6 ? grades : DEFAULT_GRADES;

  // Geometry
  const size = 320;
  const cx = 160;
  const cy = 160;
  const radius = 96;

  // 6 angles starting from top (-pi/2)
  const angles = [0, 1, 2, 3, 4, 5].map(i => -Math.PI / 2 + (i * 2 * Math.PI) / 6);

  // Concentric regular hexagon rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0].map(f => {
    const r = radius * f;
    const pts = angles.map(a => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`).join(' ');
    return { f, pts };
  });

  // Data polygon points
  const dataPoints = metrics.map((m, i) => {
    const val = Math.max(8, Math.min(100, m.percentile));
    const visualR = (val / 100) * radius;
    const a = angles[i];
    return {
      x: cx + visualR * Math.cos(a),
      y: cy + visualR * Math.sin(a),
      metric: m
    };
  });
  const dataPolygonPts = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Outer label coordinates
  const labelPoints = metrics.map((m, i) => {
    const a = angles[i];
    const labelDist = radius + 32;
    return {
      x: cx + labelDist * Math.cos(a),
      y: cy + labelDist * Math.sin(a),
      metric: m,
      angle: a
    };
  });

  return (
    <article className="panel radar-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">RADAR / EVALUATION</p>
          <h3>Kingdom Grade Radar</h3>
        </div>
        <span className="panel-note">Snapshot {snapshotDate}</span>
      </div>

      <div className="radar-layout">
        {/* SVG Spider Chart */}
        <div className="radar-chart-wrap">
          <svg
            className="radar-svg"
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#080b12" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Background Glow */}
            <circle cx={cx} cy={cy} r={radius * 1.15} fill="url(#radarGlow)" />

            {/* Concentric Hexagon Rings */}
            {rings.map((ring, idx) => (
              <polygon
                key={idx}
                points={ring.pts}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={idx === rings.length - 1 ? '1.5' : '1'}
                strokeDasharray={idx < rings.length - 1 ? '2 3' : undefined}
              />
            ))}

            {/* 6 Axis Spoke Lines */}
            {angles.map((a, idx) => {
              const x2 = cx + radius * Math.cos(a);
              const y2 = cy + radius * Math.sin(a);
              return (
                <line
                  key={idx}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data Polygon */}
            <polygon
              points={dataPolygonPts}
              fill="url(#polyGrad)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' }}
            />

            {/* Vertex Dots */}
            {dataPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
              />
            ))}

            {/* Outer Labels */}
            {labelPoints.map((lp, i) => {
              const anchor = Math.abs(lp.x - cx) < 15 ? 'middle' : lp.x > cx ? 'start' : 'end';
              return (
                <g key={i} transform={`translate(${lp.x}, ${lp.y})`}>
                  <text
                    textAnchor={anchor}
                    dy="-3"
                    className={`radar-label-grade grade-${lp.metric.grade.toLowerCase()}`}
                    fill={lp.metric.grade === 'D' ? '#fb923c' : '#facc15'}
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="Manrope, sans-serif"
                  >
                    {lp.metric.grade}
                  </text>
                  <text
                    textAnchor={anchor}
                    dy="12"
                    className="radar-label-name"
                    fill="#cbd5e1"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="Manrope, sans-serif"
                  >
                    {lp.metric.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Breakdown List */}
        <div className="radar-stats-list">
          {metrics.map(m => (
            <div className="radar-stat-row" key={m.key}>
              <div className="stat-grade-col">
                <span className={`grade-badge grade-${m.grade.toLowerCase()}`}>
                  {m.grade}
                </span>
                <span className="stat-name">
                  {m.label}
                  {lang === 'vi' && VI_LABELS[m.key] && (
                    <small style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>
                      ({VI_LABELS[m.key]})
                    </small>
                  )}
                </span>
              </div>
              <div className="stat-val-col">
                <div className="radar-mini-bar">
                  <div
                    className="radar-mini-fill"
                    style={{
                      width: `${Math.min(100, Math.max(5, m.percentile))}%`,
                      background: m.grade === 'D' ? 'linear-gradient(90deg, #f97316, #fb923c)' : 'linear-gradient(90deg, #eab308, #facc15)'
                    }}
                  />
                </div>
                <span className="stat-percent">{m.percentile.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
