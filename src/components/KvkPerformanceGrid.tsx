
export interface KvKPlayer {
  playerId: number;
  name: string;
  allianceTag?: string;
  allianceName?: string;
  campNum?: number;
  overallRank?: number;
  kdRank?: number;
  power?: number;
  powerDiff?: number;
  killPoints: number;
  killPointsDiff?: number;
  deathPoints?: number;
  dead?: number;
  deadDiff?: number;
  healPoints?: number;
  troopsHealed?: number;
  troopsHealedDiff?: number;
  t4?: number;
  t4Diff?: number;
  t5?: number;
  t5Diff?: number;
  acclaim?: number;
  totalPoints?: number;
  trades?: number;
  avatar?: string;
  avatarFrame?: string;
  killPointsRank?: number;
  deathPointsRank?: number;
  healPointsRank?: number;
}

export interface KvKItem {
  code: number;
  codePrefix: string;
  formattedCode: string; // e.g. #C13315
  season?: number;
  tier?: number;
  tierBadge?: 'S' | 'S+';
  storyId: number;
  storyName: string;
  coverUrl?: string;
  openTime: string;
  closeTime?: string;
  datesEn: string;
  datesVi: string;
  isActive: boolean;
  perf?: {
    kp: number;
    kpFormatted: string;
    dead: number;
    deadFormatted: string;
    t4t5kp: number;
    t4t5kpFormatted: string;
    healed: number;
    healedFormatted: string;
    acclaim: number;
    acclaimFormatted: string;
    participants: number;
    trackedPlayers: number;
    campNum?: number;
  } | null;
  kdPlayersCount: number;
  players: KvKPlayer[];
}

interface KvkPerformanceGridProps {
  kvks: KvKItem[];
  lang?: 'vi' | 'en';
  onOpenDashboard: (code: number) => void;
}

export function KvkPerformanceGrid({ kvks, lang = 'vi', onOpenDashboard }: KvkPerformanceGridProps) {
  const activeKvk = kvks.find(k => k.isActive);

  return (
    <section className="kvk-perf-section">
      {/* Header bar matching ROKStats */}
      <div className="kvk-perf-header">
        <div className="kvk-perf-title-group">
          <svg className="kvk-perf-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3 className="kvk-perf-title">
            {lang === 'vi' ? 'Hiệu suất KvK' : 'KvK Performance'}
          </h3>
          <span className="kvk-perf-count-badge">{kvks.length}</span>
        </div>

        {activeKvk && (
          <div className="kvk-perf-active-badge">
            <span className="kvk-active-dot" />
            <span className="kvk-active-label">
              {lang === 'vi' ? 'Đang diễn ra:' : 'Active:'}{' '}
              <b>{activeKvk.formattedCode}</b>
            </span>
          </div>
        )}
      </div>

      {/* Cards Grid (matching Image 1 & 2) */}
      <div className="kvk-perf-grid">
        {kvks.map(kvk => {
          const isTier2 = kvk.tier === 2 || kvk.tierBadge === 'S+';
          const tierBorderClass = isTier2 ? 'tier-border-gold' : 'tier-border-purple';
          const tierBadge = kvk.tierBadge || (isTier2 ? 'S+' : 'S');

          return (
            <article
              key={kvk.code}
              className={`kvk-card ${tierBorderClass}`}
              style={{
                backgroundImage: kvk.coverUrl
                  ? `linear-gradient(90deg, rgba(13, 17, 25, 0.92) 0%, rgba(13, 17, 25, 0.68) 48%, rgba(13, 17, 25, 0.20) 100%), url(${kvk.coverUrl})`
                  : undefined
              }}
            >
              {/* Card Top: Grade Badge, Code, Season, Active, Story Name, Dates & Dashboard button */}
              <div className="kvk-card-top">
                <div className="kvk-card-identity">
                  <div className={`kvk-grade-badge ${tierBadge === 'S+' ? 'grade-s-plus' : 'grade-s'}`} title={`Tier ${tierBadge}`}>
                    <span className="kvk-grade-letter">{tierBadge}</span>
                  </div>

                  <div className="kvk-card-meta">
                    <div className="kvk-code-line">
                      <span className="kvk-code-text">{kvk.formattedCode}</span>
                      {kvk.season ? <span className="kvk-season-pill">S{kvk.season}</span> : null}
                      {kvk.isActive && (
                        <span className="kvk-live-badge">
                          <span className="kvk-live-dot" />
                          {lang === 'vi' ? 'Đang diễn ra' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="kvk-story-title">{kvk.storyName}</div>
                    <div className="kvk-dates">
                      {lang === 'vi' ? kvk.datesVi : kvk.datesEn}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="kvk-btn-dashboard"
                  onClick={() => onOpenDashboard(kvk.code)}
                  title={lang === 'vi' ? `Xem Dashboard KvK ${kvk.formattedCode} (KD 2676)` : `Open KvK ${kvk.formattedCode} Dashboard (KD 2676)`}
                >
                  <svg className="kvk-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </div>

              {/* Card Body: Active Banner or 6-stat Metrics Grid */}
              <div className="kvk-card-body">
                {kvk.isActive ? (
                  <div className="kvk-in-progress-banner">
                    <span className="kvk-progress-pulse-dot" />
                    <span className="kvk-progress-text">
                      {lang === 'vi' ? 'Chiến dịch đang diễn ra' : 'Currently in progress'}
                    </span>
                  </div>
                ) : kvk.perf ? (
                  <div className="kvk-stats-grid">
                    {/* 1. Kill Points */}
                    <div className="kvk-metric-item">
                      <div className="kvk-metric-label">
                        <svg className="kvk-metric-icon icon-swords" viewBox="0 0 1024 1024" fill="currentColor">
                          <g transform="scale(1, -1) translate(0, -1024)">
                            <path d="M246.507 451.214c0 0 189.546-189.654 189.546-189.654s-75.787-75.84-75.787-75.84c0 0 75.894-75.893 75.894-75.893s-75.84-75.84-75.84-75.84c0 0-132.747 132.747-132.747 132.747s-151.733-151.734-151.733-151.734c0 0-75.84 75.84-75.84 75.84s151.734 151.787 151.734 151.787c0 0-132.747 132.693-132.747 132.693s75.84 75.84 75.84 75.84c0 0 75.84-75.786 75.84-75.786s75.786 75.84 75.786 75.84c0 0 0.054 0 0.054 0M29.285 1009.34c0 0 190.19-0.161 190.19-0.161s633.805-633.859 633.805-633.859c0 0 75.893 75.84 75.893 75.84s75.84-75.84 75.84-75.84c0 0-132.693-132.747-132.693-132.747s151.68-151.733 151.68-151.733c0 0-75.84-75.84-75.84-75.84s-151.733 151.734-151.733 151.734c0 0-132.747-132.747-132.747-132.747s-75.84 75.84-75.84 75.84c0 0 75.84 75.893 75.84 75.893s-634.234 634.235-634.234 634.235c0 0-0.161 189.385-0.161 189.385s0 0 0 0M804.686 1009.34c0 0 190.029-0.161 190.029-0.161s0.108-188.956 0.108-188.956c0 0-217.383-217.329-217.383-217.329s-189.654 189.599-189.654 189.599c0 0 216.9 216.847 216.9 216.847s0 0 0 0" />
                          </g>
                        </svg>
                        <span>{lang === 'vi' ? 'ĐIỂM HẠ GỤC' : 'KILL POINTS'}</span>
                      </div>
                      <div className="kvk-metric-value value-kp">{kvk.perf.kpFormatted}</div>
                    </div>

                    {/* 2. Deaths */}
                    <div className="kvk-metric-item">
                      <div className="kvk-metric-label">
                        <svg className="kvk-metric-icon icon-skull" viewBox="0 0 1024 1024" fill="currentColor">
                          <g transform="scale(1, -1) translate(0, -1024)">
                            <path d="M875.828 875.844c-90.968 94.156-223.594 148.156-363.844 148.156-140.218 0-272.844-54-363.78-148.126-85-88-129.406-205.656-125.062-331.376l13.218-167.75c12.062-169.5 110.468-187.812 152.188-187.812 15.126 0 31.062 2.188 47.25 6.376 2.188-15.876 2-43.718 1.844-65.376l-0.156-30.126c-0.282-21.876-0.718-55 22.468-78.468 9.594-9.75 27.126-21.344 56-21.344h392.094c28.876 0 46.376 11.594 56 21.312 23.156 23.5 22.75 56.594 22.468 78.5l-0.188 30.062c-0.126 21.688-0.344 49.562 1.876 65.438 16.344-4.218 32.188-6.376 47.25-6.376 41.718 0 140.094 18.312 152.188 187.5l13.126 166.312 0.094 1.75c4.342 125.722-40.066 243.378-125.034 331.348zM919.922 548.188l-13.032-165.688c-5.344-74.688-29.406-112.562-71.438-112.562-9.688 0-20.532 1.782-32.594 5.376-28.812 8.312-53.782 2.75-71.406-15-26.812-27-26.532-70.626-26.094-131l0.156-30.562c0.062-5 0.156-12.376-0.282-17.75h-85.5v100.032h-64.812v-100.034h-85.876v100.032h-64.782v-100.032h-85.532c-0.406 5.376-0.312 12.75-0.25 17.812l0.156 30.594c0.438 60.312 0.718 103.906-26.094 130.906-17.532 17.688-41.906 23.5-71.75 14.906-11.718-3.5-22.562-5.282-32.25-5.282-42.062 0-66.062 37.876-71.438 112.876l-13.062 165.376c-3.312 103.218 33 199.562 102.406 271.376 75.786 78.436 187.162 123.436 305.536 123.436 118.406 0 229.782-45 305.562-123.438 69.408-71.812 105.75-168.156 102.376-271.374zM512.016 404.688c-19.438 0-62.25-93.376-70.062-108.938-7.75-15.562 7.812-38.938 31.156-31.126 23.344 7.75 38.906 27.218 38.906 27.218s15.562-19.468 38.906-27.218c23.312-7.812 38.906 15.562 31.126 31.126-7.814 15.562-50.564 108.938-70.032 108.938zM343.172 657.438c-61.782 6.5-117.156-38.376-123.656-100.188l-8.376-58.844c-6.5-61.844 38.376-117.156 100.156-123.656 61.844-6.5 117.218 38.344 123.688 100.188l8.376 58.844c6.468 61.842-38.344 117.156-100.188 123.656zM804.484 557.25c-6.468 61.812-61.876 106.688-123.656 100.188-61.844-6.5-106.656-61.812-100.188-123.656l8.344-58.844c6.5-61.844 61.876-106.688 123.688-100.188s106.688 61.812 100.188 123.656l-8.376 58.844z" />
                          </g>
                        </svg>
                        <span>{lang === 'vi' ? 'TỬ TRẬN' : 'DEATHS'}</span>
                      </div>
                      <div className="kvk-metric-value value-dead">{kvk.perf.deadFormatted}</div>
                    </div>

                    {/* 3. T4+T5 KP */}
                    {kvk.perf.t4t5kp > 0 && (
                      <div className="kvk-metric-item">
                        <div className="kvk-metric-label">
                          <svg className="kvk-metric-icon icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span>T4+T5 KP</span>
                        </div>
                        <div className="kvk-metric-value">{kvk.perf.t4t5kpFormatted}</div>
                      </div>
                    )}

                    {/* 4. Healed */}
                    {kvk.perf.healed > 0 && (
                      <div className="kvk-metric-item">
                        <div className="kvk-metric-label">
                          <svg className="kvk-metric-icon icon-heal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                          <span>{lang === 'vi' ? 'HỒI PHỤC' : 'HEALED'}</span>
                        </div>
                        <div className="kvk-metric-value value-heal">{kvk.perf.healedFormatted}</div>
                      </div>
                    )}

                    {/* 5. Acclaim */}
                    {kvk.perf.acclaim > 0 && (
                      <div className="kvk-metric-item">
                        <div className="kvk-metric-label">
                          <svg className="kvk-metric-icon icon-acclaim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="7" />
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                          </svg>
                          <span>{lang === 'vi' ? 'DANH VỌNG' : 'ACCLAIM'}</span>
                        </div>
                        <div className="kvk-metric-value value-acclaim">{kvk.perf.acclaimFormatted}</div>
                      </div>
                    )}

                    {/* 6. Participants */}
                    {kvk.perf.participants > 0 && (
                      <div className="kvk-metric-item">
                        <div className="kvk-metric-label">
                          <svg className="kvk-metric-icon icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>{lang === 'vi' ? 'QUY MÔ KVK' : 'PARTICIPANTS'}</span>
                        </div>
                        <div className="kvk-metric-value">{kvk.perf.participants}</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
