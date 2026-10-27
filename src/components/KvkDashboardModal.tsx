import { useState, useMemo } from 'react';
import type { KvKItem } from './KvkPerformanceGrid';

interface KvkDashboardModalProps {
  kvks: KvKItem[];
  selectedCode: number;
  lang?: 'vi' | 'en';
  onClose: () => void;
  onSelectKvk: (code: number) => void;
}

export function KvkDashboardModal({
  kvks,
  selectedCode,
  lang = 'vi',
  onClose,
  onSelectKvk,
}: KvkDashboardModalProps) {
  const currentKvk = kvks.find(k => k.code === selectedCode) || kvks[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'kp' | 'dead' | 'heal'>('kp');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filter and sort players for KD 2676
  const filteredPlayers = useMemo(() => {
    if (!currentKvk || !currentKvk.players) return [];
    let list = [...currentKvk.players];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.allianceTag.toLowerCase().includes(q) ||
          p.allianceName.toLowerCase().includes(q) ||
          String(p.playerId).includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'kp') return b.killPoints - a.killPoints;
      if (sortBy === 'dead') return b.deathPoints - a.deathPoints;
      if (sortBy === 'heal') return b.healPoints - a.healPoints;
      return 0;
    });

    return list;
  }, [currentKvk, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
  const pagedPlayers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPlayers.slice(start, start + pageSize);
  }, [filteredPlayers, page, pageSize]);

  if (!currentKvk) return null;

  return (
    <div className="kvk-dash-overlay" role="dialog" aria-modal="true">
      <div className="kvk-dash-container">
        {/* Top Navbar */}
        <div className="kvk-dash-topbar">
          <button type="button" className="kvk-dash-back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{lang === 'vi' ? 'Quay lại danh sách KvK' : 'Back to KvK Performance'}</span>
          </button>

          {/* KvK Season Switcher */}
          <div className="kvk-dash-switcher">
            <span className="kvk-switcher-label">{lang === 'vi' ? 'Mùa KvK:' : 'KvK Season:'}</span>
            <div className="kvk-switcher-buttons">
              {kvks.map(k => (
                <button
                  key={k.code}
                  type="button"
                  className={`kvk-switcher-pill ${k.code === currentKvk.code ? 'active' : ''}`}
                  onClick={() => {
                    onSelectKvk(k.code);
                    setPage(1);
                  }}
                >
                  {k.formattedCode}
                  {k.isActive && <span className="kvk-pill-dot" />}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="kvk-dash-close-icon" onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero Banner */}
        <div
          className="kvk-dash-hero"
          style={{
            backgroundImage: currentKvk.coverUrl
              ? `linear-gradient(90deg, rgba(13, 17, 25, 0.96) 0%, rgba(13, 17, 25, 0.82) 50%, rgba(13, 17, 25, 0.35) 100%), url(${currentKvk.coverUrl})`
              : undefined
          }}
        >
          <div className="kvk-dash-hero-content">
            <div className="kvk-hero-badge-row">
              {currentKvk.tierBadge && (
                <span className={`kvk-grade-badge ${currentKvk.tierBadge === 'S+' ? 'grade-s-plus' : 'grade-s'}`}>
                  {currentKvk.tierBadge}
                </span>
              )}
              <span className="kvk-hero-code">{currentKvk.formattedCode}</span>
              {currentKvk.season && <span className="kvk-season-pill">S{currentKvk.season}</span>}
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
              <span className="kvk-scope-badge">
                {lang === 'vi' ? '🛡️ Dữ liệu Kingdom 2676' : '🛡️ Kingdom 2676 Only'}
              </span>
            </div>

            <h1 className="kvk-hero-title">{currentKvk.storyName}</h1>
            <p className="kvk-hero-dates">
              📅 {lang === 'vi' ? currentKvk.datesVi : currentKvk.datesEn}
            </p>
          </div>
        </div>

        {/* KPI Stats Cards */}
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
              {currentKvk.perf?.kpFormatted || (currentKvk.isActive ? `${currentKvk.players.reduce((sum, p) => sum + p.killPoints, 0).toLocaleString()} (live)` : '—')}
            </div>
            {currentKvk.perf?.t4t5kpFormatted && (
              <div className="kvk-kpi-sub">
                T4+T5 KP: <b>{currentKvk.perf.t4t5kpFormatted}</b>
              </div>
            )}
          </div>

          <div className="kvk-kpi-card dead-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'QUÂN TỬ TRẬN (DEATHS)' : 'DEATHS'}</span>
              <svg className="kvk-kpi-icon icon-skull" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <path d="M8 20v2h8v-2" />
                <path d="M12.5 17l-.5-1-.5 1h1z" />
                <path d="M16 20a3 3 0 0 0 3-3V9a7 7 0 0 0-14 0v8a3 3 0 0 0 3 3" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.deadFormatted || (currentKvk.isActive ? currentKvk.players.reduce((sum, p) => sum + p.deathPoints, 0).toLocaleString() : '—')}
            </div>
            <div className="kvk-kpi-sub">{lang === 'vi' ? 'Quân hy sinh trên chiến trường' : 'Troops lost in battle'}</div>
          </div>

          <div className="kvk-kpi-card heal-card">
            <div className="kvk-kpi-header">
              <span className="kvk-kpi-title">{lang === 'vi' ? 'HỒI PHỤC (HEALED)' : 'HEALED'}</span>
              <svg className="kvk-kpi-icon icon-heal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div className="kvk-kpi-number">
              {currentKvk.perf?.healedFormatted || (currentKvk.isActive ? currentKvk.players.reduce((sum, p) => sum + p.healPoints, 0).toLocaleString() : '—')}
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
              {lang === 'vi' ? `Thống đốc KD 2676 tham gia` : `KD 2676 governors recorded`}
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
              {currentKvk.perf?.participants ? `${currentKvk.perf.participants} KDs` : 'Toàn KvK'}
            </div>
            <div className="kvk-kpi-sub">
              {currentKvk.perf?.trackedPlayers
                ? `${currentKvk.perf.trackedPlayers.toLocaleString()} ${lang === 'vi' ? 'người chơi được theo dõi' : 'tracked players'}`
                : lang === 'vi' ? 'Tất cả vương quốc' : 'All participating kingdoms'}
            </div>
          </div>
        </div>

        {/* Section: Governor Leaderboard for Kingdom 2676 */}
        <div className="kvk-dash-leaderboard-section">
          <div className="kvk-leaderboard-header">
            <div>
              <h2 className="kvk-leaderboard-title">
                {lang === 'vi'
                  ? `Bảng xếp hạng Chiến Binh Kingdom 2676 (${filteredPlayers.length})`
                  : `Kingdom 2676 Governor Leaderboard (${filteredPlayers.length})`}
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
                  placeholder={lang === 'vi' ? 'Tìm thống đốc hoặc liên minh [FK76]...' : 'Search governor or alliance [ROFF]...'}
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
                  onClick={() => setSortBy('kp')}
                >
                  ⚔️ {lang === 'vi' ? 'Kill Points' : 'Kill Points'}
                </button>
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'dead' ? 'active' : ''}`}
                  onClick={() => setSortBy('dead')}
                >
                  💀 {lang === 'vi' ? 'Tử trận' : 'Deaths'}
                </button>
                <button
                  type="button"
                  className={`kvk-sort-btn ${sortBy === 'heal' ? 'active' : ''}`}
                  onClick={() => setSortBy('heal')}
                >
                  💚 {lang === 'vi' ? 'Hồi phục' : 'Heals'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
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
              <table className="kvk-leaderboard-table">
                <thead>
                  <tr>
                    <th className="th-rank">#</th>
                    <th className="th-gov">{lang === 'vi' ? 'Thống đốc' : 'Governor'}</th>
                    <th className="th-alliance">{lang === 'vi' ? 'Liên minh' : 'Alliance'}</th>
                    <th className="th-num th-kp">{lang === 'vi' ? 'Kill Points' : 'Kill Points'}</th>
                    <th className="th-num th-dead">{lang === 'vi' ? 'Tử trận' : 'Deaths'}</th>
                    <th className="th-num th-heal">{lang === 'vi' ? 'Hồi phục' : 'Heals'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPlayers.map((player, idx) => {
                    const localRank = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr key={player.playerId} className={`kvk-row-rank-${localRank}`}>
                        <td className="td-rank">
                          <span className={`kvk-rank-badge ${localRank <= 3 ? `top-${localRank}` : ''}`}>
                            {localRank}
                          </span>
                          {player.killPointsRank && player.killPointsRank > 0 && (
                            <span className="kvk-global-rank" title={`Overall KvK rank: #${player.killPointsRank}`}>
                              #{player.killPointsRank} KvK
                            </span>
                          )}
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
                              <span className="kvk-gov-name">{player.name}</span>
                              <span className="kvk-gov-id">ID: {player.playerId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="td-alliance">
                          {player.allianceTag ? (
                            <span className="kvk-alliance-tag">[{player.allianceTag}]</span>
                          ) : (
                            <span className="kvk-text-muted">—</span>
                          )}
                        </td>

                        <td className="td-num td-kp">
                          <b>{player.killPoints.toLocaleString()}</b>
                        </td>

                        <td className="td-num td-dead">
                          <span>{player.deathPoints.toLocaleString()}</span>
                        </td>

                        <td className="td-num td-heal">
                          <span>{player.healPoints.toLocaleString()}</span>
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
                      ? `Hiển thị ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filteredPlayers.length)} trên ${filteredPlayers.length} chiến binh`
                      : `Showing ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filteredPlayers.length)} of ${filteredPlayers.length} fighters`}
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
    </div>
  );
}
