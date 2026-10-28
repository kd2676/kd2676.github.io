import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { translations, type Lang } from './i18n.ts';
import { GuildLogo } from './components/GuildLogo';
import { GovernorAvatar } from './components/GovernorAvatar';
import { KingdomGradeRadar, type RadarMetric } from './components/KingdomGradeRadar';
import { CurrentKvkCard, type CurrentKvkInfo } from './components/CurrentKvkCard';
import { KvkPerformanceGrid, type KvKItem } from './components/KvkPerformanceGrid';
import { KvkDashboardModal } from './components/KvkDashboardModal';
import { Pagination } from './components/Pagination';
import { FlagVN, FlagGB } from './components/FlagIcons';
import { CopyIdButton } from './components/CopyIdButton';
import { MgeView, type MgeEvent } from './components/MgeView';
import { ZenithView, type ZenithEvent } from './components/ZenithView';
import { RecruitmentView } from './components/RecruitmentView';
import { AdminView } from './components/AdminView';
import { type KingdomConfig, type RecruitmentData, getKingdomConfig, getRecruitment } from './lib/kingdomApi';
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
  acclaim?: number;
  maxAcclaim?: number;
};
type Dataset = { source: string; exportedAt: string; rows: Governor[] };
type KvK = { code: string; name: string; dates: string; status?: string; kp?: string; deaths?: string };
type CurrentKingInfo = {
  name: string;
  alliance: string;
  allianceTag?: string;
  avatar: string;
  avatarFrame: string;
  sinceDate?: string;
  since: string;
  sinceVi: string;
};
type RecentKing = {
  name: string;
  alliance: string;
  allianceTag?: string;
  dates: string;
  datesVi?: string;
  avatar: string;
  avatarFrame: string;
};
type KingdomSnapshot = {
  kingdom: string; opened: string; king: string; kingAlliance: string; globalRank: number; capturedAt: string;
  alliances?: [string, string, string][];
  kvks: KvK[];
  radarGrades?: RadarMetric[];
  currentKvk?: CurrentKvkInfo;
  currentKing?: CurrentKingInfo;
  recentKings?: RecentKing[];
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
type Tab = 'overview' | 'kvk' | 'alliances' | 'governors' | 'mge' | 'zenith' | 'recruitment' | 'admin';

const TAB_PATHS: Record<Tab, string> = {
  overview: '/overview',
  kvk: '/KvK Performance',
  alliances: '/alliances',
  governors: '/Governors',
  mge: '/mge',
  zenith: '/zenith',
  recruitment: '/recruitment',
  admin: '/admin',
};

function getTabFromPath(pathname: string): Tab {
  try {
    const raw = decodeURIComponent(pathname).trim().replace(/^\/+|\/+$/g, '').toLowerCase();
    if (
      raw === 'kvk performance' ||
      raw === 'kvk%20performance' ||
      raw === 'kvk-performance' ||
      raw === 'kvk' ||
      raw.startsWith('kvk')
    ) {
      return 'kvk';
    }
    if (raw === 'alliances' || raw === 'alliance') return 'alliances';
    if (raw === 'governors' || raw === 'governor') return 'governors';
    if (raw === 'mge') return 'mge';
    if (raw === 'zenith' || raw === 'zenith of power' || raw === 'zenith-of-power') return 'zenith';
        if (raw === 'admin') return 'admin';
    if (raw === 'recruitment' || raw === 'tuyendung' || raw === 'tuyen-dung' || raw === 'tuyển dụng') return 'recruitment';
    if (raw === 'overview') return 'overview';
  } catch {
    // fallback
  }
  return 'overview';
}

function getKvkCodeFromPath(pathname: string): number | null {
  try {
    const raw = decodeURIComponent(pathname).trim();
    const match = raw.match(/kvk\/dashboard\/[a-zA-Z]*(\d+)/i);
    if (match) return parseInt(match[1], 10);
  } catch {}
  return null;
}

const sum = (rows: Governor[], field: keyof Governor) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);

async function loadDataset(lang: Lang): Promise<{ data: Dataset; live: boolean }> {
  const ts = Date.now();
  const headers = { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' };
  try {
    const response = await fetch(`/governors.json?t=${ts}`, { cache: 'no-store', headers });
    if (!response.ok) throw new Error('Static file not ready');
    const data = await response.json() as Dataset;
    if (!Array.isArray(data.rows)) throw new Error('Invalid governors dataset');
    return { data, live: false };
  } catch {
    try {
      const response = await fetch(`/api/governors?t=${ts}`, { cache: 'no-store', headers });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json() as Dataset;
        if (Array.isArray(data.rows)) return { data, live: true };
      }
    } catch {}
    throw new Error(lang === 'vi' ? 'Không đọc được dữ liệu thống đốc.' : 'Failed to read governors data.');
  }
}

function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('kd_lang') as Lang;
      if (saved === 'vi' || saved === 'en') return saved;
    } catch {}
    return 'en';
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

  const formatKingSince = (sinceDate?: string, fallbackSince?: string, fallbackSinceVi?: string) => {
    if (sinceDate) {
      const diffMs = Date.now() - new Date(sinceDate).getTime();
      if (!isNaN(diffMs) && diffMs >= 0) {
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffMinutes < 45) {
          if (diffMinutes <= 1) return lang === 'vi' ? 'Vừa xong' : 'Just now';
          return lang === 'vi' ? `Từ ${diffMinutes} phút trước` : `Since ${diffMinutes} minutes ago`;
        }
        if (diffHours <= 1) return lang === 'vi' ? 'Từ 1 giờ trước' : 'Since an hour ago';
        if (diffHours < 24) return lang === 'vi' ? `Từ ${diffHours} giờ trước` : `Since ${diffHours} hours ago`;
        if (diffDays <= 1) return lang === 'vi' ? 'Từ 1 ngày trước' : 'Since 1 day ago';
        return lang === 'vi' ? `Từ ${diffDays} ngày trước` : `Since ${diffDays} days ago`;
      }
    }
    return lang === 'vi' ? (fallbackSinceVi || 'Từ 1 giờ trước') : (fallbackSince || 'Since an hour ago');
  };

  const [tab, setTabState] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'overview';
  });

  const setTab = (newTab: Tab, replace = false) => {
    setTabState(newTab);
    if (typeof window !== 'undefined') {
      const targetPath = TAB_PATHS[newTab];
      const currentPath = decodeURIComponent(window.location.pathname);
      if (currentPath !== targetPath) {
        if (replace) {
          window.history.replaceState({ tab: newTab }, '', targetPath);
        } else {
          window.history.pushState({ tab: newTab }, '', targetPath);
        }
      }
    }
  };

  useEffect(() => {
    const onPopState = () => {
      const matched = getTabFromPath(window.location.pathname);
      setTabState(matched);
      const codeFromPath = getKvkCodeFromPath(window.location.pathname);
      const params = new URLSearchParams(window.location.search);
      const kvkP = codeFromPath || (params.get('kvk') ? parseInt(params.get('kvk')!, 10) : null);
      setSelectedKvkCode(kvkP || null);
    };
    window.addEventListener('popstate', onPopState);

    const current = window.location.pathname;
    if (current === '' || current === '/') {
      window.history.replaceState({ tab: 'overview' }, '', '/overview');
    }

    const codeFromPath = getKvkCodeFromPath(window.location.pathname);
    const initialParams = new URLSearchParams(window.location.search);
    const initialKvk = codeFromPath || (initialParams.get('kvk') ? parseInt(initialParams.get('kvk')!, 10) : null);
    if (initialKvk) {
      setSelectedKvkCode(initialKvk);
    }

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
        const titles: Record<Tab, string> = {
      overview: 'Kingdom 2676 · Kingdom Statistics',
      kvk: 'Kingdom 2676 · KvK Performance',
      alliances: 'Kingdom 2676 · Alliances',
      governors: 'Kingdom 2676 · Governors',
      mge: 'Kingdom 2676 · The Mightiest Governor (MGE)',
      zenith: 'Kingdom 2676 · Zenith of Power Ranking',
      recruitment: 'Kingdom 2676 · Tuyển Dụng & Cổng Nhập Cư',
      admin: 'Kingdom 2676 · Admin Portal',
    };
    document.title = titles[tab] || 'Kingdom 2676 · Kingdom Statistics';
  }, [tab]);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [snapshot, setSnapshot] = useState<KingdomSnapshot | null>(null);
  const [kingdomGuilds, setKingdomGuilds] = useState<KingdomGuild[]>([]);
  const [kvkList, setKvkList] = useState<KvKItem[]>([]);
  const [selectedKvkCode, setSelectedKvkCode] = useState<number | null>(null);
  const [mgeData, setMgeData] = useState<{ updatedAt?: string; events: MgeEvent[] } | null>(null);
  const [zenithData, setZenithData] = useState<{ updatedAt?: string; events: ZenithEvent[] } | null>(null);
  const [selectedMgeId, setSelectedMgeId] = useState<string>('');
  const [selectedZenithId, setSelectedZenithId] = useState<string>('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [allianceQuery, setAllianceQuery] = useState('');
  const [sort, setSort] = useState<keyof Governor>('power');
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'info' | 'ok' | 'error'; message: string } | null>(null);
    const [kingdomConfig, setKingdomConfig] = useState<KingdomConfig | null>(null);
  const [recruitmentData, setRecruitmentData] = useState<RecruitmentData | null>(null);
  const [recruitmentLoading, setRecruitmentLoading] = useState(false);
  const [overviewDynastyTab, setOverviewDynastyTab] = useState<'recentKings' | 'topPower'>('recentKings');

  const PAGE_SIZE = 20;
  const [alliancePage, setAlliancePage] = useState(1);
  const [govPage, setGovPage] = useState(1);

  const refreshData = async () => {
      setRecruitmentLoading(true);
      getKingdomConfig('2676').then(cfg => { if (cfg) setKingdomConfig(cfg); }).catch(() => {});
      getRecruitment('2676').then(rec => { if (rec) setRecruitmentData(rec); }).catch(() => {}).finally(() => setRecruitmentLoading(false));

    try {
      const ts = Date.now();
      const headers = { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' };
      const [govResult, snapshotData, guildsData, kvkData, mgeResult, zenithResult] = await Promise.all([
        loadDataset(lang),
        fetch(`/kingdom-snapshot.json?t=${ts}`, { cache: 'no-store', headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        fetch(`/kingdom-guilds.json?t=${ts}`, { cache: 'no-store', headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        fetch(`/kvk-performance.json?t=${ts}`, { cache: 'no-store', headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        fetch(`/mge-events.json?t=${ts}`, { cache: 'no-store', headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        fetch(`/zenith-events.json?t=${ts}`, { cache: 'no-store', headers })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
      ]);

      if (govResult?.data) setDataset(govResult.data);
      if (snapshotData) setSnapshot(snapshotData as KingdomSnapshot);
      if (Array.isArray(guildsData)) setKingdomGuilds(guildsData as KingdomGuild[]);
      if (kvkData && Array.isArray(kvkData.kvks)) setKvkList(kvkData.kvks as KvKItem[]);
      if (mgeResult && Array.isArray(mgeResult.events)) {
        setMgeData(mgeResult);
        setSelectedMgeId(prev => (prev && mgeResult.events.some((e: MgeEvent) => e.id === prev)) ? prev : mgeResult.events[0]?.id || '');
      }
      if (zenithResult && Array.isArray(zenithResult.events)) {
        setZenithData(zenithResult);
        setSelectedZenithId(prev => (prev && zenithResult.events.some((e: ZenithEvent) => e.id === prev)) ? prev : zenithResult.events[0]?.id || '');
      }
      setError('');
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);

    setToast({
      type: 'info',
      message: lang === 'vi' ? 'Đang làm mới dữ liệu mới nhất...' : 'Refreshing latest data...'
    });
    try {
      await refreshData();
      setToast({
        type: 'ok',
        message: lang === 'vi' ? 'Đã làm mới dữ liệu thành công!' : 'Data refreshed successfully!'
      });
    } catch (err) {
      setToast({ type: 'error', message: (err as Error).message });
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(prev => prev?.type !== 'info' ? prev : null), 4000);
    }
  };

  useEffect(() => {
    void refreshData();
    // Tự động kiểm tra làm mới dữ liệu mỗi 60 giây ngay trên trình duyệt
    const timer = window.setInterval(refreshData, 60_000);

    // Chủ động cập nhật ngay tức thì khi người dùng mở lại tab hoặc focus vào trình duyệt
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
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
    {
      label: i18n.overview.metrics.governors,
      value: fmt.format(rows.length),
      foot: i18n.overview.metrics.governorsFoot,
      iconClass: 'stat-icon-cyan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.power,
      value: compact.format(sum(rows, 'power')),
      foot: i18n.overview.metrics.powerFoot,
      iconClass: 'stat-icon-green',
      icon: (
        <svg viewBox="0 0 1024 1024" fill="currentColor">
          <g transform="scale(1, -1) translate(0, -1024)">
            <path d="M319.653 1020.153c-321.868-86.92-445.593-385.142-156.714-485.409 0 0-2.345 0-2.345 0 1.36-0.184 2.728-0.398 4.081-0.599 19.24-6.589 40.322-12.277 63.238-17.003 107.702-42.301 185.603-144.806 191.92-244.977-71.764-49.456-127.344-134.569-127.344-134.569s56.274-82.839 56.274-82.839c0 0-88.266-50.257-88.266-50.257s175.524 0 175.524 0c-86.563 86.584-25.182 183.952 77.355 183.952 103.94 0 158.34-103.023 77.422-183.952 0 0 173.717 0 173.717 0s-86.456 50.257-86.456 50.257c0 0 56.28 82.839 56.28 82.839s-56.479 86.509-129.083 135.772c6.861 99.79 84.582 201.642 191.852 243.777 22.925 4.725 43.995 10.406 63.233 16.997 1.355 0.204 2.726 0.418 4.085 0.6 0 0-2.409 0-2.409 0 288.922 100.256 165.231 398.487-156.652 485.416-87.199-84.304 14.004-217.736 93.417-121.792 79.015-147.923 18.422-273.205-154.774-178.599-25.439-52.445-73.261-88.595-129.953-88.595-57.179 0-105.284 36.76-130.556 89.935-175.104-97.173-236.641 28.634-157.252 177.259 79.421-95.942 180.62 37.49 93.417 121.789 0 0-0.011-0.002-0.011-0.002M514.064 943.237c-58.647 0-109.914-59.006-109.914-136.209 0-77.208 51.267-134.893 109.914-134.893 58.644 0 109.907 57.688 109.907 134.891 0 77.211-51.263 136.209-109.909 136.209 0 0 0.002 0.002 0.002 0.002" />
          </g>
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.killPoints,
      value: compact.format(sum(rows, 'killPoints')),
      foot: i18n.overview.metrics.killPointsFoot,
      iconClass: 'stat-icon-red',
      icon: (
        <svg viewBox="0 0 1024 1024" fill="currentColor">
          <g transform="scale(1, -1) translate(0, -1024)">
            <path d="M246.507 451.214c0 0 189.546-189.654 189.546-189.654s-75.787-75.84-75.787-75.84c0 0 75.894-75.893 75.894-75.893s-75.84-75.84-75.84-75.84c0 0-132.747 132.747-132.747 132.747s-151.733-151.734-151.733-151.734c0 0-75.84 75.84-75.84 75.84s151.734 151.787 151.734 151.787c0 0-132.747 132.693-132.747 132.693s75.84 75.84 75.84 75.84c0 0 75.84-75.786 75.84-75.786s75.786 75.84 75.786 75.84c0 0 0.054 0 0.054 0M29.285 1009.34c0 0 190.19-0.161 190.19-0.161s633.805-633.859 633.805-633.859c0 0 75.893 75.84 75.893 75.84s75.84-75.84 75.84-75.84c0 0-132.693-132.747-132.693-132.747s151.68-151.733 151.68-151.733c0 0-75.84-75.84-75.84-75.84s-151.733 151.734-151.733 151.734c0 0-132.747-132.747-132.747-132.747s-75.84 75.84-75.84 75.84c0 0 75.84 75.893 75.84 75.893s-634.234 634.235-634.234 634.235c0 0-0.161 189.385-0.161 189.385s0 0 0 0M804.686 1009.34c0 0 190.029-0.161 190.029-0.161s0.108-188.956 0.108-188.956c0 0-217.383-217.329-217.383-217.329s-189.654 189.599-189.654 189.599c0 0 216.9 216.847 216.9 216.847s0 0 0 0" />
          </g>
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.dead,
      value: compact.format(sum(rows, 'dead')),
      foot: i18n.overview.metrics.deadFoot,
      iconClass: 'stat-icon-purple',
      icon: (
        <svg viewBox="0 0 1024 1024" fill="currentColor">
          <g transform="scale(1, -1) translate(0, -1024)">
            <path d="M875.828 875.844c-90.968 94.156-223.594 148.156-363.844 148.156-140.218 0-272.844-54-363.78-148.126-85-88-129.406-205.656-125.062-331.376l13.218-167.75c12.062-169.5 110.468-187.812 152.188-187.812 15.126 0 31.062 2.188 47.25 6.376 2.188-15.876 2-43.718 1.844-65.376l-0.156-30.126c-0.282-21.876-0.718-55 22.468-78.468 9.594-9.75 27.126-21.344 56-21.344h392.094c28.876 0 46.376 11.594 56 21.312 23.156 23.5 22.75 56.594 22.468 78.5l-0.188 30.062c-0.126 21.688-0.344 49.562 1.876 65.438 16.344-4.218 32.188-6.376 47.25-6.376 41.718 0 140.094 18.312 152.188 187.5l13.126 166.312 0.094 1.75c4.342 125.722-40.066 243.378-125.034 331.348zM919.922 548.188l-13.032-165.688c-5.344-74.688-29.406-112.562-71.438-112.562-9.688 0-20.532 1.782-32.594 5.376-28.812 8.312-53.782 2.75-71.406-15-26.812-27-26.532-70.626-26.094-131l0.156-30.562c0.062-5 0.156-12.376-0.282-17.75h-85.5v100.032h-64.812v-100.034h-85.876v100.032h-64.782v-100.032h-85.532c-0.406 5.376-0.312 12.75-0.25 17.812l0.156 30.594c0.438 60.312 0.718 103.906-26.094 130.906-17.532 17.688-41.906 23.5-71.75 14.906-11.718-3.5-22.562-5.282-32.25-5.282-42.062 0-66.062 37.876-71.438 112.876l-13.062 165.376c-3.312 103.218 33 199.562 102.406 271.376 75.786 78.436 187.162 123.436 305.536 123.436 118.406 0 229.782-45 305.562-123.438 69.408-71.812 105.75-168.156 102.376-271.374zM512.016 404.688c-19.438 0-62.25-93.376-70.062-108.938-7.75-15.562 7.812-38.938 31.156-31.126 23.344 7.75 38.906 27.218 38.906 27.218s15.562-19.468 38.906-27.218c23.312-7.812 38.906 15.562 31.126 31.126-7.814 15.562-50.564 108.938-70.032 108.938zM343.172 657.438c-61.782 6.5-117.156-38.376-123.656-100.188l-8.376-58.844c-6.5-61.844 38.376-117.156 100.156-123.656 61.844-6.5 117.218 38.344 123.688 100.188l8.376 58.844c6.468 61.842-38.344 117.156-100.188 123.656zM804.484 557.25c-6.468 61.812-61.876 106.688-123.656 100.188-61.844-6.5-106.656-61.812-100.188-123.656l8.344-58.844c6.5-61.844 61.876-106.688 123.688-100.188s106.688 61.812 100.188 123.656l-8.376 58.844z" />
          </g>
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.t4Kills,
      value: compact.format(sum(rows, 't4Kills')),
      foot: i18n.overview.metrics.t4KillsFoot,
      iconClass: 'stat-icon-tier',
      icon: (
        <svg viewBox="0 0 32 32" className="tier-coin-svg">
          <defs>
            <radialGradient id="t4GoldRing" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#fff5b8" />
              <stop offset="25%" stopColor="#f5c242" />
              <stop offset="65%" stopColor="#b47814" />
              <stop offset="100%" stopColor="#553003" />
            </radialGradient>
            <radialGradient id="t4CenterDisc" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#733206" />
              <stop offset="55%" stopColor="#421b03" />
              <stop offset="100%" stopColor="#180701" />
            </radialGradient>
            <linearGradient id="t4Numeral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffae0" />
              <stop offset="28%" stopColor="#fed658" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#t4GoldRing)" stroke="#452403" strokeWidth="0.7" />
          <circle cx="16" cy="16" r="13.2" fill="none" stroke="#fff8cc" strokeWidth="0.6" opacity="0.85" />
          <circle cx="16" cy="16" r="11.8" fill="url(#t4CenterDisc)" stroke="#5a3104" strokeWidth="0.9" />
          <circle cx="16" cy="16" r="10.5" fill="none" stroke="#f6ca56" strokeWidth="0.4" opacity="0.4" />
          <text x="16" y="20.8" textAnchor="middle" fill="url(#t4Numeral)" fontSize="11.5" fontWeight="900" fontFamily="'Cinzel', 'Times New Roman', Georgia, serif" letterSpacing="-0.04em" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>IV</text>
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.t5Kills,
      value: compact.format(sum(rows, 't5Kills')),
      foot: i18n.overview.metrics.t5KillsFoot,
      iconClass: 'stat-icon-tier',
      icon: (
        <svg viewBox="0 0 32 32" className="tier-coin-svg">
          <defs>
            <radialGradient id="t5GoldRing" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#fff5b8" />
              <stop offset="25%" stopColor="#f5c242" />
              <stop offset="65%" stopColor="#b47814" />
              <stop offset="100%" stopColor="#553003" />
            </radialGradient>
            <radialGradient id="t5CenterDisc" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#733206" />
              <stop offset="55%" stopColor="#421b03" />
              <stop offset="100%" stopColor="#180701" />
            </radialGradient>
            <linearGradient id="t5Numeral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffae0" />
              <stop offset="28%" stopColor="#fed658" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#t5GoldRing)" stroke="#452403" strokeWidth="0.7" />
          <circle cx="16" cy="16" r="13.2" fill="none" stroke="#fff8cc" strokeWidth="0.6" opacity="0.85" />
          <circle cx="16" cy="16" r="11.8" fill="url(#t5CenterDisc)" stroke="#5a3104" strokeWidth="0.9" />
          <circle cx="16" cy="16" r="10.5" fill="none" stroke="#f6ca56" strokeWidth="0.4" opacity="0.4" />
          <text x="16" y="21.2" textAnchor="middle" fill="url(#t5Numeral)" fontSize="12.5" fontWeight="900" fontFamily="'Cinzel', 'Times New Roman', Georgia, serif" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>V</text>
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.troopPower,
      value: compact.format(sum(rows, 'troopPower')),
      foot: i18n.overview.metrics.troopPowerFoot,
      iconClass: 'stat-icon-emerald',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      )
    },
    {
      label: i18n.overview.metrics.alliances,
      value: fmt.format(alliances.length),
      foot: i18n.overview.metrics.alliancesFoot,
      iconClass: 'stat-icon-teal',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l4-4 4 4v14" />
          <path d="M15 21V11l4-4v14" />
          <rect x="8" y="11" width="2" height="3" />
        </svg>
      )
    },
  ];

  const updatedAt = dataset?.exportedAt;

  if (tab === 'admin') {
    return (
      <div className="shell admin-shell">
        <AdminView
          lang={lang}
          onNavigateHome={() => setTab('overview')}
          onLogoUpdated={(newLogo) => {
            setKingdomConfig((prev) =>
              prev
                ? { ...prev, logo_url: newLogo }
                : {
                    kingdom_id: '2676',
                    name: 'Kingdom 2676',
                    tagline: 'Zipporania · Continent of Egria · Chatsworth',
                    logo_url: newLogo,
                    discord_url: 'https://discord.gg/',
                    contact_info: 'R4/R5 Recruitment Team',
                  }
            );
          }}
        />
      </div>
    );
  }

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
                <FlagVN width={16} height={11} />
                <span>VI</span>
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => changeLang('en')}
                title="English"
              >
                <FlagGB width={16} height={11} />
                <span>EN</span>
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
            <a
              href="/admin"
              className="header-admin-btn"
              onClick={(e) => {
                e.preventDefault();
                setTab('admin');
              }}
              title="Admin Portal (R4 / R5 Leadership)"
            >
              <span>🔒 Admin Login</span>
            </a>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-main-info">
            <img src={kingdomConfig?.logo_url || "/logo.png"} alt="KD 2676" className="kd-logo" />
            <div>
              <p className="eyebrow">{i18n.reportSubtitle}</p>
              <h1>Kingdom <em>2676</em></h1>
              <p className="hero-sub">{snapshot?.kingdom || 'Zipporania'} · Continent of Egria · Chatsworth</p>
            </div>
          </div>

          {(snapshot?.currentKing || snapshot?.king) && (
            <aside className="current-king-hero-card" aria-label={i18n.overview.currentKingTitle}>
              <div className="current-king-card-top">
                <span className="current-king-kicker-tag">
                  <svg className="crown-svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  {i18n.overview.currentKingKicker}
                </span>
                <span className="current-king-live-pill">
                  <span className="live-pulse-dot" />
                  {i18n.overview.liveBadge}
                </span>
              </div>
              <div className="current-king-card-main">
                <GovernorAvatar
                  src={snapshot?.currentKing?.avatar || 'https://plat-fau-global.lilithgame.com/p/astc/IM/10043/0/97142368/2025-06-17/067E6C0EC9CADA52480295114135F8E1_250x250.jpg'}
                  frame={snapshot?.currentKing?.avatarFrame || 'https://imimg.lilithcdn.com/roc/img_AvatarFrame_259.png'}
                  name={snapshot?.currentKing?.name || snapshot?.king || 'Spicy Salsa'}
                  size={56}
                  className="current-king-avatar"
                />
                <div className="current-king-text-block">
                  <div className="current-king-gov-name" title={snapshot?.currentKing?.name || snapshot?.king}>
                    {snapshot?.currentKing?.name || snapshot?.king || 'Spicy Salsa'}
                  </div>
                  <div className="current-king-gov-alliance">
                    {snapshot?.currentKing?.alliance || snapshot?.kingAlliance || '[ROFF] Rise of FinalFantasy'}
                  </div>
                  <div className="current-king-gov-since">
                    {formatKingSince(
                      snapshot?.currentKing?.sinceDate,
                      snapshot?.currentKing?.since,
                      snapshot?.currentKing?.sinceVi
                    )}
                  </div>
                </div>
              </div>
            </aside>
          )}
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
          ['kvk', i18n.tabs.kvk],
          ['alliances', i18n.tabs.alliances],
          ['governors', i18n.tabs.governors],
          ['mge', i18n.tabs.mge],
          ['zenith', i18n.tabs.zenith],
          ['recruitment', i18n.tabs.recruitment],
        ] as const).map(([key, label]) => {
          const path = TAB_PATHS[key];
          return (
            <a
              key={key}
              href={path}
              className={`tab ${tab === key ? 'active' : ''}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
                  e.preventDefault();
                  setTab(key);
                }
              }}
            >
              {label}
            </a>
          );
        })}
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
              {metrics.map(m => (
                <article className="stat" key={m.label}>
                  <div className="stat-header">
                    <div className="stat-label">{m.label}</div>
                    <div className={`stat-icon-wrap ${m.iconClass}`}>
                      {m.icon}
                    </div>
                  </div>
                  <div className="stat-value">{m.value}</div>
                  <div className="stat-foot">{m.foot}</div>
                </article>
              ))}
            </div>

            <div className="two-col radar-section-row">
              <KingdomGradeRadar
                grades={snapshot?.radarGrades}
                snapshotDate={snapshot?.capturedAt}
                lang={lang}
              />

              <article className="panel dynasty-panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-kicker">
                      {overviewDynastyTab === 'recentKings' ? i18n.overview.recentKingsKicker : i18n.overview.topKicker}
                    </p>
                    <h3 className="panel-title-with-crown">
                      {overviewDynastyTab === 'recentKings' && (
                        <svg className="crown-svg-gold" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                        </svg>
                      )}
                      <span>
                        {overviewDynastyTab === 'recentKings' ? i18n.overview.recentKingsTitle : i18n.overview.topTitle}
                      </span>
                    </h3>
                  </div>
                  <div className="panel-subtabs">
                    <button
                      type="button"
                      className={`panel-subtab ${overviewDynastyTab === 'recentKings' ? 'active' : ''}`}
                      onClick={() => setOverviewDynastyTab('recentKings')}
                    >
                      👑 {i18n.overview.viewRecentKings}
                    </button>
                    <button
                      type="button"
                      className={`panel-subtab ${overviewDynastyTab === 'topPower' ? 'active' : ''}`}
                      onClick={() => setOverviewDynastyTab('topPower')}
                    >
                      🏆 {i18n.overview.viewTopPower}
                    </button>
                  </div>
                </div>

                {overviewDynastyTab === 'recentKings' ? (
                  <div className="recent-kings-list">
                    {(snapshot?.recentKings || []).map((k, index) => (
                      <div className="recent-king-row" key={`${k.name}-${index}`}>
                        <GovernorAvatar src={k.avatar} frame={k.avatarFrame} name={k.name} size={42} />
                        <div className="recent-king-meta">
                          <div className="recent-king-title-row">
                            <b className="recent-king-name">{k.name}</b>
                            {index === 0 && <span className="king-latest-pill">{i18n.overview.latestBadge}</span>}
                          </div>
                          <div className="recent-king-alliance">{k.alliance}</div>
                          <div className="recent-king-dates">{lang === 'vi' ? (k.datesVi || k.dates) : k.dates}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="top-list">
                    {[...rows].sort((a, b) => b.power - a.power).slice(0, 5).map((row, index) => (
                      <div className="top-row" key={row.id}>
                        <span className="rank">#{index + 1}</span>
                        <GovernorAvatar src={row.avatar} frame={row.avatarFrame} name={row.name} size={40} />
                        <div>
                          <b>{row.name}</b>
                          <div className="gov-meta-row">
                            <small>{row.guildTag ? `[${row.guildTag}] ` : ''}{row.alliance || i18n.overview.noAlliance}</small>
                            <CopyIdButton id={row.id} lang={lang} />
                          </div>
                        </div>
                        <span className="value">{compact.format(row.power)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <article className="panel full-width-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">{i18n.overview.distKicker}</p>
                  <h3>{i18n.overview.distTitle}</h3>
                </div>
                <span className="panel-note">{i18n.overview.alliancesCount(alliances.length)}</span>
              </div>
              <div className="category-list two-col-list">
                {alliances.slice(0, 10).map((item, index) => (
                  <div className="category-row" key={item.tag || item.name}>
                    <span className="category-rank">#{index + 1}</span>
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
          </section>
        )}

        {tab === 'kvk' && (
          <section className="view active">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{i18n.kvk.kicker}</p>
                <h2>{i18n.kvk.title}</h2>
              </div>
              <span className="section-meta">
                {kvkList.length} {lang === 'vi' ? 'mùa KvK' : 'KvK Seasons'}
              </span>
            </div>
            {kvkList.length > 0 ? (
              <KvkPerformanceGrid
                kvks={kvkList}
                lang={lang}
                onOpenDashboard={code => {
                  setSelectedKvkCode(code);
                  const url = new URL(window.location.href);
                  url.searchParams.set('kvk', String(code));
                  window.history.pushState({ tab: 'kvk', kvk: code }, '', url.toString());
                }}
              />
            ) : (
              <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
                <p>{lang === 'vi' ? 'Đang tải thông tin KvK...' : 'Loading KvK information...'}</p>
              </div>
            )}
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
                        <td className="num num-members">{fmt.format(item.count)}</td>
                        <td className="num num-territory">{item.territory ? fmt.format(item.territory) : '—'}</td>
                        <td className="num num-power"><b>{compact.format(item.power)}</b></td>
                        <td className="num num-kp">{item.kp ? compact.format(item.kp) : '—'}</td>
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
                <option value="acclaim">{i18n.governors.sort.acclaim}</option>
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
                      <th className="num">{i18n.governors.headers.acclaim}</th>
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
                              <div className="gov-meta-row">
                                <CopyIdButton id={row.id} lang={lang} />
                                <span className="gov-ch-pill">CH {row.ch ?? '?'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {row.guildTag ? (
                            <span className="alliance-tag-badge">[{row.guildTag}]</span>
                          ) : null}
                          <span>{row.alliance || '—'}</span>
                        </td>
                        <td className="num num-power">{fmt.format(row.power)}</td>
                        <td className="num num-kp">{fmt.format(row.killPoints)}</td>
                        <td className="num num-acclaim">
                          <b>{fmt.format(row.acclaim || 0)}</b>
                          {row.maxAcclaim ? (
                            <small className="acclaim-sub">
                              {i18n.governors.maxAcclaim} {fmt.format(row.maxAcclaim)}
                            </small>
                          ) : null}
                        </td>
                        <td className="num num-t4t5">{compact.format(row.t4Kills)} / {compact.format(row.t5Kills)}</td>
                        <td className="num num-dead">{fmt.format(row.dead)}</td>
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

        {tab === 'mge' && (
          mgeData && mgeData.events.length > 0 ? (
            <MgeView
              events={mgeData.events}
              selectedId={selectedMgeId || mgeData.events[0]?.id}
              onSelectEvent={setSelectedMgeId}
              lang={lang}
              i18n={i18n}
              fmt={fmt}
            />
          ) : (
            <section className="view active">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">{i18n.mge.kicker}</p>
                  <h2>{i18n.mge.title}</h2>
                </div>
              </div>
              <div className="empty-event-card">
                <div className="empty-event-icon">⏳</div>
                <p>{lang === 'vi' ? 'Đang tải dữ liệu MGE...' : 'Loading MGE data...'}</p>
              </div>
            </section>
          )
        )}

        
        {tab === 'recruitment' && (
          <RecruitmentView
            lang={lang}
            recruitment={recruitmentData}
            config={kingdomConfig}
            loading={recruitmentLoading}
          />
        )}

        
        {tab === 'zenith' && (
          zenithData && zenithData.events.length > 0 ? (
            <ZenithView
              events={zenithData.events}
              selectedId={selectedZenithId || zenithData.events[0]?.id}
              onSelectEvent={setSelectedZenithId}
              lang={lang}
              i18n={i18n}
              fmt={fmt}
            />
          ) : (
            <section className="view active">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">{i18n.zenith.kicker}</p>
                  <h2>{i18n.zenith.title}</h2>
                </div>
              </div>
              <div className="empty-event-card">
                <div className="empty-event-icon">⏳</div>
                <p>{lang === 'vi' ? 'Đang tải dữ liệu Zenith...' : 'Loading Zenith data...'}</p>
              </div>
            </section>
          )
        )}
      </main>

      {selectedKvkCode !== null && kvkList.length > 0 && (
        <KvkDashboardModal
          kvks={kvkList}
          selectedCode={selectedKvkCode}
          lang={lang}
          onClose={() => {
            setSelectedKvkCode(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('kvk');
            let targetPath = url.pathname;
            if (targetPath.toLowerCase().includes('kvk/dashboard')) {
              targetPath = TAB_PATHS.kvk;
            }
            window.history.pushState({ tab }, '', targetPath + (url.search ? url.search : ''));
          }}
          onSelectKvk={code => {
            setSelectedKvkCode(code);
            const url = new URL(window.location.href);
            url.searchParams.set('kvk', String(code));
            window.history.replaceState({ tab, kvk: code }, '', url.toString());
          }}
        />
      )}

      <footer>
        <span>{i18n.footer.brand}</span>
        
        <span>{i18n.footer.note}</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
