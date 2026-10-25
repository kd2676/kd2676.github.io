const STORE_KEY = 'kingdom-2676-snapshots-v1';
const $ = (selector) => document.querySelector(selector);
const fmt = new Intl.NumberFormat('vi-VN');
const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 2 });

const metricCards = [
  ['Thống đốc', 'count', 'ID đã nhập'],
  ['Sức mạnh', 'power', 'Tổng Power'],
  ['Kill Points', 'killPoints', 'Tổng điểm tiêu diệt'],
  ['Lính hy sinh', 'dead', 'Tổng Dead'],
  ['T4 Kills', 't4Kills', 'Tổng T4'],
  ['T5 Kills', 't5Kills', 'Tổng T5'],
  ['Troop Power', 'troopPower', 'Nếu file có cột này'],
  ['Liên minh', 'alliances', 'Có trong bản dữ liệu']
];

const aliases = {
  name: ['name', 'governor', 'governorname', 'nickname', 'player', 'playername', 'ten', 'tenthongdoc'],
  id: ['id', 'governorid', 'playerid', 'characterid', 'userid', 'idhocvien', 'idthongdoc'],
  alliance: ['alliance', 'alliancetag', 'tag', 'lienminh'],
  power: ['power', 'totalpower', 'sucmanh'],
  troopPower: ['trooppower', 'troops', 'lucluongquan'],
  killPoints: ['killpoints', 'killpoint', 'kp', 'diemtieudiet'],
  t4Kills: ['t4kills', 't4kill', 't4', 'tier4kills'],
  t5Kills: ['t5kills', 't5kill', 't5', 'tier5kills'],
  dead: ['dead', 'deaths', 'deadtroops', 'death', 'linhhy sinh', 'linhhy sinh'.replace(/ /g, '')],
  category: ['category', 'group', 'nhom', 'loai']
};

function normalizedKey(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function valueFor(row, field) {
  const keys = Object.keys(row);
  const match = keys.find(key => aliases[field].includes(normalizedKey(key)));
  return match == null ? '' : row[match];
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? '').trim().replace(/\s/g, '');
  if (!raw) return 0;
  const suffix = raw.match(/([KMB])$/i)?.[1]?.toUpperCase();
  let digits = suffix ? raw.slice(0, -1) : raw;
  if (/^\d{1,3}([.,]\d{3})+$/.test(digits)) digits = digits.replace(/[.,]/g, '');
  else if (digits.includes(',') && digits.includes('.')) digits = digits.lastIndexOf(',') > digits.lastIndexOf('.') ? digits.replace(/\./g, '').replace(',', '.') : digits.replace(/,/g, '');
  else digits = digits.replace(',', '.');
  const result = Number(digits.replace(/[^\d.-]/g, ''));
  return Number.isFinite(result) ? result * ({ K: 1e3, M: 1e6, B: 1e9 }[suffix] || 1) : 0;
}

function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(part => part.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some(part => part.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('File CSV cần một dòng tiêu đề và ít nhất một dòng dữ liệu.');
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((head, index) => [head.trim(), values[index] ?? ''])));
}

function extractRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  for (const key of ['governors', 'players', 'members', 'rows', 'data']) {
    if (Array.isArray(parsed?.[key])) return parsed[key];
    if (Array.isArray(parsed?.data?.[key])) return parsed.data[key];
  }
  throw new Error('Không tìm thấy danh sách thống đốc trong file JSON.');
}

function normalizeRows(rows) {
  if (!rows.length) throw new Error('File không có dữ liệu thống đốc.');
  const first = rows[0];
  if (!Object.keys(first).some(key => aliases.id.includes(normalizedKey(key))) || !Object.keys(first).some(key => aliases.power.includes(normalizedKey(key)))) {
    throw new Error('Cần cột ID và Power. Hãy kiểm tra tên cột hoặc dùng mẫu CSV.');
  }
  const seen = new Set();
  const result = rows.map(row => ({
    id: String(valueFor(row, 'id') ?? '').trim(),
    name: String(valueFor(row, 'name') ?? '').trim(),
    alliance: String(valueFor(row, 'alliance') ?? '').trim(),
    category: String(valueFor(row, 'category') ?? '').trim(),
    power: toNumber(valueFor(row, 'power')),
    troopPower: toNumber(valueFor(row, 'troopPower')),
    killPoints: toNumber(valueFor(row, 'killPoints')),
    t4Kills: toNumber(valueFor(row, 't4Kills')),
    t5Kills: toNumber(valueFor(row, 't5Kills')),
    dead: toNumber(valueFor(row, 'dead'))
  })).filter(row => {
    if (!row.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
  if (!result.length) throw new Error('Không tìm thấy ID hợp lệ trong file.');
  return result;
}

function loadSnapshots() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}

let snapshots = loadSnapshots();
let rows = snapshots.at(-1)?.rows || [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sum(field, items = rows) { return items.reduce((total, row) => total + (row[field] || 0), 0); }
function display(value) { return value ? compact.format(value) : '—'; }
function setEmpty(element, message) { element.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`; }

function renderOverview() {
  $('#stats-grid').innerHTML = sourceSnapshot.metrics.map(([label, value, foot]) => `<article class="stat"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div><div class="stat-foot">${escapeHtml(foot)}</div></article>`).join('');
  const groups = new Map();
  rows.forEach(row => groups.set(row.category || 'Chưa phân loại', (groups.get(row.category || 'Chưa phân loại') || 0) + 1));
  $('#category-count').textContent = `${groups.size} nhóm`;
  if (groups.size) $('#category-list').innerHTML = [...groups].sort((a,b) => b[1] - a[1]).map(([name,count]) => `<div class="category-row"><span>${escapeHtml(name)}</span><span class="bar"><i style="width:${count / rows.length * 100}%"></i></span><b>${fmt.format(count)}</b></div>`).join('');
  else setEmpty($('#category-list'), 'Nhập dữ liệu để xem phân bổ nhóm.');
  if (rows.length) $('#top-list').innerHTML = [...rows].sort((a,b) => b.power - a.power).slice(0,5).map((row,i) => `<div class="top-row"><span class="rank">${String(i+1).padStart(2,'0')}</span><span><b>${escapeHtml(row.name || `ID ${row.id}`)}</b><small>${escapeHtml(row.alliance || 'Chưa có liên minh')} · ${escapeHtml(row.id)}</small></span><span class="value">${display(row.power)}</span></div>`).join('');
  else setEmpty($('#top-list'), 'Chưa có danh sách thống đốc.');
  $('#scan-label').textContent = 'ROKSTATS · 25/10/2026';
  $('#kvk-list').innerHTML = sourceSnapshot.kvks.map(kvk => `<div class="kvk-row"><span><b>${escapeHtml(kvk.name)}</b><small>#${escapeHtml(kvk.code)} · ${escapeHtml(kvk.dates)}</small></span><span class="kvk-stats">${kvk.status ? `<em>${escapeHtml(kvk.status)}</em>` : `<b>${escapeHtml(kvk.kp)} KP</b><small>${escapeHtml(kvk.deaths)} Dead</small>`}</span></div>`).join('');
}

function renderAlliances() {
  $('#alliance-count').textContent = `${sourceSnapshot.alliances.length} liên minh`;
  $('#alliance-rows').innerHTML = sourceSnapshot.alliances.map(([tag,name,power],index) => `<tr><td><b class="rank">${String(index+1).padStart(2,'0')}</b></td><td><b>${escapeHtml(name)}</b><small>[${escapeHtml(tag)}]</small></td><td class="num">${escapeHtml(power)}</td></tr>`).join('');
}

function renderGovernors() {
  const query = $('#search').value.trim().toLowerCase();
  const sort = $('#sort').value;
  const filtered = rows.filter(row => `${row.id} ${row.name} ${row.alliance}`.toLowerCase().includes(query)).sort((a,b) => sort === 'name' ? (a.name || a.id).localeCompare(b.name || b.id, 'vi') : (b[sort] || 0) - (a[sort] || 0));
  $('#governor-count').textContent = `${fmt.format(filtered.length)} thống đốc`;
  $('#governor-rows').innerHTML = filtered.length ? filtered.map(row => `<tr><td><b>${escapeHtml(row.name || `ID ${row.id}`)}</b><small>${escapeHtml(row.id)}</small></td><td>${escapeHtml(row.alliance || '—')}</td><td class="num">${display(row.power)}</td><td class="num">${display(row.killPoints)}</td><td class="num">${display(row.t4Kills)} / ${display(row.t5Kills)}</td><td class="num">${display(row.dead)}</td></tr>`).join('') : '<tr><td colspan="6"><div class="empty">Không có thống đốc phù hợp.</div></td></tr>';
}

function renderHistory() {
  if (!snapshots.length) setEmpty($('#history-list'), 'Chưa có lần nhập dữ liệu nào.');
  else $('#history-list').innerHTML = [...snapshots].reverse().map(item => `<div class="history-item"><span>${new Date(item.at).toLocaleString('vi-VN')} · ${escapeHtml(item.file)}</span><span>${fmt.format(item.rows.length)} ID</span></div>`).join('');
  const hasData = rows.length > 0;
  $('#data-status').innerHTML = '<i class="status-dot ready"></i> Có bản chụp ROKSTATS';
  $('#updated-at').textContent = 'Ghi nhận 25/10/2026';
  $('#data-notice').classList.toggle('hidden', hasData);
}

function render() { renderOverview(); renderAlliances(); renderGovernors(); renderHistory(); }
function openTab(name) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => openTab(tab.dataset.tab)));
document.querySelector('[data-open-data]').addEventListener('click', () => openTab('data'));
$('#search').addEventListener('input', renderGovernors);
$('#sort').addEventListener('change', renderGovernors);
$('#file-input').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const result = $('#upload-result');
  result.classList.remove('error');
  try {
    const contents = await file.text();
    const parsed = file.name.toLowerCase().endsWith('.json') ? extractRows(JSON.parse(contents)) : parseCsv(contents);
    const normalized = normalizeRows(parsed);
    const next = [...snapshots, { at: new Date().toISOString(), file: file.name, rows: normalized }].slice(-10);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    snapshots = next;
    rows = normalized;
    result.textContent = `Đã nhập ${fmt.format(rows.length)} ID từ ${file.name}.`;
    render();
  } catch (error) {
    result.classList.add('error');
    result.textContent = error.message || 'Không đọc được file.';
  }
  event.target.value = '';
});
$('#download-template').addEventListener('click', () => {
  const csv = 'id,name,alliance,power,troop_power,kill_points,t4_kills,t5_kills,dead,category\n';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\uFEFF',csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'kingdom-2676-template.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});
$('#clear-data').addEventListener('click', () => {
  if (!snapshots.length || !confirm('Xóa mọi bản dữ liệu Kingdom 2676 đã lưu trong trình duyệt này?')) return;
  localStorage.removeItem(STORE_KEY);
  snapshots = [];
  rows = [];
  render();
});
render();
