import { useState, useEffect } from 'react';

interface GovernorAvatarProps {
  src?: string;
  frame?: string;
  name: string;
  size?: number;
  className?: string;
}

function cleanUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return undefined;
  return trimmed.replace(/^http:\/\//i, 'https://');
}

export function GovernorAvatar({ src, frame, name, size = 38, className = '' }: GovernorAvatarProps) {
  const safeSrc = cleanUrl(src);
  const safeFrame = cleanUrl(frame);

  const [loadError, setLoadError] = useState(false);
  const [frameError, setFrameError] = useState(false);

  // Reset errors whenever image source changes
  useEffect(() => {
    setLoadError(false);
  }, [safeSrc]);

  useEffect(() => {
    setFrameError(false);
  }, [safeFrame]);

  // Clean initials from governor name (skip leading non-alphanumeric symbols like ﷻ, 乡, 亗)
  const cleanName = name.replace(/^[^\w\d\u00C0-\u024F\u1EA0-\u1EF9]+/i, '').trim() || name;
  const initial = cleanName.charAt(0).toUpperCase() || '⚔';

  // Generate deterministic hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className={`gov-avatar-wrap ${className}`}
      style={{ width: size, height: size }}
    >
      {safeSrc && !loadError ? (
        <img
          src={safeSrc}
          alt={name}
          className="gov-avatar-img"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setLoadError(true)}
        />
      ) : (
        <div
          className="gov-avatar-fallback"
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${(hue + 45) % 360}, 80%, 15%))`
          }}
        >
          <span>{initial}</span>
        </div>
      )}

      {safeFrame && !frameError && (
        <img
          src={safeFrame}
          alt=""
          className="gov-avatar-frame"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFrameError(true)}
        />
      )}
    </div>
  );
}
