import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
}

function formatUtcDisplay(utcStr: string, lang: 'vi' | 'en') {
  if (lang !== 'vi') return utcStr;
  return utcStr
    .replace('Sep', 'Th09')
    .replace('Oct', 'Th10')
    .replace('Nov', 'Th11');
}

export const DEFAULT_CHRONICLES: ChronicleStage[] = [
  // 1 to 8 from ROKStats official Mighty Assembly schedule
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
    name: 'Crusader Fortress',
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
    status: 'active',
    colorTheme: 'purple',
    iconSrc: '/images/chronicles/ruins.png',
    progressPercent: 100,
    utcDate: '🔒 ----',
  },
  {
    id: 'c4',
    name: 'Retribution',
    subtitle: 'Retribution',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c5',
    name: 'Coalition Recruiter',
    subtitle: 'Revenge',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c6',
    name: 'Lvl 4 Passes (Sealed)',
    subtitle: 'Hand in Hand',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '/images/chronicles/passes.png',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c7',
    name: 'Hierons',
    subtitle: 'Storm Clouds',
    status: 'locked',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/hierons.png',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c8',
    name: 'Sanctuaries',
    subtitle: 'Seeking Sanctuary',
    status: 'locked',
    colorTheme: 'green',
    iconSrc: '/images/chronicles/sanctuaries.png',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  // 9 to 26 completing the 26 Season of Conquest chapters
  {
    id: 'c9',
    name: 'Barbarian Forts',
    subtitle: 'Purging Shadows',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c10',
    name: 'Altars of Darkness',
    subtitle: 'Holy Ground',
    status: 'locked',
    colorTheme: 'purple',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c11',
    name: 'Lvl 5 Passes (Sealed)',
    subtitle: 'Borders Fall',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c12',
    name: 'Zone 5 Bastions',
    subtitle: 'Frontier Bastions',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c13',
    name: 'Lvl 6 Passes (Sealed)',
    subtitle: 'Inner Realm',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c14',
    name: 'Central Ruins',
    subtitle: 'Ancient Power',
    status: 'locked',
    colorTheme: 'purple',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c15',
    name: 'Lvl 7 Passes (Sealed)',
    subtitle: 'Point of Impact',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c16',
    name: 'Zone 6 Bastions',
    subtitle: 'The Deep Frontier',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c17',
    name: 'Lvl 8 Passes (Sealed)',
    subtitle: 'Mountain Bottlenecks',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c18',
    name: 'Altar of Ashes',
    subtitle: 'Ashen Trial',
    status: 'locked',
    colorTheme: 'purple',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c19',
    name: 'The Great Ziggurat',
    subtitle: 'Heart of Lost Land',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c20',
    name: 'Lvl 9 Passes (Sealed)',
    subtitle: 'Imperial Gates',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c21',
    name: 'Kingsland Vanguard',
    subtitle: 'Corridors of Power',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c22',
    name: 'Siege of Ziggurat',
    subtitle: 'Supreme Conflict',
    status: 'locked',
    colorTheme: 'purple',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c23',
    name: 'Clash of Titans',
    subtitle: 'The Final Stand',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c24',
    name: 'Ceasefire Vigil',
    subtitle: 'Guardian Watch',
    status: 'locked',
    colorTheme: 'grey',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c25',
    name: 'The Final Settlement',
    subtitle: 'Crusader Glory',
    status: 'locked',
    colorTheme: 'amber',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
  {
    id: 'c26',
    name: 'Immigration & Peace',
    subtitle: 'Epilogue',
    status: 'locked',
    colorTheme: 'purple',
    iconSrc: '',
    progressPercent: 0,
    utcDate: '🔒 ----',
  },
];

export function CurrentKvkCard({ kvk, lang = 'vi' }: CurrentKvkCardProps) {
  const [selectedStage, setSelectedStage] = useState<ChronicleStage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const name = kvk?.name || 'Mighty Assembly';
  const code = kvk?.code || 'C13315';
  const startDate = kvk?.startDate || '2026-09-25';
  const endDate = kvk?.endDate || '2026-11-16';
  const chronicles = kvk?.chronicles && kvk.chronicles.length > 0 ? kvk.chronicles : DEFAULT_CHRONICLES;

  // Calculate overall timeline percentage
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(totalDuration, now - start));
  const progressPercent = Math.round((elapsed / totalDuration) * 100);

  // Auto-scroll to active stage on load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('.chronicle-card.active') as HTMLElement;
      if (activeEl) {
        const container = scrollContainerRef.current;
        const targetScroll = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, []);

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

  const coverUrl = kvk?.coverUrl || '/covers/s21mighty_assembly_cover.png';
  const currentStageIndex = selectedStage ? chronicles.findIndex(c => c.id === selectedStage.id) : -1;

  return (
    <>
      <article
        className="panel current-kvk-card"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(13, 17, 25, 0.94) 0%, rgba(13, 17, 25, 0.72) 48%, rgba(13, 17, 25, 0.22) 100%), url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Header: KvK Dashboard */}
        <div className="current-kvk-header">
          <div className="current-kvk-title-group">
            <span className="kvk-section-title">
              {lang === 'vi' ? 'BẢNG ĐIỀU KHIỂN KVK' : 'KVK DASHBOARD'}
            </span>
            <div className="kvk-code-row">
              <h2 className="kvk-code-heading">#{code}</h2>
              <span className="kvk-name-badge">{name}</span>
              <span className="kvk-status-live">
                <i className="status-dot ready pulse" />
                {lang === 'vi' ? 'Đang diễn ra' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* KvK Progress ROKStats Style Dual Track */}
        <div className="rok-progress-section">
          <div className="rok-progress-header">
            <div className="rok-progress-label">
              <span>{lang === 'vi' ? 'Tiến độ KvK' : 'KvK Progress'}</span> <b>{progressPercent}%</b>
            </div>
            <div className="rok-progress-schedule">
              {lang === 'vi' ? '25/09/2026 – 16/11/2026' : '25 Sep 2026 — 16 Nov 2026'}
            </div>
          </div>

          <div className="rok-dual-lines">
            {/* Top Line: Battle Phase (orange) + Immigration Phase (purple) with Hover Tooltips */}
            <div className="rok-line top-line">
              <div
                className="rok-segment orange phase-tooltip-trigger"
                style={{ width: '96.15%' }}
                aria-label="Battle Phase"
                tabIndex={0}
              >
                <div className="phase-tooltip tooltip-orange">
                  <span className="tooltip-title">Battle Phase</span>
                  <span className="tooltip-dates">
                    {lang === 'vi' ? '25/09/2026 – 14/11/2026' : '25 Sep 2026 — 14 Nov 2026'}
                  </span>
                </div>
              </div>
              <div
                className="rok-segment purple phase-tooltip-trigger"
                style={{ width: '3.85%' }}
                aria-label="Immigration Phase"
                tabIndex={0}
              >
                <div className="phase-tooltip tooltip-purple">
                  <span className="tooltip-title">Immigration Phase</span>
                  <span className="tooltip-dates">
                    {lang === 'vi' ? '14/11/2026 – 16/11/2026' : '14 Nov 2026 — 16 Nov 2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Line: Current Time Progress (64% blue) */}
            <div className="rok-line bottom-line">
              <div className="rok-segment blue" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="rok-dates-row">
            <span>{lang === 'vi' ? '25/09/2026' : '25 Sep 2026'}</span>
            <span>{lang === 'vi' ? '16/11/2026' : '16 Nov 2026'}</span>
          </div>
        </div>

        {/* Chronicles Section */}
        <div className="chronicles-container">
          <div className="chronicles-header">
            <div className="chronicles-title-wrap">
              <h4>{lang === 'vi' ? 'Biên niên sử' : 'Chronicles'}</h4>
              <span className="chronicles-count-badge">
                {chronicles.length} {lang === 'vi' ? 'Giai đoạn' : 'Stages'}
              </span>
            </div>

            <div className="chronicles-nav-actions">
              <div className="chronicles-scroll-arrows">
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollLeft}
                  title={lang === 'vi' ? 'Cuộn sang trái' : 'Scroll left'}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollRight}
                  title={lang === 'vi' ? 'Cuộn sang phải' : 'Scroll right'}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>

              <div className="chronicles-utc-badge">
                <span>UTC</span>
              </div>
            </div>
          </div>

          {/* Chronicles Card Grid / Horizontal Scroll Track */}
          <div className="chronicles-grid" ref={scrollContainerRef}>
            {chronicles.map((stage, idx) => (
              <div
                key={stage.id}
                className={`chronicle-card ${stage.status}`}
                onClick={() => setSelectedStage(stage)}
                title={lang === 'vi' ? `Giai đoạn ${idx + 1}: ${stage.name}` : `Stage ${idx + 1}: ${stage.name}`}
              >
                <div className="card-top-track">
                  <div
                    className={`card-track-line ${stage.status} ${stage.colorTheme || 'grey'}`}
                  />
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
                  <span className="card-sub">{stage.subtitle}</span>
                  <small className="card-date">{formatUtcDisplay(stage.utcDate, lang)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Chronicle Stage Detail Modal */}
      {selectedStage && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedStage(null)}>
          <div
            className="modal-box chronicle-detail-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div>
                <span className="section-kicker">
                  {lang === 'vi'
                    ? `BIÊN NIÊN SỬ · GIAI ĐOẠN ${currentStageIndex + 1}/${chronicles.length}`
                    : `CHRONICLE · STAGE ${currentStageIndex + 1}/${chronicles.length}`}
                </span>
                <h3>{selectedStage.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedStage(null)}
                aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Stage Subtitle & Status Badge */}
              <div className="chronicle-modal-status-bar">
                <div className="chronicle-modal-meta">
                  {selectedStage.iconSrc && (
                    <img
                      src={selectedStage.iconSrc}
                      alt={selectedStage.name}
                      className="modal-stage-icon"
                      width={28}
                      height={28}
                    />
                  )}
                  <b>{selectedStage.subtitle}</b>
                  <span>·</span>
                  <span className="modal-date-chip">{selectedStage.utcDate}</span>
                </div>
                <span className={`stage-badge-status ${selectedStage.status}`}>
                  {selectedStage.status === 'completed' && (lang === 'vi' ? '✓ Đã hoàn thành' : '✓ Completed')}
                  {selectedStage.status === 'active' && (lang === 'vi' ? '⚔ Đang diễn ra' : '⚔ In Progress')}
                  {selectedStage.status === 'upcoming' && (lang === 'vi' ? '⏳ Sắp mở' : '⏳ Upcoming')}
                  {selectedStage.status === 'locked' && (lang === 'vi' ? '🔒 Đang khóa' : '🔒 Locked')}
                </span>
              </div>

              {/* Stage Quick Switcher (All 26 stages) */}
              <div className="stage-quick-nav">
                <span className="nav-label">
                  {lang === 'vi' ? 'Chuyển nhanh giai đoạn:' : 'Jump to stage:'}
                </span>
                <div className="stage-nav-pills scrollable-nav-pills">
                  {chronicles.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`stage-nav-pill ${c.status} ${selectedStage.id === c.id ? 'active' : ''}`}
                      onClick={() => setSelectedStage(c)}
                      title={`${idx + 1}. ${c.name}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedStage(null)}
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
