import React, { useMemo, useState } from 'react';
import { GovernorAvatar } from './GovernorAvatar';
import { CopyIdButton } from './CopyIdButton';
import type { Lang } from '../i18n';

export type ZenithRankingRow = {
  rank: number;
  continentRank?: number;
  governorId: string;
  name: string;
  score: number;
  kingdom: number;
  allianceTag?: string;
  allianceName?: string;
  ch?: number;
  avatar?: string;
  avatarFrame?: string;
};

export type ZenithEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  continent?: string;
  continentKingdoms?: number[];
  skin?: {
    name: string;
    buff: string;
    img?: string;
  };
  status: 'ended' | 'active';
  rankings: ZenithRankingRow[];
  kdRankings?: ZenithRankingRow[];
  continentRankings?: ZenithRankingRow[];
};

interface ZenithViewProps {
  events: ZenithEvent[];
  selectedId: string;
  onSelectEvent: (id: string) => void;
  lang: Lang;
  i18n: any;
  fmt: Intl.NumberFormat;
}

export const ZenithView: React.FC<ZenithViewProps> = ({
  events,
  selectedId,
  onSelectEvent,
  lang,
  i18n,
  fmt
}) => {
  const [selectedKingdom, setSelectedKingdom] = useState<number | null>(null);
  const currentEvent = events.find(e => e.id === selectedId) || events[0];

  const continentList = currentEvent?.continentKingdoms || [2673, 2674, 2675, 2676, 2677, 2678, 2679, 2680];

  // Base list is continentRankings (Top 10 of Continent #2673-2680)
  const baseContinentRankings = (currentEvent?.continentRankings && currentEvent.continentRankings.length > 0)
    ? currentEvent.continentRankings
    : (currentEvent?.rankings || []);

  const currentRankings = useMemo(() => {
    if (!selectedKingdom) {
      // By default: Top 10 of Continent #2673-2680
      return baseContinentRankings.slice(0, 10);
    }
    // Filtered by specific kingdom (e.g. 2676)
    if (selectedKingdom === 2676 && currentEvent?.kdRankings && currentEvent.kdRankings.length > 0) {
      return currentEvent.kdRankings.slice(0, 10);
    }
    return baseContinentRankings.filter(r => r.kingdom === selectedKingdom).slice(0, 10);
  }, [baseContinentRankings, selectedKingdom, currentEvent]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="rank-badge rank-1" title="Top 1">🥇 1</span>;
    if (rank === 2) return <span className="rank-badge rank-2" title="Top 2">🥈 2</span>;
    if (rank === 3) return <span className="rank-badge rank-3" title="Top 3">🥉 3</span>;
    return <span className="rank-badge rank-other">{rank}</span>;
  };

  return (
    <section className="view active zenith-view">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{i18n.zenith.kicker}</p>
          <h2>{i18n.zenith.title}</h2>
          <p className="section-sub">{i18n.zenith.subtitle}</p>
        </div>
        <div className="event-scope-meta">
          <span className="event-count-badge">{events.length} {lang === 'vi' ? 'mùa gần nhất' : 'recent seasons'}</span>
          <span className="top10-tag">Top 10 Cụm #2673–2680</span>
        </div>
      </div>

      {/* Season archive date picker selector */}
      <div className="event-archive-selector-card">
        <div className="event-archive-header">
          <div className="archive-title-wrap">
            <svg className="archive-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="archive-label">{i18n.zenith.eventArchive}</span>
          </div>
          <span className="archive-note">
            {lang === 'vi' ? 'Nhấn vào ngày mùa giải để xem bảng xếp hạng' : 'Click a season date to view rankings'}
          </span>
        </div>

        <div className="event-pills-grid" role="tablist" aria-label="Zenith Seasons">
          {events.map((ev, idx) => {
            const isSelected = ev.id === currentEvent?.id;
            return (
              <button
                key={ev.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`event-pill-btn zenith-pill-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectEvent(ev.id);
                  setSelectedKingdom(null);
                }}
              >
                <div className="event-pill-top">
                  <span className="event-pill-title">{ev.title}</span>
                  {idx === 0 && <span className="newest-tag">{lang === 'vi' ? 'MỚI NHẤT' : 'LATEST'}</span>}
                </div>
                <div className="event-pill-bottom">
                  <span className="event-status-badge status-ended">
                    {ev.status === 'ended' ? i18n.zenith.ended : i18n.zenith.active}
                  </span>
                  {ev.skin?.name && (
                    <span className="zenith-skin-tag" title={ev.skin.buff || ev.skin.name}>
                      👑 {ev.skin.name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Season Header Banner & Skin Info */}
      {currentEvent && (
        <div className="selected-event-banner zenith-banner">
          <div className="selected-banner-left">
            <div className="banner-title-row">
              <h3 className="selected-event-title">{currentEvent.title}</h3>
              <span className="event-status-badge status-ended">
                {currentEvent.status === 'ended' ? i18n.zenith.ended : i18n.zenith.active}
              </span>
            </div>
            <p className="selected-event-dates">
              <span className="calendar-icon">📅</span> {currentEvent.title} · <strong style={{ color: '#38bdf8' }}>{currentEvent.continent || '#2673–2680'}</strong>
            </p>
          </div>

          {currentEvent.skin?.name && (
            <div className="zenith-skin-card">
              {currentEvent.skin.img && (
                <img
                  src={currentEvent.skin.img}
                  alt={currentEvent.skin.name}
                  className="zenith-skin-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              )}
              <div className="zenith-skin-info">
                <span className="zenith-skin-kicker">{i18n.zenith.rewardSkin}</span>
                <strong className="zenith-skin-name">{currentEvent.skin.name}</strong>
                {currentEvent.skin.buff && (
                  <span className="zenith-skin-buff">⚡ {currentEvent.skin.buff}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Continent Kingdoms Filter Bar (similar to ROKStats) */}
      <div className="continent-filter-card">
        <div className="continent-filter-header">
          <div className="continent-title-wrap">
            <span className="continent-icon">🌐</span>
            <strong className="continent-label">{currentEvent?.continent || '#2673–2680'}</strong>
            <span className="continent-meta-tag">{lang === 'vi' ? 'Cụm 8 Vương quốc' : 'Continent 8 Kingdoms'}</span>
          </div>
          <span className="continent-hint-text">
            {i18n.zenith.clickKingdomHint}
          </span>
        </div>

        <div className="continent-chips-row">
          <button
            type="button"
            className={`continent-chip ${selectedKingdom === null ? 'active' : ''}`}
            onClick={() => setSelectedKingdom(null)}
          >
            🌐 {i18n.zenith.allContinent}
          </button>
          {continentList.map((kNum) => {
            const isSelf = kNum === 2676;
            const isSelected = selectedKingdom === kNum;
            return (
              <button
                key={kNum}
                type="button"
                className={`continent-chip ${isSelected ? 'active' : ''} ${isSelf ? 'chip-self' : ''}`}
                onClick={() => setSelectedKingdom(prev => prev === kNum ? null : kNum)}
                title={isSelf ? (lang === 'vi' ? 'Kingdom 2676 của chúng ta' : 'Our Kingdom 2676') : `#${kNum}`}
              >
                {isSelf ? `🏰 #${kNum}` : `#${kNum}`}
                {isSelf && <span className="chip-self-badge">KD</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 10 Rankings Table */}
      {currentRankings.length > 0 ? (
        <div className="table-card zenith-rankings-card">
          <div className="table-header-info">
            <div className="table-header-left">
              <span className="top10-subhead">
                {selectedKingdom === null
                  ? (lang === 'vi' ? 'Bảng xếp hạng Top 10 Cụm #2673–2680' : 'Continent #2673–2680 Top 10 Leaderboard')
                  : (lang === 'vi' ? `Thống đốc Kingdom ${selectedKingdom} trong mùa này (Top 10)` : `Kingdom ${selectedKingdom} Governors (Top 10)`)}
              </span>
            </div>
            <span className="top10-heading">{i18n.zenith.top10Note}</span>
          </div>

          <div className="table-responsive">
            <table className="kd-table zenith-table">
              <thead>
                <tr>
                  <th className="th-rank">{i18n.zenith.tableRank}</th>
                  <th className="th-player">{i18n.zenith.tablePlayer}</th>
                  <th className="th-score">{i18n.zenith.tableScore}</th>
                  <th className="th-kd">{i18n.zenith.tableKingdom}</th>
                  <th className="th-alliance">{i18n.zenith.tableAlliance}</th>
                  <th className="th-ch">{i18n.zenith.tableCH}</th>
                </tr>
              </thead>
              <tbody>
                {currentRankings.slice(0, 10).map((row, idx) => {
                  const displayRank = selectedKingdom === null ? (row.continentRank || row.rank || (idx + 1)) : (idx + 1);
                  const isHome = row.kingdom === 2676;
                  return (
                    <tr
                      key={row.governorId || `${row.rank}-${idx}`}
                      className={`rank-row rank-row-${displayRank} ${isHome ? 'row-home-kd' : ''}`}
                    >
                      <td className="td-rank">
                        {getRankBadge(displayRank)}
                      </td>
                      <td className="td-player">
                        <div className="gov-cell">
                          <GovernorAvatar
                            src={row.avatar}
                            frame={row.avatarFrame}
                            name={row.name}
                            size={40}
                          />
                          <div className="gov-info">
                            <div className="gov-name-row">
                              <span className="gov-name" title={row.name}>{row.name}</span>
                              {isHome && (
                                <span className="home-gov-tag" title={lang === 'vi' ? 'Thống đốc Kingdom 2676' : 'KD 2676 Governor'}>
                                  2676
                                </span>
                              )}
                            </div>
                            <CopyIdButton id={row.governorId} lang={lang} />
                          </div>
                        </div>
                      </td>
                      <td className="td-score">
                        <div className="score-val-wrap">
                          <span className="score-icon">⚡</span>
                          <strong className="score-num">{fmt.format(row.score)}</strong>
                        </div>
                      </td>
                      <td className="td-kd">
                        <span className={`kd-badge ${isHome ? 'kd-self' : ''}`}>
                          {isHome ? '🏰 #2676' : `#${row.kingdom}`}
                        </span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-event-card">
          <div className="empty-event-icon">🏆</div>
          <h4>{lang === 'vi' ? 'Chưa có dữ liệu bảng xếp hạng cho lựa chọn này' : 'No rankings data for this selection'}</h4>
        </div>
      )}
    </section>
  );
};
