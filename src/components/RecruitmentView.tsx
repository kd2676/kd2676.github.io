import { useState } from 'react';
import type { Lang } from '../i18n';
import { translations } from '../i18n';
import type { KingdomConfig, RecruitmentData } from '../lib/kingdomApi';

interface RecruitmentViewProps {
  lang: Lang;
  recruitment: RecruitmentData | null;
  config: KingdomConfig | null;
  loading?: boolean;
}

export function RecruitmentView({ lang, recruitment, config, loading }: RecruitmentViewProps) {
  const i18n = translations[lang];
  const t = i18n.recruitment;
  const [modalOpen, setModalOpen] = useState(false);

  const discordUrl = recruitment?.discord_url || config?.discord_url || 'https://discord.gg/';
  const isOpen = recruitment?.status !== 'closed';
  const posterUrl = recruitment?.poster_url;

  if (loading && !recruitment) {
    return (
      <section className="view active recruitment-loading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{t.kicker}</p>
            <h2>{t.title}</h2>
          </div>
        </div>
        <div className="loading-box">
          <div className="spinner" />
          <p>{lang === 'vi' ? 'Đang tải dữ liệu tuyển dụng...' : 'Loading recruitment info...'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="view active recruitment-view">
      {/* TIÊU ĐỀ & TRẠNG THÁI */}
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t.kicker}</p>
          <h2>{recruitment?.title || t.title}</h2>
          <p className="section-subtitle">{t.subtitle}</p>
        </div>
        <div className="recruitment-status-wrapper">
          {isOpen ? (
            <span className="recruitment-badge open">
              <span className="live-pulse-dot" />
              {t.openBadge}
            </span>
          ) : (
            <span className="recruitment-badge closed">
              <span className="closed-dot" />
              {t.closedBadge}
            </span>
          )}
        </div>
      </div>

      {/* 1. PHẦN DISCORD (ĐƯỢC ĐẶT TRƯỚC POSTER THEO YÊU CẦU) */}
      <div className="discord-cta-card prominent">
        <div className="discord-cta-content">
          <div className="discord-logo-wrap">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <div className="discord-text">
            <span className="discord-title">{t.discordCardTitle}</span>
            <p className="discord-desc">{t.discordCardDesc}</p>
            <div className="discord-link-label">{discordUrl}</div>
          </div>
        </div>
        <a 
          href={discordUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="discord-btn"
        >
          {t.discordBtn}
        </a>
      </div>

      {/* 2. PHẦN POSTER CHIÊU MỘ */}
      <div className="recruitment-poster-card full-showcase">
        <div className="poster-header">
          <span className="poster-tag">{t.posterTitle}</span>
          {posterUrl && (
            <button 
              type="button" 
              className="view-full-poster-btn" 
              onClick={() => setModalOpen(true)}
            >
              🔍 {t.viewFullPoster}
            </button>
          )}
        </div>

        <div className="poster-wrapper full-poster-wrapper">
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt="Kingdom Recruitment Poster" 
              className="recruitment-poster-img full-img"
              onClick={() => setModalOpen(true)}
            />
          ) : (
            <div className="poster-placeholder wide">
              <img 
                src={config?.logo_url || '/logo.png'} 
                alt="Kingdom Logo" 
                className="poster-placeholder-logo" 
              />
              <h3>Kingdom 2676</h3>
              <p>{config?.tagline || 'Zipporania · Continent of Egria · Chatsworth'}</p>
              <div className="placeholder-motto">
                {lang === 'vi'
                  ? '« Đoàn kết tạo nên sức mạnh · Kỷ luật làm nên chiến thắng »'
                  : '« Unity breeds power · Discipline achieves victory »'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POSTER MODAL LIGHTBOX */}
      {modalOpen && posterUrl && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="poster-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>
            <img 
              src={posterUrl} 
              alt="Recruitment Poster Full" 
              className="poster-full-img" 
            />
          </div>
        </div>
      )}
    </section>
  );
}
