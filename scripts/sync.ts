import 'dotenv/config';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kingdom = process.env.ROKSTATS_KINGDOM || '2676';
const session = process.env.ROKSTATS_SESSION?.trim();

function formatReignDates(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return { en: 'Unknown', vi: 'Không rõ' };
  const s = new Date(startDate);
  const e = new Date(endDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const en = `${months[s.getUTCMonth()]} ${s.getUTCDate()}, ${s.getUTCFullYear()} — ${months[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  const vi = `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)}/${s.getUTCFullYear()} — ${pad(e.getUTCDate())}/${pad(e.getUTCMonth() + 1)}/${e.getUTCFullYear()}`;
  return { en, vi };
}

function formatSince(sinceIso?: string) {
  if (!sinceIso) return { en: 'Recently', vi: 'Gần đây' };
  const diffMs = Date.now() - new Date(sinceIso).getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffMinutes < 45) {
    if (diffMinutes <= 1) return { en: 'Just now', vi: 'Vừa xong' };
    return { en: `Since ${diffMinutes} minutes ago`, vi: `Từ ${diffMinutes} phút trước` };
  }
  if (diffHours <= 1) return { en: 'Since an hour ago', vi: 'Từ 1 giờ trước' };
  if (diffHours < 24) return { en: `Since ${diffHours} hours ago`, vi: `Từ ${diffHours} giờ trước` };
  if (diffDays === 1) return { en: 'Since 1 day ago', vi: 'Từ 1 ngày trước' };
  return { en: `Since ${diffDays} days ago`, vi: `Từ ${diffDays} ngày trước` };
}

async function saveAtomic(filename: string, value: string) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temp = `${filename}.${process.pid}.tmp`;
  await writeFile(temp, value, 'utf8');
  await rename(temp, filename);
}

async function saveToAll(relPath: string, content: string) {
  const targets = [
    path.resolve('public', relPath),
    path.resolve('data', relPath),
    path.resolve('dist', relPath),
  ];
  for (const t of targets) {
    try {
      await saveAtomic(t, content);
    } catch {
      // Bỏ qua nếu thư mục chưa tồn tại (ví dụ dist khi chưa build)
    }
  }
}

async function applyOverviewData(overviewApiData: any) {
  if (!overviewApiData || typeof overviewApiData !== 'object') return;
  let existingSnapshot: any = {};
  try {
    existingSnapshot = JSON.parse(await readFile(path.resolve('public/kingdom-snapshot.json'), 'utf8'));
  } catch {
    existingSnapshot = {};
  }

  const cr = overviewApiData.currentRanking;
  const ck = overviewApiData.currentKing;
  const rk = overviewApiData.recentKings;

  if (cr) {
    existingSnapshot.capturedAt = cr.process || new Date().toISOString().slice(0, 10);
    if (cr.rank) existingSnapshot.globalRank = cr.rank;
    existingSnapshot.radarGrades = [
      { key: 'power', label: 'Power', grade: cr.power || 'D', percentile: Number(cr.powerPosition || 17.5) },
      { key: 'tech', label: 'Tech', grade: cr.technology || 'C', percentile: Number(cr.technologyPosition || 24.6) },
      { key: 'activity', label: 'Activity', grade: cr.activity || 'D', percentile: Number(cr.activityPosition || 13.3) },
      { key: 'development', label: 'Development', grade: cr.development || 'C', percentile: Number(cr.developmentPosition || 28.7) },
      { key: 'field', label: 'Field', grade: cr.field || 'D', percentile: Number(cr.fieldPosition || 19.1) },
      { key: 'garrison', label: 'Garrison', grade: cr.garrison || 'C', percentile: Number(cr.garrisonPosition || 22.0) }
    ];
  }

  if (ck) {
    existingSnapshot.king = ck.playerName || existingSnapshot.king;
    existingSnapshot.kingAlliance = `[${ck.guildAbbr || 'ROFF'}] ${ck.guildName || 'Rise of FinalFantasy'}`;
    const sinceObj = formatSince(ck.since);
    existingSnapshot.currentKing = {
      name: ck.playerName,
      alliance: `[${ck.guildAbbr || 'ROFF'}] ${ck.guildName || 'Rise of FinalFantasy'}`,
      allianceTag: ck.guildAbbr || 'ROFF',
      avatar: ck.avatar?.url || existingSnapshot.currentKing?.avatar,
      avatarFrame: ck.avatar?.frame || existingSnapshot.currentKing?.avatarFrame,
      sinceDate: ck.since,
      since: sinceObj.en,
      sinceVi: sinceObj.vi
    };
  }

  if (Array.isArray(rk) && rk.length > 0) {
    existingSnapshot.recentKings = rk.map((k: any) => {
      const dates = formatReignDates(k.startDate, k.endDate);
      return {
        name: k.playerName,
        alliance: `[${k.guildAbbr || 'ROFF'}] ${k.guildName || 'Rise of FinalFantasy'}`,
        allianceTag: k.guildAbbr || 'ROFF',
        dates: dates.en,
        datesVi: dates.vi,
        avatar: k.avatar?.url || '',
        avatarFrame: k.avatar?.frame || ''
      };
    });
  }

  const snapshotPayload = JSON.stringify(existingSnapshot, null, 2);
  await saveToAll('kingdom-snapshot.json', snapshotPayload);
}

async function applyGuildsData(guildsApiData: any) {
  if (Array.isArray(guildsApiData) && guildsApiData.length > 0) {
    const guildsPayload = JSON.stringify(guildsApiData, null, 2);
    await saveToAll('kingdom-guilds.json', guildsPayload);
  }
}

function buildDatasetFromApi(govApiData: any[]): any {
  return {
    source: 'ROKStats Live API',
    exportedAt: new Date().toISOString(),
    rows: govApiData.map((g: any) => ({
      id: String(g.playerId),
      name: g.name || '',
      ch: g.ch || 25,
      power: Number(g.power) || 0,
      troopPower: Number(g.troopPower) || 0,
      killPoints: Number(g.killPoints) || 0,
      acclaim: Number(g.acclaim) || 0,
      maxAcclaim: Number(g.maxAcclaim) || 0,
      t4Kills: Number(g.t4) || 0,
      t5Kills: Number(g.t5) || 0,
      dead: Number(g.dead) || 0,
      snapshotTime: g.snapshotTime || new Date().toISOString(),
      alliance: g.guild ? `[${g.guild.abbreviation || ''}] ${g.guild.name || ''}`.trim() : '',
      avatar: g.avatar?.url || undefined,
      avatarFrame: g.avatar?.frame || undefined,
      guildTag: g.guild?.abbreviation || undefined,
      guildName: g.guild?.name || undefined,
      guildKingdom: g.guild?.kingdom || undefined,
    })).sort((a: any, b: any) => b.power - a.power)
  };
}

export async function syncData() {
  if (!session) {
    console.warn('⚠️ CẢNH BÁO: Chưa cấu hình ROKSTATS_SESSION trong môi trường. Bỏ qua đồng bộ mới, sử dụng dữ liệu sẵn có.');
    return;
  }

  const headers = {
    'Cookie': `connect.sid=${session}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  console.log(`Đang đồng bộ dữ liệu Kingdom ${kingdom} từ ROKStats API...`);
  try {
    const [govRes, guildsRes, overviewRes] = await Promise.all([
      fetch('https://app.rokstats.online/api/governors?limit=1000', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://app.rokstats.online/api/guilds/ranking/${kingdom}/power?limit=100&loadStorehouse=false&from=0`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://app.rokstats.online/api/kingdoms/${kingdom}/overview`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const govApiData = govRes?.data || govRes;
    const guildsApiData = guildsRes?.data || guildsRes;
    const overviewApiData = overviewRes?.data || overviewRes;

    if (!Array.isArray(govApiData) || govApiData.length === 0) {
      console.warn('⚠️ ROKStats không trả về danh sách thống đốc (ROKSTATS_SESSION có thể đã hết hạn hoặc chưa lưu vào Secret). Giữ nguyên dữ liệu hiện tại.');
      return;
    }

    const dataset = buildDatasetFromApi(govApiData);
    await applyGuildsData(guildsApiData);
    await applyOverviewData(overviewApiData);

    const payload = JSON.stringify(dataset, null, 2);
    await saveToAll('governors.json', payload);
    console.log(`✅ Đồng bộ thành công: ${dataset.rows.length} thống đốc!`);
  } catch (err) {
    console.warn('⚠️ Lỗi khi đồng bộ ROKStats API:', (err as Error).message, '— Giữ nguyên dữ liệu hiện tại.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncData();
}
