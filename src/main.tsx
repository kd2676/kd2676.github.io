import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { translations, type Lang } from './i18n.ts';
import { GuildLogo } from './components/GuildLogo';
import { GovernorAvatar } from './components/GovernorAvatar';
import { KingdomGradeRadar, type RadarMetric } from './components/KingdomGradeRadar';
import { CurrentKvkCard, type CurrentKvkInfo } from './components/CurrentKvkCard';
import { Pagination } from './components/Pagination';
import './styles.css';

type Governor = {
  id: string; name: string; alliance: string; power: number; troopPower: number;
  killPoints: number; t4Kills: number; t5Kills: number; dead: number;
  ch?: number; snapshotTime?: string;
  avatar?: string;
  avatarFrame?: string;
  guildTag?: string;
  guildName?: string;
  guildKingdom?: number;
};
type Dataset = { source: string; exportedAt: string; rows: Governor[] };
type KvK = { code: string; name: string; dates: string; status?: string; kp?: string; deaths?: string };
type KingdomSnapshot = {
  kingdom: string; opened: string; king: string; kingAlliance: string; globalRank: number; capturedAt: string;
  alliances?: [string, string, string][];
  kvks: KvK[];
  radarGrades?: RadarMetric[];
  currentKvk?: CurrentKvkInfo;
};
type KingdomGuild = {
  guildId: number;
  rank: number;
  score: number;
  guildInfo: {
    guildName: string;
    guildAbbr: string;
    guildLogo: string;
    leaderId: number;
    leaderName: string;
    serverId: number;
    territory: number;
  };
  previousRank?: number;
};
type Status = { lastAttempt?: string; lastSuccess?: string; error?: string | null; running?: boolean };
type Tab = 'overview' | 'alliances' | 'governors' | 'data';

const sum = (rows: Governor[], field: keyof Governor) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);

async function loadDataset(lang: Lang): Promise<{ data: Dataset; live: boolean }> {
  try {
    const response = await fetch('/api/governors', { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json() as Dataset;
    if (!Array.isArray(data.rows)) throw new Error('Invalid data');
    return { data, live: true };
  } catch {
    const response = await fetch('/governors.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(lang === 'vi' ? 'Không đọc được dữ liệu thống đốc.' : 'Failed to read governors data.');
    const data = await response.json() as Dataset;
    if (!Array.isArray(data.rows)) throw new Error(lang === 'vi' ? 'Dữ liệu thống đốc không hợp lệ.' : 'Invalid governors dataset.');
    return { data, live: false };
  }
}

function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('kd_lang') as Lang;
      if (saved === 'vi' || saved === 'en') return saved;
    } catch {}
    return 'vi';
  });

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem('kd_lang', newLang); } catch {}
  };

  const i18n = translations[lang];

  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US'), [lang]);
  const decimal = useMemo(() => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 2 }), [lang]);
  const compact = useMemo(() => ({
    format(value: number) {
      if (Math.abs(value) >= 1e9) return `${decimal.format(value / 1e9)}B`;
      if (Math.abs(value) >= 1e6) return `${decimal.format(value / 1e6)}M`;
      if (Math.abs(value) >= 1e3) return `${decimal.format(value / 1e3)}K`;
      return fmt.format(value);
    }
  }), [fmt, decimal]);

  const formatDate = (value?: string) => {
    if (!value) return lang === 'vi' ? 'Chưa có' : 'None';
    const d = new Date(value);
    if (isNaN(d.getTime())) return `${value} UTC`;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} UTC`;
  };

  const [tab, setTab] = useState<Tab>('overview');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [snapshot, setSnapshot] = useState<KingdomSnapshot | null>(null);
  const [kingdomGuilds, setKingdomGuilds] = useState<KingdomGuild[]>([]);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [allianceQuery, setAllianceQuery] = useState('');
  const [sort, setSort] = useState<keyof Governor>('power');
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'info' | 'ok' | 'error'; message: string } | null>(null);

  const PAGE_SIZE = 20;
  const [alliancePage, setAlliancePage] = useState(1);
  const [govPage, setGovPage] = useState(1);

  const refreshData = async () => {
    try {
      const result = await loadDataset(lang);
      setDataset(result.data);
      setLive(result.live);
      setError('');
      if (result.live) {
        const response = await fetch('/api/status', { cache: 'no-store' });
        if (response.ok) setStatus(await response.json() as Status);
      }
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setToast({ type: 'info', message: i18n.toast.syncing });
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json() as { ok?: boolean; error?: string; rows?: number; exportedAt?: string };
      if (!res.ok || json.error) throw new Error(json.error || i18n.toast.syncFail);
      await refreshData();
      setToast({ type: 'ok', message: i18n.toast.syncSuccess(json.rows || 0, formatDate(json.exportedAt)) });
    } catch (err) {
      setToast({ type: 'error', message: (err as Error).message });
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(prev => prev?.type !== 'info' ? prev : null), 8000);
    }
  };

  useEffect(() => {
    let mounted = true;
    void refreshData();
    fetch('/kingdom-snapshot.json')
      .then(response => response.json())
      .then(data => { if (mounted) setSnapshot(data as KingdomSnapshot); })
      .catch(() => {});
    fetch('/kingdom-guilds.json')
      .then(response => response.json())
      .then(data => { if (mounted && Array.isArray(data)) setKingdomGuilds(data as KingdomGuild[]); })
      .catch(() => {});
    const timer = window.setInterval(refreshData, 5 * 60_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [lang]);

  const rows = dataset?.rows ?? [];

  // Filter and display strictly official Kingdom 2676 alliances
  const alliances = useMemo(() => {
    if (kingdomGuilds.length > 0) {
      return kingdomGuilds.map(g => {
        const tag = g.guildInfo.guildAbbr;
        const name = g.guildInfo.guildName;
        let memberCount = 0;
        let totalKp = 0;
        for (const row of rows) {
          const inThisGuild =
            row.guildTag === tag ||
            row.guildName?.toLowerCase() === name.toLowerCase() ||
            row.alliance?.includes(`[${tag}]`) ||
            row.alliance?.toLowerCase() === name.toLowerCase();
          if (inThisGuild) {
            memberCount++;
            totalKp += row.killPoints || 0;
          }
        }
        return {
          rank: g.rank,
          tag,
          name,
          displayName: `[${tag}] ${name}`,
          logo: g.guildInfo.guildLogo,
          leader: g.guildInfo.leaderName || '—',
          territory: g.guildInfo.territory || 0,
          power: g.score,
          count: memberCount,
          kp: totalKp,
        };
      }).sort((a, b) => b.power - a.power);
    }

    if (snapshot?.alliances?.length) {
      return snapshot.alliances.map(([tag, name, powerStr], idx) => {
        let memberCount = 0;
        let totalKp = 0;
        for (const row of rows) {
          const inThisGuild =
            row.guildTag === tag ||
            row.alliance?.includes(`[${tag}]`) ||
            row.alliance?.toLowerCase() === name.toLowerCase();
          if (inThisGuild) {
            memberCount++;
            totalKp += row.killPoints || 0;
          }
        }
        const numPower = parseFloat(powerStr.replace(',', '.')) * (powerStr.endsWith('B') ? 1e9 : powerStr.endsWith('M') ? 1e6 : 1);
        return {
          rank: idx + 1,
          tag,
          name,
          displayName: `[${tag}] ${name}`,
          logo: undefined,
          leader: '—',
          territory: 0,
          power: numPower || 0,
          count: memberCount,
          kp: totalKp,
        };
      });
    }

    return [];
  }, [kingdomGuilds, snapshot, rows]);

  const filteredAlliances = useMemo(() => {
    const needle = allianceQuery.trim().toLowerCase();
    return alliances.filter(a =>
      !needle ||
      a.name.toLowerCase().includes(needle) ||
      a.tag.toLowerCase().includes(needle) ||
      a.leader.toLowerCase().includes(needle)
    );
  }, [alliances, allianceQuery]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return rows.filter(row => !needle || `${row.name} ${row.id} ${row.alliance}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : Number(b[sort] || 0) - Number(a[sort] || 0));
  }, [rows, query, sort]);

  useEffect(() => {
    setAlliancePage(1);
  }, [allianceQuery]);

  useEffect(() => {
    setGovPage(1);
  }, [query, sort]);

  const totalAlliancePages = Math.max(1, Math.ceil(filteredAlliances.length / PAGE_SIZE));
  const pagedAlliances = useMemo(() => {
    const start = (alliancePage - 1) * PAGE_SIZE;
    return filteredAlliances.slice(start, start + PAGE_SIZE);
  }, [filteredAlliances, alliancePage]);

  const totalGovPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedGovernors = useMemo(() => {
    const start = (govPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, govPage]);

  const metrics = [
    [i18n.overview.metrics.governors, fmt.format(rows.length), i18n.overview.metrics.governorsFoot],
    [i18n.overview.metrics.power, compact.format(sum(rows, 'power')), i18n.overview.metrics.powerFoot],
    [i18n.overview.metrics.killPoints, compact.format(sum(rows, 'killPoints')), i18n.overview.metrics.killPointsFoot],
    [i18n.overview.metrics.dead, compact.format(sum(rows, 'dead')), i18n.overview.metrics.deadFoot],
    [i18n.overview.metrics.t4Kills, compact.format(sum(rows, 't4Kills')), i18n.overview.metrics.t4KillsFoot],
    [i18n.overview.metrics.t5Kills, compact.format(sum(rows, 't5Kills')), i18n.overview.metrics.t5KillsFoot],
    [i18n.overview.metrics.troopPower, compact.format(sum(rows, 'troopPower')), i18n.overview.metrics.troopPowerFoot],
    [i18n.overview.metrics.alliances, fmt.format(alliances.length), i18n.overview.metrics.alliancesFoot],
  ];

  const updatedAt = dataset?.exportedAt;

  return (
    <div className="shell">
      {toast && (
        <div className={`floating-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} type="button" aria-label="Close">✕</button>
        </div>
      )}

      <header className="hero">
        <div className="hero-top">
          <div className="brand">
            <span className="brand-icon">✦</span>
            <span>{i18n.brandSubtitle}</span>
          </div>
          <div className="hero-top-actions">
            <div className="lang-switcher" role="group" aria-label="Language selection">
              <button
                type="button"
                className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => changeLang('vi')}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => changeLang('en')}
                title="English"
              >
                EN
              </button>
            </div>
            <button
              className={`header-sync-btn ${syncing ? 'syncing' : ''}`}
              onClick={triggerSync}
              disabled={syncing}
              title={i18n.syncBtn}
              type="button"
            >
              <span className={`sync-icon ${syncing ? 'spinning' : ''}`}>↻</span>
              <span>{syncing ? i18n.syncing : i18n.syncBtn}</span>
            </button>
            <a className="source-link" href="https://app.rokstats.online/kingdom/2676" target="_blank" rel="noreferrer">
              {i18n.sourceLink}
            </a>
          </div>
        </div>

        <div className="hero-content">
          <img src="/logo.png" alt="KD 2676" className="kd-logo" />
          <div>
            <p className="eyebrow">{i18n.reportSubtitle}</p>
            <h1>Kingdom <em>2676</em></h1>
            <p className="hero-sub">{snapshot?.kingdom || 'Zipporania'} · Continent of Egria · Chatsworth</p>
          </div>
        </div>

        <div className="hero-foot">
          <span>
            <i className={`status-dot ${dataset ? 'ready' : ''}`} />
            {i18n.lastUpdate} {formatDate(updatedAt)}
          </span>
        </div>
      </header>

      <nav className="tabs" aria-label="Tabs">
        {([
          ['overview', i18n.tabs.overview],
          ['alliances', i18n.tabs.alliances],
          ['governors', i18n.tabs.governors],
          ['data', i18n.tabs.data]
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      <main>
        {error && (
          <section className="notice notice-error">
            <div>
              <strong>{i18n.errorTitle}</strong>
              <p>{error}</p>
            </div>
          </section>
        )}

        {tab === 'overview' && (
          <section className="view active">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{i18n.overview.kicker}</p>
                <h2>{i18n.overview.title}</h2>
              </div>
              <span className="section-meta">{i18n.overview.snapshotPrefix} {formatDate(updatedAt)}</span>
            </div>

            <CurrentKvkCard kvk={snapshot?.currentKvk} lang={lang} />

            <div className="stats-grid">
              {metrics.map(([label, value, foot]) => (
                <article className="stat" key={label}>
                  <div className="stat-label">{label}</div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-foot">{foot}</div>
                </article>
              ))}
            </div>

            <div className="two-col radar-section-row">
              <KingdomGradeRadar
                grades={snapshot?.radarGrades}
                snapshotDate={snapshot?.capturedAt}
                lang={lang}
              />

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">{i18n.overview.topKicker}</p>
                    <h3>{i18n.overview.topTitle}</h3>
                  </div>
                </div>
                <div className="top-list">
                  {[...rows].sort((a, b) => b.power - a.power).slice(0, 5).map((row, index) => (
                    <div className="top-row" key={row.id}>
                      <span className="rank">#{index + 1}</span>
                      <GovernorAvatar src={row.avatar} frame={row.avatarFrame} name={row.name} size={40} />
                      <div>
                        <b>{row.name}</b>
                        <small>{row.guildTag ? `[${row.guildTag}] ` : ''}{row.alliance || i18n.overview.noAlliance} · ID {row.id}</small>
                      </div>
                      <span className="value">{compact.format(row.power)}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="two-col">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">{i18n.overview.distKicker}</p>
                    <h3>{i18n.overview.distTitle}</h3>
                  </div>
                  <span className="panel-note">{i18n.overview.alliancesCount(alliances.length)}</span>
                </div>
                <div className="category-list">
                  {alliances.slice(0, 8).map(item => (
                    <div className="category-row" key={item.tag || item.name}>
                      <GuildLogo logo={item.logo} size={26} />
                      <div className="category-name" title={item.displayName}>
                        <span>{item.displayName}</span>
                      </div>
                      <div className="bar">
                        <i style={{ width: `${Math.min(100, Math.max(5, (item.power / (alliances[0]?.power || 1)) * 100))}%` }} />
                      </div>
                      <b>{compact.format(item.power)}</b>
                    </div>
                  ))}
                </div>
              </article>

            <article className="panel kvk-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">{i18n.overview.kvkKicker}</p>
                  <h3>{i18n.overview.kvkTitle}</h3>
                </div>
                <span className="panel-note">{i18n.overview.kvkNote(snapshot?.capturedAt || '25/10/2026')}</span>
              </div>
              <div className="kvk-list">
                {snapshot?.kvks.map(item => (
                  <div className="kvk-row" key={item.code}>
                    <div>
                      <b>{item.name}</b>
                      <small>{item.code} · {item.dates}</small>
                    </div>
                    <div className="kvk-stats">
                      {item.status ? (
                        <em>
                          {item.status === 'Đang diễn ra'
                            ? (lang === 'vi' ? 'Đang diễn ra' : 'In Progress')
                            : item.status}
                        </em>
                      ) : (
                        <>
                          <b>{item.kp} KP</b>
                          <small>{item.deaths} Dead</small>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
        )}

        {tab === 'alliances' && (
          <section className="view active">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{i18n.alliances.kicker}</p>
                <h2>{i18n.alliances.title}</h2>
              </div>
              <span className="section-meta">{i18n.alliances.alliancesCount(alliances.length)}</span>
            </div>
            <div className="toolbar">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  value={allianceQuery}
                  onChange={event => setAllianceQuery(event.target.value)}
                  type="search"
                  placeholder={i18n.alliances.filterPlaceholder}
                />
              </label>
            </div>
            <div className="panel table-panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{i18n.alliances.rank}</th>
                      <th>{i18n.alliances.alliance}</th>
                      <th>{i18n.alliances.leader}</th>
                      <th className="num">{i18n.alliances.governors}</th>
                      <th className="num">{i18n.alliances.territory}</th>
                      <th className="num">{i18n.alliances.power}</th>
                      <th className="num">{i18n.alliances.killPoints}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAlliances.map(item => (
                      <tr key={item.tag || item.name}>
                        <td>#{item.rank}</td>
                        <td>
                          <div className="alliance-cell">
                            <GuildLogo logo={item.logo} size={40} />
                            <div className="alliance-cell-text">
                              <span className="alliance-tag-badge">[{item.tag}]</span>
                              <b>{item.name}</b>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="leader-crown">👑 {item.leader}</span>
                        </td>
                        <td className="num">{fmt.format(item.count)}</td>
                        <td className="num">{item.territory ? fmt.format(item.territory) : '—'}</td>
                        <td className="num"><b>{compact.format(item.power)}</b></td>
                        <td className="num">{item.kp ? compact.format(item.kp) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={alliancePage}
                totalPages={totalAlliancePages}
                totalItems={filteredAlliances.length}
                pageSize={PAGE_SIZE}
                onPageChange={setAlliancePage}
                lang={lang}
              />
            </div>
          </section>
        )}

        {tab === 'governors' && (
          <section className="view active">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{i18n.governors.kicker}</p>
                <h2>{i18n.governors.title}</h2>
              </div>
              <span className="section-meta">{i18n.governors.countMeta(filtered.length, rows.length)}</span>
            </div>
            <div className="toolbar">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  type="search"
                  placeholder={i18n.governors.searchPlaceholder}
                />
              </label>
              <select
                value={sort}
                onChange={event => setSort(event.target.value as keyof Governor)}
                aria-label="Sort"
              >
                <option value="power">{i18n.governors.sort.power}</option>
                <option value="killPoints">{i18n.governors.sort.killPoints}</option>
                <option value="dead">{i18n.governors.sort.dead}</option>
                <option value="name">{i18n.governors.sort.name}</option>
              </select>
            </div>
            <div className="panel table-panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{i18n.governors.headers.governor}</th>
                      <th>{i18n.governors.headers.alliance}</th>
                      <th className="num">{i18n.governors.headers.power}</th>
                      <th className="num">{i18n.governors.headers.killPoints}</th>
                      <th className="num">{i18n.governors.headers.t4t5}</th>
                      <th className="num">{i18n.governors.headers.dead}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedGovernors.map(row => (
                      <tr key={row.id}>
                        <td>
                          <div className="gov-cell">
                            <GovernorAvatar src={row.avatar} frame={row.avatarFrame} name={row.name} size={38} />
                            <div className="gov-cell-text">
                              <b>{row.name}</b>
                              <small>ID {row.id} · CH {row.ch ?? '?'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {row.guildTag ? (
                            <span className="alliance-tag-badge">[{row.guildTag}]</span>
                          ) : null}
                          <span>{row.alliance || '—'}</span>
                        </td>
                        <td className="num">{fmt.format(row.power)}</td>
                        <td className="num">{fmt.format(row.killPoints)}</td>
                        <td className="num">{compact.format(row.t4Kills)} / {compact.format(row.t5Kills)}</td>
                        <td className="num">{fmt.format(row.dead)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={govPage}
                totalPages={totalGovPages}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setGovPage}
                lang={lang}
              />
            </div>
          </section>
        )}

        {tab === 'data' && (
          <section className="view active">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{i18n.data.kicker}</p>
                <h2>{i18n.data.title}</h2>
              </div>
            </div>
            <div className="data-layout data-layout-single">
              <article className="panel guide-panel">
                <p className="section-kicker">{i18n.data.statusKicker}</p>
                <h3>{live ? i18n.data.statusLive : i18n.data.statusStatic}</h3>
                <p>{i18n.data.source} <a href="https://app.rokstats.online/governors" target="_blank" rel="noreferrer">ROKStats All Governors ↗</a></p>
                <p>{i18n.data.currentExport} <b>{formatDate(updatedAt)}</b></p>
                <p>
                  {live
                    ? `${i18n.data.lastChecked} ${formatDate(status?.lastAttempt)}.${status?.running ? ` ${i18n.data.syncingStatus}` : ''}`
                    : i18n.data.staticNote}
                </p>
                {status?.error && <p className="upload-result error">{status.error}</p>}
                <div className="sync-wrap">
                  <button
                    className={`sync-btn ${syncing ? 'loading' : ''}`}
                    onClick={triggerSync}
                    type="button"
                    disabled={syncing}
                  >
                    <span className={`sync-icon ${syncing ? 'spinning' : ''}`}>↻</span>
                    {syncing ? i18n.syncingRok : i18n.syncNow}
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>{i18n.footer.brand}</span>
        <span>{i18n.footer.note}</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
