import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { KvKItem } from './KvkPerformanceGrid';
import { CopyIdButton } from './CopyIdButton';

interface KvkDashboardModalProps {
  kvks: KvKItem[];
  selectedCode: number;
  lang?: 'vi' | 'en';
  onClose: () => void;
  onSelectKvk?: (code: number) => void;
}

type SortField = 'kp' | 'dead' | 'heal' | 'power' | 'dkp' | 'trades' | 't4' | 't5';

function formatCompactNum(num?: number): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e9) {
    const v = (num / 1e9).toFixed(2);
    return v.endsWith('.00') ? `${(num / 1e9).toFixed(0)}B` : v.replace(/\.?0+$/, '') + 'B';
  }
  if (abs >= 1e6) {
    const v = (num / 1e6).toFixed(2);
    return v.endsWith('.00') ? `${(num / 1e6).toFixed(0)}M` : v.replace(/\.?0+$/, '') + 'M';
  }
  if (abs >= 1e3) {
    const v = (num / 1e3).toFixed(1);
    return v.endsWith('.0') ? `${(num / 1e3).toFixed(0)}K` : v + 'K';
  }
  return num.toLocaleString();
}

function DiffCell({
  diff,
  total,
  formatCompact = false,
  inverse = false,
}: {
  diff?: number;
  total?: number;
  formatCompact?: boolean;
  inverse?: boolean;
}) {
  const hasDiff = diff !== undefined && diff !== null && diff !== 0;
  const isPos = (diff || 0) > 0;
  const isNeg = (diff || 0) < 0;

  const diffColorClass = isPos ? (inverse ? 'text-red' : 'text-green') : isNeg ? (inverse ? 'text-green' : 'text-red') : 'text-muted';

  const diffStr = isPos
    ? `+ ${formatCompact ? formatCompactNum(diff) : (diff || 0).toLocaleString()}`
    : isNeg
    ? `- ${formatCompact ? formatCompactNum(Math.abs(diff || 0)) : Math.abs(diff || 0).toLocaleString()}`
    : '0';

  const totalStr = total !== undefined && total !== null ? (formatCompact ? formatCompactNum(total) : total.toLocaleString()) : null;

  return (
    <div className="kvk-dual-cell">
      {hasDiff && <span className={`kvk-cell-diff ${diffColorClass}`}>{diffStr}</span>}
      {totalStr && <span className="kvk-cell-total">{totalStr}</span>}
      {!hasDiff && !totalStr && <span className="kvk-muted">—</span>}
    </div>
  );
}

function TradesBadge({ value }: { value?: number }) {
  if (value === undefined || value === null || value === 0) {
    return <span className="kvk-trades-na">—</span>;
  }
  const color = value >= 100 ? '#10b981' : value >= 70 ? '#38bdf8' : '#f59e0b';
  return (
    <span className="kvk-trades-badge" style={{ borderColor: color, color }}>
      {value}%
    </span>
  );
}

export function KvkDashboardModal({
  kvks,
  selectedCode,
  lang = 'vi',
  onClose,
}: KvkDashboardModalProps) {
  const currentKvk = kvks.find(k => k.code === selectedCode) || kvks[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('kp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Lock body and html scroll while modal is active
  useEffect(() => {
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Filter and sort players for KD 2676
  const filteredPlayers = useMemo(() => {
    if (!currentKvk || !currentKvk.players) return [];
    let list = [...currentKvk.players];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.allianceTag?.toLowerCase().includes(q) ||
          p.allianceName?.toLowerCase().includes(q) ||
          String(p.playerId).includes(q)
      );
    }

    const orderMult = sortOrder === 'desc' ? 1 : -1;

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'kp') {
        valA = a.killPointsDiff !== undefined ? a.killPointsDiff : a.killPoints;
        valB = b.killPointsDiff !== undefined ? b.killPointsDiff : b.killPoints;
      } else if (sortBy === 'dead') {
        valA = a.deadDiff !== undefined ? a.deadDiff : (a.dead || a.deathPoints || 0);
        valB = b.deadDiff !== undefined ? b.deadDiff : (b.dead || b.deathPoints || 0);
      } else if (sortBy === 'heal') {
        valA = a.troopsHealedDiff !== undefined ? a.troopsHealedDiff : (a.troopsHealed || a.healPoints || 0);
        valB = b.troopsHealedDiff !== undefined ? b.troopsHealedDiff : (b.troopsHealed || b.healPoints || 0);
      } else if (sortBy === 'power') {
        valA = a.power || 0;
        valB = b.power || 0;
      } else if (sortBy === 'dkp') {
        valA = a.totalPoints || 0;
        valB = b.totalPoints || 0;
      } else if (sortBy === 'trades') {
        valA = a.trades || 0;
        valB = b.trades || 0;
      } else if (sortBy === 't4') {
        valA = a.t4Diff !== undefined ? a.t4Diff : (a.t4 || 0);
        valB = b.t4Diff !== undefined ? b.t4Diff : (b.t4 || 0);
      } else if (sortBy === 't5') {
        valA = a.t5Diff !== undefined ? a.t5Diff : (a.t5 || 0);
        valB = b.t5Diff !== undefined ? b.t5Diff : (b.t5 || 0);
      }

      if (valB !== valA) return (valB - valA) * orderMult;
      return ((b.totalPoints || 0) - (a.totalPoints || 0)) * orderMult;
    });

    return list;
  }, [currentKvk, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
  const pagedPlayers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPlayers.slice(start, start + pageSize);
  }, [filteredPlayers, page, pageSize]);

  if (!currentKvk) return null;

  const isTier2 = currentKvk.tier === 2 || currentKvk.tierBadge === 'S+';
  const tierBadge = currentKvk.tierBadge || (isTier2 ? 'S+' : 'S');

  return createPortal(
    <div className="kvk-dash-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kvk-dash-container" onClick={e => e.stopPropagation()}>
        {/* Top Navbar */}
        <div className="kvk-dash-topbar">
          <button type="button" className="kvk-dash-back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{lang === 'vi' ? 'Quay lại danh sách KvK' : 'Back to KvK Performance'}</span>
          </button>

          <button type="button" className="kvk-dash-close-icon" onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero Banner with vivid KvK cover artwork and smooth bottom fade */}
        <div
          className="kvk-dash-hero"
          style={{
            backgroundImage: currentKvk.coverUrl
              ? `linear-gradient(180deg, rgba(11, 15, 25, 0) 30%, rgba(11, 15, 25, 0.72) 75%, rgba(11, 15, 25, 0.98) 98%, #0b0f19 100%), linear-gradient(90deg, rgba(11, 15, 25, 0.96) 0%, rgba(11, 15, 25, 0.72) 48%, rgba(11, 15, 25, 0.20) 100%), url(${currentKvk.coverUrl})`
              : undefined
          }}
        >
          <div className="kvk-dash-hero-content">
            <div className="kvk-hero-badge-row">
              <span className={`kvk-grade-badge ${tierBadge === 'S+' ? 'grade-s-plus' : 'grade-s'}`} title={`Tier ${tierBadge}`}>
                {tierBadge}
              </span>
              <span className="kvk-hero-code">{currentKvk.formattedCode}</span>
              {currentKvk.season ? <span className="kvk-season-pill">S{currentKvk.season}</span> : null}
              {currentKvk.perf?.campNum && (
                <span className="kvk-camp-pill">
                  {lang === 'vi' ? `Trại ${currentKvk.perf.campNum}` : `Camp ${currentKvk.perf.campNum}`}
                </span>
              )}
              {currentKvk.isActive && (
                <span className="kvk-live-badge">
                  <span className="kvk-live-dot" />
                  {lang === 'vi' ? 'Đang diễn ra' : 'Active In Progress'}
                </span>
              )}
            </div>

            <h1 className="kvk-hero-title">{currentKvk.storyName}</h1>
            <p className="kvk-hero-dates">
              📅 {lang === 'vi' ? currentKvk.datesVi : currentKvk.datesEn}
            </p>
          </div>
        </div>

        {/* 6 KPI Stats Cards */}
        <div className="kvk-dash-kpis">
          <div className="kvk-kpi-card kp-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'ĐIỂM HẠ GỤC (KILL POINTS)' : 'KILL POINTS'}</span>
              <svg className="kvk-kpi-icon icon-swords" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="kvk-kpi-number">
              {currentKvk.perf?.kpFormatted || '—'}
            </div>
            <div className="kvk-kpi-sub">
              {lang === 'vi' ? 'Tổng KP tích lũy trong KvK' : 'Total KP gained in KvK'}
            </div>
          </div>

          <div className="kvk-kpi-card dead-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'TỬ TRẬN (DEATHS)' : 'DEATHS'}</span>
              <svg className="kvk-kpi-icon icon-skull" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <path d="M8 20v2h8v-2" />
                <path d="M12.5 17l-.5-1-.5 1" />
                <path d="M16 20a6 6 0 0 0 1-4c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 1.48.4 2.86 1.08 4" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.deadFormatted || '—'}
            </div>
            <div className="kvk-kpi-sub">{lang === 'vi' ? 'Lính hy sinh trên chiến trường' : 'Troops lost in battle'}</div>
          </div>

          <div className="kvk-kpi-card heal-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'HỒI PHỤC (HEALED)' : 'HEALED'}</span>
              <svg className="kvk-kpi-icon icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.healedFormatted || '—'}
            </div>
            <div className="kvk-kpi-sub">{lang === 'vi' ? 'Lượng quân được cứu chữa' : 'Troops healed in hospital'}</div>
          </div>

          <div className="kvk-kpi-card acclaim-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'DANH VỌNG (ACCLAIM)' : 'ACCLAIM'}</span>
              <svg className="kvk-kpi-icon icon-acclaim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.acclaimFormatted || '0'}
            </div>
            <div className="kvk-kpi-sub">{lang === 'vi' ? 'Điểm danh vọng mùa giải' : 'Acclaim points accumulated'}</div>
          </div>

          <div className="kvk-kpi-card warriors-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'CHIẾN BINH KD 2676' : 'KD 2676 FIGHTERS'}</span>
              <svg className="kvk-kpi-icon icon-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.players.length}
            </div>
            <div className="kvk-kpi-sub">
              {lang === 'vi' ? `Thống đốc KD 2676 được ghi nhận` : `KD 2676 governors recorded`}
            </div>
          </div>

          <div className="kvk-kpi-card map-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'QUY MÔ KVK' : 'KVK PARTICIPANTS'}</span>
              <svg className="kvk-kpi-icon icon-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.participants
                ? (lang === 'vi' ? `${currentKvk.perf.participants} Vương quốc` : `${currentKvk.perf.participants} KDs`)
                : (lang === 'vi' ? 'Toàn KvK' : 'All Lost Kingdom')}
            </div>
            <div className="kvk-kpi-sub">
              {currentKvk.perf?.trackedPlayers
                ? (lang === 'vi'
                    ? `${currentKvk.perf.trackedPlayers.toLocaleString('vi-VN')} chiến binh được theo dõi`
                    : `${currentKvk.perf.trackedPlayers.toLocaleString('en-US')} tracked players`)
                : (lang === 'vi' ? 'Các vương quốc tham gia' : 'Participating kingdoms')}
            </div>
          </div>
        </div>

        {/* Section: Governor Leaderboard for Kingdom 2676 */}
        <div className="kvk-dash-leaderboard-section">
          <div className="kvk-leaderboard-header">
            <div>
              <h2 className="kvk-leaderboard-title">
                KvK Dashboard ({filteredPlayers.length})
              </h2>
              <p className="kvk-leaderboard-subtitle">
                {lang === 'vi'
                  ? `Dữ liệu đóng góp chiến đấu của các thống đốc Vương quốc 2676 trong mùa KvK ${currentKvk.formattedCode}`
                  : `Combat performance of Kingdom 2676 governors during KvK season ${currentKvk.formattedCode}`}
              </p>
            </div>

            {/* Filter & Sort Controls */}
            <div className="kvk-leaderboard-controls">
              <div className="kvk-search-box">
                <svg className="kvk-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Tìm thống đốc, ID hoặc liên minh [IF28]...' : 'Search governor, ID or alliance [ROFF]...'}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
                {searchQuery && (
                  <button type="button" className="kvk-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              <div className="kvk-sort-group">
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'kp' ? 'active' : ''}`}
                  onClick={() => handleSort('kp')}
                >
                  ⚔️ {lang === 'vi' ? 'Kill Points' : 'Kill Points'} {sortBy === 'kp' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'dead' ? 'active' : ''}`}
                  onClick={() => handleSort('dead')}
                >
                  💀 {lang === 'vi' ? 'Tử trận' : 'Deaths'} {sortBy === 'dead' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'heal' ? 'active' : ''}`}
                  onClick={() => handleSort('heal')}
                >
                  💚 {lang === 'vi' ? 'Hồi phục' : 'Heals'} {sortBy === 'heal' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'dkp' ? 'active' : ''}`}
                  onClick={() => handleSort('dkp')}
                >
                  🏆 DKP {sortBy === 'dkp' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              </div>
            </div>
          </div>

          {/* Table (matching ROKStats Image 3) */}
          {filteredPlayers.length === 0 ? (
            <div className="kvk-empty-leaderboard">
              <div className="kvk-empty-icon">🛡️</div>
              <h3>
                {currentKvk.players.length === 0
                  ? lang === 'vi'
                    ? 'Không có dữ liệu chi tiết thống đốc'
                    : 'No detailed governor records'
                  : lang === 'vi'
                  ? 'Không tìm thấy thống đốc phù hợp'
                  : 'No matching governors found'}
              </h3>
              <p>
                {currentKvk.players.length === 0
                  ? lang === 'vi'
                    ? `Mùa giải này chỉ lưu trữ số liệu tổng kết toàn vương quốc (${currentKvk.perf?.kpFormatted || '17B'} KP, ${currentKvk.perf?.deadFormatted || '160M'} Tử trận), chưa có bản scan chi tiết từng thống đốc trên ROKStats.`
                    : `This historical season contains kingdom-level summary totals, but no individual governor breakdown is recorded on ROKStats.`
                  : lang === 'vi'
                  ? 'Vui lòng thử từ khóa tìm kiếm khác.'
                  : 'Please try a different search keyword.'}
              </p>
            </div>
          ) : (
            <div className="kvk-table-wrapper">
              <table className="kvk-leaderboard-table kvk-detailed-table">
                <thead>
                  <tr>
                    <th className="th-rank">#</th>
                    <th className="th-gov">{lang === 'vi' ? 'THỐNG ĐỐC' : 'GOVERNOR'}</th>
                    <th className="th-kd">{lang === 'vi' ? 'VƯƠNG QUỐC' : 'KD'}</th>
                    <th className="th-num pointer" onClick={() => handleSort('power')}>
                      POWER {sortBy === 'power' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num th-kp pointer" onClick={() => handleSort('kp')}>
                      KP {sortBy === 'kp' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num pointer" onClick={() => handleSort('t4')}>
                      T4 {sortBy === 't4' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num pointer" onClick={() => handleSort('t5')}>
                      T5 {sortBy === 't5' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num th-dead pointer" onClick={() => handleSort('dead')}>
                      {lang === 'vi' ? 'TỬ TRẬN' : 'DEAD'} {sortBy === 'dead' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num">{lang === 'vi' ? 'DANH VỌNG' : 'ACCLAIM'}</th>
                    <th className="th-num th-heal pointer" onClick={() => handleSort('heal')}>
                      {lang === 'vi' ? 'HỒI PHỤC' : 'HEALED'} {sortBy === 'heal' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num pointer" onClick={() => handleSort('dkp')}>
                      DKP {sortBy === 'dkp' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="th-num pointer text-center" onClick={() => handleSort('trades')}>
                      TRADES {sortBy === 'trades' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPlayers.map((player, idx) => {
                    const localRank = (page - 1) * pageSize + idx + 1;
                    const overallRank = player.overallRank || player.killPointsRank || localRank;

                    return (
                      <tr key={player.playerId} className={`kvk-row-rank-${localRank}`}>
                        <td className="td-rank">
                          <div className="kvk-rank-col">
                            <span className={`kvk-rank-badge ${localRank <= 3 ? `top-${localRank}` : ''}`}>
                              {localRank}
                            </span>
                            {overallRank > 0 && (
                              <span className="kvk-global-rank" title={`Overall Lost Kingdom rank: #${overallRank}`}>
                                #{overallRank} KvK
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="td-gov">
                          <div className="kvk-gov-cell">
                            <div className="kvk-avatar-wrap">
                              {player.avatar ? (
                                <img src={player.avatar} alt={player.name} className="kvk-avatar-img" />
                              ) : (
                                <div className="kvk-avatar-fallback">{player.name.slice(0, 2).toUpperCase()}</div>
                              )}
                              {player.avatarFrame && (
                                <img src={player.avatarFrame} alt="" className="kvk-avatar-frame" />
                              )}
                            </div>
                            <div className="kvk-gov-info">
                              <span className="kvk-gov-name" title={player.name}>{player.name}</span>
                              <CopyIdButton id={player.playerId} lang={lang} />
                            </div>
                          </div>
                        </td>

                        <td className="td-kd">
                          <div className="kvk-kd-cell">
                            <span className="kvk-kd-badge">2676</span>
                            <span className="kvk-camp-name">
                              {player.campNum ? (lang === 'vi' ? `Trại ${player.campNum}` : `Camp ${player.campNum}`) : 'Wind'}
                            </span>
                          </div>
                        </td>

                        <td className="td-num">
                          <DiffCell
                            diff={player.powerDiff}
                            total={player.power}
                            formatCompact
                          />
                        </td>

                        <td className="td-num td-kp">
                          <DiffCell
                            diff={player.killPointsDiff}
                            total={player.killPoints}
                          />
                        </td>

                        <td className="td-num">
                          <DiffCell
                            diff={player.t4Diff}
                            total={player.t4}
                            formatCompact
                          />
                        </td>

                        <td className="td-num">
                          <DiffCell
                            diff={player.t5Diff}
                            total={player.t5}
                            formatCompact
                          />
                        </td>

                        <td className="td-num td-dead">
                          <DiffCell
                            diff={player.deadDiff}
                            total={player.dead || player.deathPoints}
                            inverse
                          />
                        </td>

                        <td className="td-num td-acclaim">
                          <span className="kvk-acclaim-val">
                            {player.acclaim ? formatCompactNum(player.acclaim) : '—'}
                          </span>
                        </td>

                        <td className="td-num td-heal">
                          <DiffCell
                            diff={player.troopsHealedDiff}
                            total={player.troopsHealed || player.healPoints}
                          />
                        </td>

                        <td className="td-num td-dkp">
                          <span className="kvk-dkp-val">
                            {player.totalPoints ? formatCompactNum(player.totalPoints) : '—'}
                          </span>
                        </td>

                        <td className="td-num text-center">
                          <TradesBadge value={player.trades} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="kvk-pagination">
                  <span className="kvk-page-info">
                    {lang === 'vi'
                      ? `Hiển thị ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filteredPlayers.length)} trên ${filteredPlayers.length} chiến binh KD 2676`
                      : `Showing ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filteredPlayers.length)} of ${filteredPlayers.length} KD 2676 fighters`}
                  </span>

                  <div className="kvk-page-btns">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ‹ {lang === 'vi' ? 'Trước' : 'Prev'}
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        type="button"
                        className={page === i + 1 ? 'active' : ''}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      {lang === 'vi' ? 'Tiếp' : 'Next'} ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
