export function FlagVN({ className = '', width = 18, height = 12 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 20"
      className={className}
      style={{ borderRadius: '2px', overflow: 'hidden', display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', boxShadow: '0 0 1px rgba(0,0,0,0.5)' }}
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#da251d" />
      <polygon
        points="15,4 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"
        fill="#ffff00"
      />
    </svg>
  );
}

export function FlagGB({ className = '', width = 18, height = 12 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      style={{ borderRadius: '2px', overflow: 'hidden', display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', boxShadow: '0 0 1px rgba(0,0,0,0.5)' }}
      aria-hidden="true"
    >
      <clipPath id="flag-gb-clip">
        <rect width="60" height="30" />
      </clipPath>
      <clipPath id="flag-gb-diag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#flag-gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-diag)" stroke="#c8102e" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}
