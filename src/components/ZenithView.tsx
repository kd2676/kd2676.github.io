import React, { useState } from 'react';
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
  skin?: {
    name: string;
    buff: string;
    img?: string;
  };
  status: 'ended' | 'active';
  rankings: ZenithRankingRow[];
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
  const [scope, setScope] = useState<'kd' | 'continent'>('kd');
  const currentEvent = events.find(e => e.id === selectedId) || events[0];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="rank-badge rank-1" title="Top 1">🥇 1</span>;
    if (rank === 2) return <span className="rank-badge rank-2" title="Top 2">🥈 2</span>;
    if (rank === 3) return <span className="rank-badge rank-3" title="Top 3">🥉 3</span>;
    return <span className="rank-badge rank-other">{rank}</span>;
  };

  const currentRankings = scope === 'kd'
    ? (currentEvent?.rankings || [])
    : (currentEvent?.continentRankings || currentEvent?.rankings || []);

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
          <span className="top10-tag">Top 10</span>
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
                onClick={() => onSelectEvent(ev.id)}
              >
                <div className="event-pill-top">
                  <span className="event-pill-title">{ev.title}</span>
                  {idx === 0 && <span className="newest-tag">{lang === 'vi' ? 'MỚI' : 'LATEST'}</span>}
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
              <span className="calendar-icon">📅</span> {currentEvent.title}
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

      {/* Scope toggle: Kingdom 2676 (default) vs Continent */}
      <div className="zenith-controls-row">
        <div className="zenith-scope-toggle" role="group" aria-label="Ranking scope">
          <button
            type="button"
            className={`scope-btn ${scope === 'kd' ? 'active' : ''}`}
            onClick={() => setScope('kd')}
          >
            🛡️ {i18n.zenith.scopeKd}
          </button>
          <button
            type="button"
            className={`scope-btn ${scope === 'continent' ? 'active' : ''}`}
            onClick={() => setScope('continent')}
          >
            🌐 {i18n.zenith.scopeContinent}
          </button>
        </div>
        <span className="top10-heading">{i18n.zenith.top10Note}</span>
      </div>

      {/* Top 10 Rankings Table */}
      {currentRankings.length > 0 ? (
        <div className="table-card zenith-rankings-card">
          <div className="table-header-info">
            <span className="top10-subhead">
              {scope === 'kd'
                ? (lang === 'vi' ? 'Bảng xếp hạng Thống đốc Kingdom 2676 (Top 10)' : 'Kingdom 2676 Top 10 Leaderboard')
                : (lang === 'vi' ? 'Bảng xếp hạng Toàn Lục địa (Top 10)' : 'Continent Top 10 Leaderboard')}
            </span>
          </div>

          <div className="table-responsive">
            <table className="kd-table zenith-table">
              <thead>
                <tr>
                  <th className="th-rank">{i18n.zenith.tableRank}</th>
                  <th className="th-cont-rank">{i18n.zenith.tableContRank}</th>
                  <th className="th-player">{i18n.zenith.tablePlayer}</th>
                  <th className="th-kd">{i18n.zenith.tableKingdom}</th>
                  <th className="th-alliance">{i18n.zenith.tableAlliance}</th>
                  <th className="th-ch">{i18n.zenith.tableCH}</th>
                  <th className="th-score">{i18n.zenith.tableScore}</th>
                </tr>
              </thead>
              <tbody>
                {currentRankings.slice(0, 10).map((row) => (
                  <tr key={row.governorId || row.rank} className={`rank-row rank-row-${row.rank}`}>
                    <td className="td-rank">
                      {getRankBadge(row.rank)}
                    </td>
                    <td className="td-cont-rank">
                      {row.continentRank ? (
                        <span className={`continent-rank-pill ${row.continentRank <= 10 ? 'top-continent' : ''}`}>
                          #{row.continentRank}
                        </span>
                      ) : (
                        <span className="no-rank">—</span>
                      )}
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
                          <span className="gov-name" title={row.name}>{row.name}</span>
                          <CopyIdButton id={row.governorId} lang={lang} />
                        </div>
                      </div>
                    </td>
                    <td className="td-kd">
                      <span className={`kd-badge ${row.kingdom === 2676 ? 'kd-self' : ''}`}>
                        #{row.kingdom}
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
          <div className="empty-event-icon">🏆</div>
          <h4>{lang === 'vi' ? 'Chưa có dữ liệu bảng xếp hạng' : 'No rankings data recorded'}</h4>
        </div>
      )}
    </section>
  );
};
