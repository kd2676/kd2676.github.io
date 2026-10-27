
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
                        <svg className="kvk-metric-icon icon-swords" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                          <line x1="13" y1="19" x2="19" y2="13" />
                          <line x1="16" y1="16" x2="20" y2="20" />
                          <line x1="19" y1="21" x2="21" y2="19" />
                          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                          <line x1="5" y1="14" x2="9" y2="18" />
                          <line x1="7" y1="17" x2="4" y2="20" />
                          <line x1="3" y1="19" x2="5" y2="21" />
                        </svg>
                        <span>{lang === 'vi' ? 'ĐIỂM HẠ GỤC' : 'KILL POINTS'}</span>
                      </div>
                      <div className="kvk-metric-value value-kp">{kvk.perf.kpFormatted}</div>
                    </div>

                    {/* 2. Deaths */}
                    <div className="kvk-metric-item">
                      <div className="kvk-metric-label">
                        <svg className="kvk-metric-icon icon-skull" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="12" r="1.5" />
                          <circle cx="15" cy="12" r="1.5" />
                          <path d="M8 20v2h8v-2" />
                          <path d="M12.5 17l-.5-1-.5 1h1z" />
                          <path d="M16 20a3 3 0 0 0 3-3V9a7 7 0 0 0-14 0v8a3 3 0 0 0 3 3" />
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
