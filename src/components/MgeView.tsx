import React from 'react';
import { GovernorAvatar } from './GovernorAvatar';
import { CopyIdButton } from './CopyIdButton';
import type { Lang } from '../i18n';

export type TroopType = 'archer' | 'infantry' | 'cavalry' | 'leadership';

export type MgeRankingRow = {
  rank: number;
  governorId: string;
  name: string;
  score: number;
  allianceTag?: string;
  allianceName?: string;
  ch?: number;
  avatar?: string;
  avatarFrame?: string;
};

export type MgeEvent = {
  id: string;
  edition: number | null;
  title: string;
  dateLabel: string;
  dates: string;
  status: 'upcoming' | 'closed' | 'finished' | 'active';
  commanders: string[];
  troopType?: TroopType;
  rankings: MgeRankingRow[];
};

interface MgeViewProps {
  events: MgeEvent[];
  selectedId: string;
  onSelectEvent: (id: string) => void;
  lang: Lang;
  i18n: any;
  fmt: Intl.NumberFormat;
}

export const COMMANDER_TROOP_MAP: Record<string, TroopType> = {
  // Archer (Cung thủ)
  'hayam wuruk': 'archer', 'shapur i': 'archer', 'choe yeong': 'archer',
  'ashurbanipal': 'archer', 'dido': 'archer', 'henry v': 'archer',
  'amanitore': 'archer', 'nebuchadnezzar ii': 'archer', 'nebuchadnezzar': 'archer',
  'artemisia i': 'archer', 'artemisia': 'archer', 'tomyris': 'archer',
  'edward of woodstock': 'archer', 'edward': 'archer', 'yi seong-gye': 'archer', 'ysg': 'archer',
  'el cid': 'archer', 'zhuge liang': 'archer', 'boudica prime': 'archer', 'hermann prime': 'archer',

  // Infantry (Bộ binh)
  'ivar': 'infantry', 'ivar the boneless': 'infantry', 'gorgo': 'infantry',
  'tokugawa ieyasu': 'infantry', 'tokugawa': 'infantry', 'scipio aemilianus': 'infantry',
  'scipio africanus prime': 'infantry', 'scipio prime': 'infantry',
  'zenobia': 'infantry', 'constantine i': 'infantry', 'constantine': 'infantry',
  'pakal': 'infantry', 'flavius': 'infantry', 'guan yu': 'infantry',
  'alexander the great': 'infantry', 'alexander': 'infantry', 'richard i': 'infantry',
  'charles martel': 'infantry', 'leonidas i': 'infantry', 'leonidas': 'infantry',
  'cheok jun-gyeong': 'infantry', 'tariq': 'infantry', 'sargon': 'infantry',
  'liu che': 'infantry', 'arthur': 'infantry',

  // Cavalry (Kỵ binh)
  'david iv': 'cavalry', 'david': 'cavalry', 'attila': 'cavalry', 'subutai': 'cavalry',
  'chandragupta': 'cavalry', 'takeda shingen': 'cavalry', 'takeda': 'cavalry',
  'saladin': 'cavalry', 'genghis khan': 'cavalry', 'minamoto no yoshitsune': 'cavalry',
  'minamoto': 'cavalry', 'cao cao': 'cavalry', 'william i': 'cavalry',
  'bertrand': 'cavalry', 'nevsky': 'cavalry', 'joan of arc prime': 'cavalry',
  'joan prime': 'cavalry', 'huo qubing': 'cavalry', 'justinian i': 'cavalry',

  // Leadership (Lãnh đạo)
  'william marshal': 'leadership', 'vercingetorix': 'leadership', 'heraclius': 'leadership',
  'matthias i': 'leadership', 'theodora': 'leadership', 'wu zetian': 'leadership',
  'trajan': 'leadership', 'mehmed ii': 'leadership', 'julius caesar': 'leadership',
  'frederick i': 'leadership', 'charlemagne': 'leadership', 'moctezuma i': 'leadership',
  'babur': 'leadership', 'pyrrhus': 'leadership', 'themistocles': 'leadership'
};

export function detectMgeTroopType(commanders?: string[], explicit?: TroopType): TroopType {
  if (explicit) return explicit;
  if (!commanders || commanders.length === 0) return 'archer';
  const counts: Record<TroopType, number> = { archer: 0, infantry: 0, cavalry: 0, leadership: 0 };
  for (const c of commanders) {
    const norm = String(c).toLowerCase().trim();
    for (const [key, type] of Object.entries(COMMANDER_TROOP_MAP)) {
      if (norm.includes(key)) {
        counts[type]++;
        break;
      }
    }
  }
  let maxType: TroopType = 'archer';
  let maxCount = 0;
  for (const [type, count] of Object.entries(counts) as [TroopType, number][]) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  return maxType;
}

export const MgeView: React.FC<MgeViewProps> = ({
  events,
  selectedId,
  onSelectEvent,
  lang,
  i18n,
  fmt
}) => {
  const currentEvent = events.find(e => e.id === selectedId) || events[0];

  const getStatusBadge = (status: MgeEvent['status']) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="event-status-badge status-upcoming">
            <span className="status-dot-pulse" />
            {i18n.mge.upcoming}
          </span>
        );
      case 'active':
        return (
          <span className="event-status-badge status-active">
            <span className="status-dot-pulse" />
            {lang === 'vi' ? 'Đang diễn ra' : 'Active'}
          </span>
        );
      case 'closed':
        return (
          <span className="event-status-badge status-closed">
            {i18n.mge.closed}
          </span>
        );
      case 'finished':
      default:
        return (
          <span className="event-status-badge status-finished">
            {i18n.mge.finished}
          </span>
        );
    }
  };

  const getTroopBadge = (troopType: TroopType, size: 'small' | 'large' = 'small') => {
    const config = {
      archer: {
        icon: `${import.meta.env.BASE_URL}images/troops/archer.png`,
        labelVi: 'Cung thủ (Archer)',
        labelEn: 'Archer',
        className: 'troop-archer'
      },
      infantry: {
        icon: `${import.meta.env.BASE_URL}images/troops/infantry.png`,
        labelVi: 'Bộ binh (Infantry)',
        labelEn: 'Infantry',
        className: 'troop-infantry'
      },
      cavalry: {
        icon: `${import.meta.env.BASE_URL}images/troops/cavalry.png`,
        labelVi: 'Kỵ binh (Cavalry)',
        labelEn: 'Cavalry',
        className: 'troop-cavalry'
      },
      leadership: {
        icon: `${import.meta.env.BASE_URL}images/troops/leadership.png`,
        labelVi: 'Lãnh đạo (Leadership)',
        labelEn: 'Leadership',
        className: 'troop-leadership'
      }
    }[troopType];

    const label = lang === 'vi' ? config.labelVi : config.labelEn;
    const px = size === 'large' ? 40 : 34;

    return (
      <span
        className={`troop-icon-badge ${config.className} size-${size}`}
        title={`${lang === 'vi' ? 'Binh chủng' : 'Troop type'}: ${label}`}
        aria-label={label}
      >
        <img
          src={config.icon}
          alt={label}
          className="troop-icon-img"
          width={px}
          height={px}
        />
      </span>
    );
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="rank-badge rank-1" title="Top 1">🥇 1</span>;
    if (rank === 2) return <span className="rank-badge rank-2" title="Top 2">🥈 2</span>;
    if (rank === 3) return <span className="rank-badge rank-3" title="Top 3">🥉 3</span>;
    return <span className="rank-badge rank-other">{rank}</span>;
  };

  return (
    <section className="view active mge-view">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{i18n.mge.kicker}</p>
          <h2>{i18n.mge.title}</h2>
          <p className="section-sub">{i18n.mge.subtitle}</p>
        </div>
        <div className="event-scope-meta">
          <span className="event-count-badge">8 {lang === 'vi' ? 'kỳ gần nhất' : 'recent editions'}</span>
          <span className="top10-tag">Top 10</span>
        </div>
      </div>

      {/* Event archive date picker selector */}
      <div className="event-archive-selector-card">
        <div className="event-archive-header">
          <div className="archive-title-wrap">
            <svg className="archive-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="archive-label">{i18n.mge.eventArchive}</span>
          </div>
          <span className="archive-note">
            {lang === 'vi' ? 'Nhấn vào ngày để xem bảng xếp hạng' : 'Click an event date to view rankings'}
          </span>
        </div>

        <div className="event-pills-grid" role="tablist" aria-label="MGE Events">
          {events.map((ev, idx) => {
            const isSelected = ev.id === currentEvent?.id;
            const troopType = detectMgeTroopType(ev.commanders, ev.troopType);
            return (
              <button
                key={ev.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`event-pill-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectEvent(ev.id)}
              >
                <div className="event-pill-content">
                  <div className="event-pill-top">
                    <span className="event-pill-title">{ev.title}</span>
                    {idx === 0 && <span className="newest-tag">{lang === 'vi' ? 'MỚI' : 'LATEST'}</span>}
                  </div>
                  <div className="event-pill-bottom">
                    {getStatusBadge(ev.status)}
                  </div>
                </div>
                <div className="event-pill-troop-col">
                  {getTroopBadge(troopType, 'small')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected event details header banner */}
      {currentEvent && (
        <div className="selected-event-banner">
          <div className="selected-banner-left">
            <div className="banner-title-row">
              <h3 className="selected-event-title">{currentEvent.title}</h3>
              {getStatusBadge(currentEvent.status)}
              {getTroopBadge(detectMgeTroopType(currentEvent.commanders, currentEvent.troopType), 'large')}
            </div>
            <p className="selected-event-dates">
              <span className="calendar-icon">📅</span> {currentEvent.dates}
            </p>
          </div>

          {currentEvent.commanders && currentEvent.commanders.length > 0 && (
            <div className="selected-banner-commanders">
              <span className="cmd-header-label">{i18n.mge.commandersTitle}</span>
              <div className="cmd-tags-list">
                {currentEvent.commanders.map((cmd) => (
                  <span key={cmd} className="commander-tag">
                    <span className="cmd-icon">⚔️</span> {cmd}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top 10 Rankings Table */}
      {currentEvent && currentEvent.rankings.length > 0 ? (
        <div className="table-card mge-rankings-card">
          <div className="table-header-info">
            <span className="top10-heading">{i18n.mge.top10Note}</span>
            <span className="ranking-capture-tag">
              {currentEvent.status === 'closed' || currentEvent.status === 'finished'
                ? (lang === 'vi' ? 'Kết quả chính thức' : 'Official result')
                : (lang === 'vi' ? 'Điểm hiện tại' : 'Live scores')}
            </span>
          </div>

          <div className="table-responsive">
            <table className="kd-table mge-table">
              <thead>
                <tr>
                  <th className="th-rank">{i18n.mge.tableRank}</th>
                  <th className="th-gov">{i18n.mge.tableGovernor}</th>
                  <th className="th-alliance">{i18n.mge.tableAlliance}</th>
                  <th className="th-ch">CH</th>
                  <th className="th-score">{i18n.mge.tableScore}</th>
                </tr>
              </thead>
              <tbody>
                {currentEvent.rankings.slice(0, 10).map((row) => (
                  <tr key={row.governorId || row.rank} className={`rank-row rank-row-${row.rank}`}>
                    <td className="td-rank">
                      {getRankBadge(row.rank)}
                    </td>
                    <td className="td-gov">
                      <div className="gov-cell">
                        <GovernorAvatar
                          src={row.avatar}
                          frame={row.avatarFrame}
                          name={row.name}
                          size={38}
                        />
                        <div className="gov-info">
                          <span className="gov-name" title={row.name}>{row.name}</span>
                          <CopyIdButton id={row.governorId} lang={lang} />
                        </div>
                      </div>
                    </td>
                    <td className="td-alliance">
                      {row.allianceTag ? (
                        <div className="alliance-pill-wrap" title={row.allianceName || row.allianceTag}>
                          <span className="alliance-tag-badge">[{row.allianceTag}]</span>
                          {row.allianceName && <span className="alliance-full-name">{row.allianceName}</span>}
                        </div>
                      ) : (
                        <span className="no-alliance">—</span>
                      )}
                    </td>
                    <td className="td-ch">
                      <span className="ch-badge">CH {row.ch || 25}</span>
                    </td>
                    <td className="td-score">
                      <div className="score-val-wrap">
                        <span className="score-icon">⚡</span>
                        <strong className="score-num">{fmt.format(row.score)}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-event-card">
          <div className="empty-event-icon">⏳</div>
          <h4>{i18n.mge.upcoming}</h4>
          <p>{i18n.mge.upcomingNotice}</p>
        </div>
      )}
    </section>
  );
};
