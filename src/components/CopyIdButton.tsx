import { useState } from 'react';

interface CopyIdButtonProps {
  id: string | number;
  prefix?: string;
  className?: string;
  lang?: 'vi' | 'en';
}

export function CopyIdButton({ id, prefix = 'ID: ', className = '', lang = 'vi' }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(id));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const titleText = copied
    ? (lang === 'vi' ? `✓ Đã sao chép ID ${id}!` : `✓ Copied ID ${id}!`)
    : (lang === 'vi' ? `Nhấn để sao chép ID: ${id}` : `Click to copy ID: ${id}`);

  return (
    <button
      type="button"
      className={`copy-id-btn ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      title={titleText}
      aria-label={`Copy ID ${id}`}
    >
      <span className="copy-id-text">{prefix}{id}</span>
      <span className="copy-id-icon-wrap" aria-hidden="true">
        {copied ? (
          <svg className="copy-svg check-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="copy-svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
      {copied && (
        <span className="copied-tooltip">
          {lang === 'vi' ? 'Đã chép' : 'Copied'}
        </span>
      )}
    </button>
  );
}
