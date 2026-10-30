import { useRef, useEffect } from 'react';

export interface ChronicleStage {
  id: string;
  name: string;
  subtitle: string;
  status: 'completed' | 'active' | 'upcoming' | 'locked';
  colorTheme?: 'green' | 'purple' | 'amber' | 'grey';
  iconSrc?: string;
  progressPercent: number;
  utcDate: string;
}

export interface CurrentKvkInfo {
  name: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  coverUrl?: string;
  chronicles?: ChronicleStage[];
}

interface CurrentKvkCardProps {
  kvk?: CurrentKvkInfo;
  lang?: 'vi' | 'en';
  onOpenDashboard?: () => void;
  onNavigateRanking?: () => void;
}

export const DEFAULT_CHRONICLES: ChronicleStage[] = [
  {
    id: 'c1',
    name: 'Crusader Camps',
    subtitle: 'First Steps',
    status: 'completed',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/camps.png',
    progressPercent: 100,
    utcDate: 'Sep 25, 00:00:00',
  },
  {
    id: 'c2',
    name: 'Crusader Fortresses',
    subtitle: 'Eye for an Eye',
    status: 'completed',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/fortress.png',
    progressPercent: 100,
    utcDate: 'Sep 25, 03:26:29',
  },
  {
    id: 'c3',
    name: 'Ancient Ruins',
    subtitle: 'Turf Wars',
    status: 'completed',
    colorTheme: 'purple',
    iconSrc: '/images/chronicles/ruins.png',
    progressPercent: 100,
    utcDate: 'Sep 27, 00:00:00',
  },
  {
    id: 'c4',
    name: 'Retribution',
    subtitle: '',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/retribution.png',
    progressPercent: 100,
    utcDate: 'Sep 29, 00:00:00',
  },
  {
    id: 'c5',
    name: 'Coalition Recruiter',
    subtitle: 'Revenge',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/recruiter.png',
    progressPercent: 100,
    utcDate: 'Oct 01, 00:00:00',
  },
  {
    id: 'c6',
    name: 'Lvl 4 Passes (Secured)',
    subtitle: 'Hand in Hand',
    status: 'completed',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 100,
    utcDate: 'Oct 03, 00:00:00',
  },
  {
    id: 'c7',
    name: 'Hierons',
    subtitle: 'Storm Clouds',
    status: 'completed',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/hierons.png',
    progressPercent: 100,
    utcDate: 'Oct 05, 00:00:00',
  },
  {
    id: 'c8',
    name: 'Sanctuaries',
    subtitle: 'Seeking Sanctuary',
    status: 'completed',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/sanctuaries.png',
    progressPercent: 100,
    utcDate: 'Oct 07, 00:00:00',
  },
  {
    id: 'c9',
    name: 'Lvl 12 Barbarian Forts',
    subtitle: 'Siege the Land',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/barbarian_fort.png',
    progressPercent: 100,
    utcDate: 'Oct 09, 00:00:00',
  },
  {
    id: 'c10',
    name: 'Lvl 5 Passes (Secured)',
    subtitle: 'Strife and Conflict',
    status: 'completed',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 100,
    utcDate: 'Oct 11, 00:00:00',
  },
  {
    id: 'c11',
    name: 'Lvl 6 Passes (Secured)',
    subtitle: 'Pushing Forward',
    status: 'completed',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 100,
    utcDate: 'Oct 13, 00:00:00',
  },
  {
    id: 'c12',
    name: 'Altars of Darkness',
    subtitle: 'Access Granted',
    status: 'completed',
    colorTheme: 'purple',
    iconSrc: '/images/chronicles/ruins.png',
    progressPercent: 100,
    utcDate: 'Oct 15, 00:00:00',
  },
  {
    id: 'c13',
    name: 'Circles',
    subtitle: 'Sacrificial Offering',
    status: 'completed',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/hierons.png',
    progressPercent: 100,
    utcDate: 'Oct 17, 00:00:00',
  },
  {
    id: 'c14',
    name: 'Lvl 13 Barbarian Forts',
    subtitle: 'Indomitable Contender',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/barbarian_fort.png',
    progressPercent: 100,
    utcDate: 'Oct 19, 00:00:00',
  },
  {
    id: 'c15',
    name: 'Coalition Recruiter',
    subtitle: 'Drums of War',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/recruiter.png',
    progressPercent: 100,
    utcDate: 'Oct 21, 00:00:00',
  },
  {
    id: 'c16',
    name: 'Lvl 14 Barbarian Forts',
    subtitle: 'Hall of Unity',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/barbarian_fort.png',
    progressPercent: 100,
    utcDate: 'Oct 23, 00:00:00',
  },
  {
    id: 'c17',
    name: 'Lvl 7 Passes (Unsealed)',
    subtitle: 'Brink of Annihilation',
    status: 'completed',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 100,
    utcDate: 'Oct 25, 00:00:00',
  },
  {
    id: 'c18',
    name: 'Arrows Nocked',
    subtitle: '',
    status: 'completed',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 100,
    utcDate: 'Oct 27, 00:00:00',
  },
  {
    id: 'c19',
    name: 'Lvl 8 Passes (Unsealed)',
    subtitle: 'Wolves & Lambs',
    status: 'active',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 50,
    utcDate: 'Oct 30, 00:00:00',
  },
  {
    id: 'c20',
    name: 'The Great Ziggurat',
    subtitle: 'Siege',
    status: 'upcoming',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/ziggurat.png',
    progressPercent: 0,
    utcDate: 'Nov 03, 00:00:00',
  },
  {
    id: 'c21',
    name: 'Lvl 9 Passes (Unsealed)',
    subtitle: 'Holy Site Heroes',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 0,
    utcDate: 'Nov 06, 00:00:00',
  },
  {
    id: 'c22',
    name: 'Stormy Seas',
    subtitle: '',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 0,
    utcDate: 'Nov 09, 00:00:00',
  },
  {
    id: 'c23',
    name: 'Eve of the End',
    subtitle: 'Final Stand',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 0,
    utcDate: 'Nov 12, 00:00:00',
  },
  {
    id: 'c24',
    name: 'Sunset Shadows',
    subtitle: 'Dusk falls',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 0,
    utcDate: 'Nov 14, 00:00:00',
  },
  {
    id: 'c25',
    name: 'The Return',
    subtitle: 'Glorious',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 0,
    utcDate: 'Nov 15, 00:00:00',
  },
  {
    id: 'c26',
    name: 'Every End Is A New Beginning',
    subtitle: 'Ebullient',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '/images/chronicles/relic.png',
    progressPercent: 0,
    utcDate: 'Nov 16, 00:00:00',
  },
];

export function CurrentKvkCard({
  kvk,
  lang = 'vi',
  onOpenDashboard,
  onNavigateRanking,
}: CurrentKvkCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  

  const name = kvk?.name || 'Mighty Assembly';
  const code = kvk?.code || 'C13315';
  const startDate = kvk?.startDate || '2026-09-25';
  const endDate = kvk?.endDate || '2026-11-16';
  const chronicles = kvk?.chronicles && kvk.chronicles.length > 0 ? kvk.chronicles : DEFAULT_CHRONICLES;

  // Calculate timeline percentage and days left
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(totalDuration, now - start));
  const progressPercent = Math.round((elapsed / totalDuration) * 100);

  // Dynamic days left calculation (17 days left on Oct 30)
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  const coverUrl = kvk?.coverUrl || '/covers/s21mighty_assembly_cover.png';

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('.chronicle-card.active') as HTMLElement;
      if (activeEl) {
        const container = scrollContainerRef.current;
        const targetScroll = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="my-kvk-section-container">
      {/* 1. SECTION TOP HEADER: Crossed swords icon + My KvK + Home kingdom • #2676 */}
      <div className="my-kvk-top-header">
        <div className="my-kvk-badge-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
            <line x1="13" y1="19" x2="19" y2="13" />
            <line x1="16" y1="16" x2="20" y2="20" />
            <line x1="19" y1="21" x2="21" y2="19" />
            <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
            <line x1="5" y1="14" x2="9" y2="18" />
            <line x1="7" y1="17" x2="4" y2="20" />
            <line x1="3" y1="19" x2="5" y2="21" />
          </svg>
        </div>
        <div className="my-kvk-top-title-wrap">
          <h3 className="my-kvk-top-title">My KvK</h3>
          <span className="my-kvk-top-sub">Home kingdom · #2676</span>
        </div>
      </div>

      {/* 2. ROKSTATS COMPACT MODERN KVK CARD */}
      <article className="my-kvk-card">
        {/* Hero Banner with Commanders Artwork */}
        <div
          className="my-kvk-hero-banner"
          style={{ backgroundImage: `url(${coverUrl})` }}
        >
          <div className="my-kvk-banner-overlay">
            <span className="my-kvk-scenario-name">{name}</span>
            <h2 className="my-kvk-scenario-code">{code}</h2>
          </div>
        </div>

        {/* Content Box */}
        <div className="my-kvk-content">
          {/* Kingdoms & Camps Info */}
          <div className="my-kvk-camps-meta">
            Kingdoms: 35 · 4 camps
          </div>

          <div className="my-kvk-camps-grid">
            <div className="my-kvk-camp-pill camp-fire" title="Fire Camp: 9 Kingdoms">
              <span className="camp-dot dot-fire" />
              <span className="camp-name">Fire</span>
              <span className="camp-count">9 KD</span>
            </div>

            <div className="my-kvk-camp-pill camp-earth" title="Earth Camp: 10 Kingdoms">
              <span className="camp-dot dot-earth" />
              <span className="camp-name">Earth</span>
              <span className="camp-count">10 KD</span>
            </div>

            <div className="my-kvk-camp-pill camp-wind is-yours" title="Wind Camp: 11 Kingdoms (Kingdom 2676 Camp)">
              <span className="camp-dot dot-wind" />
              <span className="camp-name">Wind</span>
              <span className="camp-count">11 KD</span>
              <span className="camp-yours-tag">· Yours</span>
            </div>

            <div className="my-kvk-camp-pill camp-water" title="Water Camp: 5 Kingdoms">
              <span className="camp-dot dot-water" />
              <span className="camp-name">Water</span>
              <span className="camp-count">5 KD</span>
            </div>
          </div>

          {/* War Phase & Progress Bar */}
          <div className="my-kvk-timeline-section">
            <div className="my-kvk-phase-header">
              <span className="phase-title">
                War phase · <b>{daysLeft}d left</b>
              </span>
            </div>

            <div className="my-kvk-progress-tracks">
              {/* Top track: Orange war phase line */}
              <div className="my-kvk-bar-orange" />
              {/* Bottom track: Elapsed blue line */}
              <div className="my-kvk-bar-blue-track">
                <div className="my-kvk-bar-blue" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="my-kvk-timeline-dates">
              <span>Sep 25, 2026</span>
              <span>Nov 16, 2026 · UTC</span>
            </div>
          </div>

          {/* Action Buttons Grid (2 columns) */}
          <div className="my-kvk-actions-grid">
            <button
              type="button"
              className="my-kvk-action-btn primary"
              onClick={onOpenDashboard}
              title={lang === 'vi' ? 'Xem bảng thống kê KvK chi tiết' : 'Open KvK Dashboard'}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>KvK dashboard</span>
            </button>

            <button
              type="button"
              className="my-kvk-action-btn"
              onClick={onNavigateRanking}
              title={lang === 'vi' ? 'Xem bảng xếp hạng vương quốc' : 'Kingdom ranking'}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3z" />
              </svg>
              <span>Kingdom ranking</span>
            </button>
          </div>

          {/* Chronicles Section (Always visible) */}
          <div className="my-kvk-chronicles-drawer">
            <div className="chronicles-header">
              <div className="chronicles-title-wrap">
                <h4>{lang === 'vi' ? 'Biên Niên Sử · 26 Giai Đoạn' : 'Chronicles · 26 Stages'}</h4>
              </div>
              <div className="chronicles-scroll-arrows">
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollLeft}
                  title="Scroll left"
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollRight}
                  title="Scroll right"
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="chronicles-grid" ref={scrollContainerRef}>
              {chronicles.map((stage, idx) => (
                <div
                  key={stage.id}
                  className={`chronicle-card ${stage.status}`}
                  title={`Stage ${idx + 1}: ${stage.name}`}
                >
                  <div className="card-top-track">
                    <div className={`card-track-line ${stage.status} ${stage.colorTheme || 'grey'}`} />
                    <div className={`card-track-circle ${stage.status} ${stage.colorTheme || 'grey'}`}>
                      {stage.iconSrc ? (
                        <img
                          src={stage.iconSrc}
                          alt={stage.name}
                          className="track-circle-img"
                          width={22}
                          height={22}
                        />
                      ) : (
                        <span className="track-circle-empty" />
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    <b className="card-name" title={stage.name}>
                      {stage.name}
                    </b>
                    {stage.subtitle ? (
                      <span className="card-sub" title={stage.subtitle}>
                        {stage.subtitle}
                      </span>
                    ) : (
                      <span className="card-sub card-sub-empty">&nbsp;</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Timestamp matching RoKStats */}
          <div className="my-kvk-footer">
            <span className="my-kvk-checked">
              🕒 Checked 10/30/26, 5:04 AM UTC
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
