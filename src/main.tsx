import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Governor = {
  id: string; name: string; alliance: string; power: number; troopPower: number;
  killPoints: number; t4Kills: number; t5Kills: number; dead: number;
  ch?: number; snapshotTime?: string;
};
type Dataset = { source: string; exportedAt: string; rows: Governor[] };
type KvK = { code: string; name: string; dates: string; status?: string; kp?: string; deaths?: string };
type KingdomSnapshot = { kingdom: string; opened: string; king: string; kingAlliance: string; globalRank: number; capturedAt: string; kvks: KvK[] };
type Status = { lastAttempt?: string; lastSuccess?: string; error?: string | null; running?: boolean };
type Tab = 'overview' | 'alliances' | 'governors' | 'data';
const fmt = new Intl.NumberFormat('vi-VN');
const decimal = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const compact = { format(value: number) {
  if (Math.abs(value) >= 1e9) return `${decimal.format(value / 1e9)}B`;
  if (Math.abs(value) >= 1e6) return `${decimal.format(value / 1e6)}M`;
  if (Math.abs(value) >= 1e3) return `${decimal.format(value / 1e3)}K`;
  return fmt.format(value);
} };
const formatDate = (value?: string) => value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có';
const sum = (rows: Governor[], field: keyof Governor) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);

async function loadDataset(): Promise<{ data: Dataset; live: boolean }> {
  try {
    const response = await fetch('/api/governors', { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json() as Dataset;
    if (!Array.isArray(data.rows)) throw new Error('Invalid data');
    return { data, live: true };
  } catch {
    const response = await fetch('/governors.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không đọc được dữ liệu thống đốc.');
    const data = await response.json() as Dataset;
    if (!Array.isArray(data.rows)) throw new Error('Dữ liệu thống đốc không hợp lệ.');
    return { data, live: false };
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [snapshot, setSnapshot] = useState<KingdomSnapshot | null>(null);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<keyof Governor>('power');

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const result = await loadDataset();
        if (mounted) { setDataset(result.data); setLive(result.live); setError(''); }
        if (result.live) {
          const response = await fetch('/api/status', { cache: 'no-store' });
          if (response.ok && mounted) setStatus(await response.json() as Status);
        }
      } catch (caught) { if (mounted) setError((caught as Error).message); }
    };
    void refresh();
    fetch('/kingdom-snapshot.json').then(response => response.json()).then(data => { if (mounted) setSnapshot(data as KingdomSnapshot); }).catch(() => {});
    const timer = window.setInterval(refresh, 5 * 60_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const rows = dataset?.rows ?? [];
  const alliances = useMemo(() => {
    const totals = new Map<string, { count: number; power: number; kp: number }>();
    for (const row of rows) {
      const name = row.alliance?.trim() || 'Không có liên minh';
      const value = totals.get(name) || { count: 0, power: 0, kp: 0 };
      value.count++; value.power += row.power || 0; value.kp += row.killPoints || 0;
      totals.set(name, value);
    }
    return [...totals].map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.power - a.power);
  }, [rows]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return rows.filter(row => !needle || `${row.name} ${row.id} ${row.alliance}`.toLocaleLowerCase().includes(needle))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : Number(b[sort] || 0) - Number(a[sort] || 0));
  }, [rows, query, sort]);
  const metrics = [
    ['Thống đốc', fmt.format(rows.length), 'ID trong bản xuất'],
    ['Sức mạnh', compact.format(sum(rows, 'power')), 'Tổng Power trong CSV'],
    ['Kill Points', compact.format(sum(rows, 'killPoints')), 'Tổng điểm tiêu diệt'],
    ['Lính hy sinh', compact.format(sum(rows, 'dead')), 'Tổng Dead'],
    ['T4 Kills', compact.format(sum(rows, 't4Kills')), 'Tổng T4'],
    ['T5 Kills', compact.format(sum(rows, 't5Kills')), 'Tổng T5'],
    ['Troop Power', compact.format(sum(rows, 'troopPower')), 'Tổng Troop Power'],
    ['Liên minh', fmt.format(alliances.length), 'Có trong bản xuất']
  ];
  const updatedAt = dataset?.exportedAt;

  return <div className="shell">
    <header className="hero">
      <div className="hero-top"><div className="brand"><span className="brand-icon">✦</span><span>ROK / INTELLIGENCE</span></div><a className="source-link" href="https://app.rokstats.online/kingdom/2676" target="_blank" rel="noreferrer">Nguồn ROKSTATS ↗</a></div>
      <div className="hero-content"><div className="crest" aria-hidden="true"><span>2676</span><small>✦</small></div><div><p className="eyebrow">RISE OF KINGDOMS · KINGDOM REPORT</p><h1>Kingdom <em>2676</em></h1><p className="hero-sub">{snapshot?.kingdom || 'Zipporania'} · Continent of Egria · Chatsworth</p></div></div>
      <div className="hero-foot"><span><i className={`status-dot ${dataset ? 'ready' : ''}`} />{live ? 'Đồng bộ trên máy này' : 'Bản dữ liệu đã xuất'}</span><span>Cập nhật: {formatDate(updatedAt)}</span></div>
    </header>
    <nav className="tabs" aria-label="Các mục thống kê">{([['overview', 'Tổng quan'], ['alliances', 'Liên minh'], ['governors', 'Thống đốc'], ['data', 'Cập nhật']] as const).map(([key, label]) => <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)} type="button">{label}</button>)}</nav>
    <main>
      <section className="notice"><div className="notice-symbol">◎</div><div><strong>{error ? 'Lỗi dữ liệu' : live ? 'Tự cập nhật từ ROKStats' : 'Bản dữ liệu đã xuất từ ROKStats'}</strong><p>{error || (live ? `Máy chủ kiểm tra bản xuất mới theo lịch. Lần cập nhật thành công: ${formatDate(status?.lastSuccess || updatedAt)}.${status?.error ? ` Lỗi gần nhất: ${status.error}` : ''}` : `Danh sách ${fmt.format(rows.length)} thống đốc được xuất lúc ${formatDate(updatedAt)}. Bản web lưu trên Sites chỉ đổi khi được xuất bản lại.`)}</p></div><button className="text-action" onClick={() => setTab('data')} type="button">Chi tiết →</button></section>
      {tab === 'overview' && <section className="view active"><div className="section-heading"><div><p className="section-kicker">01 / OVERVIEW</p><h2>Toàn cảnh vương quốc</h2></div><span className="section-meta">Bản xuất {formatDate(updatedAt)}</span></div>
        <div className="stats-grid">{metrics.map(([label, value, foot]) => <article className="stat" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></article>)}</div>
        <div className="two-col"><article className="panel"><div className="panel-heading"><div><p className="section-kicker">PHÂN BỔ</p><h3>Thống đốc theo liên minh</h3></div><span className="panel-note">{alliances.length} liên minh</span></div><div className="category-list">{alliances.slice(0, 8).map(item => <div className="category-row" key={item.name}><span title={item.name}>{item.name}</span><div className="bar"><i style={{ width: `${item.count / (alliances[0]?.count || 1) * 100}%` }} /></div><b>{item.count}</b></div>)}</div></article>
          <article className="panel"><div className="panel-heading"><div><p className="section-kicker">TOP 5</p><h3>Sức mạnh nổi bật</h3></div></div><div className="top-list">{[...rows].sort((a, b) => b.power - a.power).slice(0, 5).map((row, index) => <div className="top-row" key={row.id}><span className="rank">#{index + 1}</span><div><b>{row.name}</b><small>{row.alliance || 'Không có liên minh'} · ID {row.id}</small></div><span className="value">{compact.format(row.power)}</span></div>)}</div></article></div>
        <article className="panel kvk-panel"><div className="panel-heading"><div><p className="section-kicker">KVK HISTORY</p><h3>Hiệu suất KvK</h3></div><span className="panel-note">Dữ liệu lịch sử từ {snapshot?.capturedAt || '25/10/2026'}</span></div><div className="kvk-list">{snapshot?.kvks.map(item => <div className="kvk-row" key={item.code}><div><b>{item.name}</b><small>{item.code} · {item.dates}</small></div><div className="kvk-stats">{item.status ? <em>{item.status}</em> : <><b>{item.kp} KP</b><small>{item.deaths} Dead</small></>}</div></div>)}</div></article>
      </section>}
      {tab === 'alliances' && <section className="view active"><div className="section-heading"><div><p className="section-kicker">02 / ALLIANCES</p><h2>Các liên minh</h2></div><span className="section-meta">{alliances.length} liên minh</span></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Hạng</th><th>Liên minh</th><th className="num">Thống đốc</th><th className="num">Power</th><th className="num">Kill Points</th></tr></thead><tbody>{alliances.map((item, index) => <tr key={item.name}><td>#{index + 1}</td><td><b>{item.name}</b></td><td className="num">{fmt.format(item.count)}</td><td className="num">{compact.format(item.power)}</td><td className="num">{compact.format(item.kp)}</td></tr>)}</tbody></table></div></div></section>}
      {tab === 'governors' && <section className="view active"><div className="section-heading"><div><p className="section-kicker">03 / GOVERNORS</p><h2>Danh sách thống đốc</h2></div><span className="section-meta">{filtered.length} / {rows.length} thống đốc</span></div><div className="toolbar"><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Tìm tên, ID hoặc liên minh" /></label><select value={sort} onChange={event => setSort(event.target.value as keyof Governor)} aria-label="Sắp xếp"><option value="power">Power cao nhất</option><option value="killPoints">Kill Points cao nhất</option><option value="dead">Dead cao nhất</option><option value="name">Tên A–Z</option></select></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Thống đốc</th><th>Liên minh</th><th className="num">Power</th><th className="num">Kill Points</th><th className="num">T4 / T5</th><th className="num">Dead</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><b>{row.name}</b><small>ID {row.id} · CH {row.ch ?? '?'}</small></td><td>{row.alliance || '—'}</td><td className="num">{fmt.format(row.power)}</td><td className="num">{fmt.format(row.killPoints)}</td><td className="num">{compact.format(row.t4Kills)} / {compact.format(row.t5Kills)}</td><td className="num">{fmt.format(row.dead)}</td></tr>)}</tbody></table></div></div></section>}
      {tab === 'data' && <section className="view active"><div className="section-heading"><div><p className="section-kicker">04 / DATA SOURCE</p><h2>Cập nhật dữ liệu</h2></div></div><div className="data-layout"><article className="panel guide-panel"><p className="section-kicker">TRẠNG THÁI</p><h3>{live ? 'Đồng bộ tự động trên máy Windows' : 'Bản xuất đang hiển thị'}</h3><p>Nguồn: <a href="https://app.rokstats.online/governors" target="_blank" rel="noreferrer">ROKStats All Governors ↗</a></p><p>Lần xuất hiện tại: <b>{formatDate(updatedAt)}</b></p><p>{live ? `Lần kiểm tra gần nhất: ${formatDate(status?.lastAttempt)}. ${status?.running ? 'Đang đồng bộ.' : ''}` : 'Trang lưu trữ trực tuyến hiển thị bản xuất gần nhất đã được phát hành.'}</p>{status?.error && <p className="upload-result error">{status.error}</p>}</article><article className="panel guide-panel"><p className="section-kicker">CÁCH HOẠT ĐỘNG</p><h3>Phiên đăng nhập Discord</h3><p>Đăng nhập một lần bằng lệnh <code>npm run login</code>. Sau đó chạy <code>npm run build</code> và <code>npm start</code> trên máy Windows. Máy sẽ tự xuất danh sách thống đốc theo khoảng thời gian trong <code>.env</code>.</p><p>Khi phiên Discord hết hạn, đăng nhập lại. Mật khẩu Discord không nằm trong mã nguồn hay trình duyệt của người xem.</p></article></div></section>}
    </main>
    <footer><span>KINGDOM 2676 · COMMUNITY DASHBOARD</span><span>ROKStats là nguồn dữ liệu; mốc cập nhật được hiển thị ở đầu trang.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
