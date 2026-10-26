import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAuthenticated } from './auth.ts';
import { browserChannel, dataFile, kingdom, profileDir, rokstatsSession } from './config.ts';
import { parseGovernorsCsv } from './parse-csv.ts';

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
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return { en: 'Just now', vi: 'Vừa xong' };
  if (diffHours === 1) return { en: 'Since an hour ago', vi: 'Từ 1 giờ trước' };
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
    path.resolve('data', relPath),
    path.resolve('public', relPath),
    path.resolve('dist', relPath),
  ];
  for (const t of targets) {
    try {
      await saveAtomic(t, content);
    } catch {
      // Continue if target directory cannot be written (e.g. dist in dev)
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

/**
 * Đồng bộ trực tiếp siêu tốc bằng session cookie mà không cần khởi động trình duyệt.
 */
async function syncDirect(session: string) {
  const headers = {
    'Cookie': `connect.sid=${session}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  console.log('Đang đồng bộ trực tiếp qua ROKStats API (không mở trình duyệt)...');
  const [govRes, guildsRes, overviewRes] = await Promise.all([
    fetch('https://app.rokstats.online/api/governors?limit=1000', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://app.rokstats.online/api/guilds/ranking/${kingdom}/power?limit=100&loadStorehouse=false&from=0`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`https://app.rokstats.online/api/kingdoms/${kingdom}/overview`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
  ]);

  const govApiData = govRes?.data || govRes;
  const guildsApiData = guildsRes?.data || guildsRes;
  const overviewApiData = overviewRes?.data || overviewRes;

  if (!Array.isArray(govApiData) || govApiData.length === 0) {
    throw new Error('ROKStats API không trả về dữ liệu (có thể cookie ROKSTATS_SESSION đã hết hạn).');
  }

  // 1. Thống đốc
  const dataset = buildDatasetFromApi(govApiData);

  // 2. Liên minh
  await applyGuildsData(guildsApiData);

  // 3. Tổng quan Kingdom
  await applyOverviewData(overviewApiData);

  const payload = JSON.stringify(dataset, null, 2);
  await saveToAll('governors.json', payload);
  await saveAtomic(dataFile, payload);
  console.log(`Đồng bộ API trực tiếp thành công: ${dataset.rows.length} thống đốc!`);
  return { rows: dataset.rows.length, exportedAt: dataset.exportedAt };
}

/**
 * Đồng bộ qua trình duyệt Playwright (dự phòng khi không có ROKSTATS_SESSION).
 */
async function syncBrowser() {
  const { chromium } = await import('playwright');
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    channel: browserChannel,
    acceptDownloads: true
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://app.rokstats.online/governors', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await ensureAuthenticated(page, kingdom);
    let dataset: any = null;
    try {
      await page.getByText(/Showing \d+ of \d+ records/i).waitFor({ timeout: 10_000 });
      await page.getByRole('button', { name: /Export/i }).click();
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.getByRole('link', { name: 'CSV' }).click()
      ]);
      const csvPath = await download.path();
      if (csvPath) {
        dataset = parseGovernorsCsv(await readFile(csvPath, 'utf8'));
      }
    } catch (csvErr) {
      console.warn('Bỏ qua tải CSV, chuyển sang API:', (csvErr as Error).message);
    }

    try {
      const [govApiData, guildsApiData, overviewApiData] = await page.evaluate(async (kd) => {
        const [res1, res2, res3] = await Promise.all([
          fetch('https://app.rokstats.online/api/governors?limit=1000').then(r => r.json()).catch(() => null),
          fetch(`https://app.rokstats.online/api/guilds/ranking/${kd}/power?limit=100&loadStorehouse=false&from=0`).then(r => r.json()).catch(() => null),
          fetch(`https://app.rokstats.online/api/kingdoms/${kd}/overview`).then(r => r.json()).catch(() => null)
        ]);
        return [res1?.data || res1, res2?.data || res2, res3?.data || res3];
      }, kingdom);

      if (dataset && Array.isArray(govApiData)) {
        const govMap = new Map<string, any>();
        for (const g of govApiData) {
          govMap.set(String(g.playerId), g);
        }
        for (const row of dataset.rows) {
          const g = govMap.get(String(row.id));
          if (g) {
            if (g.avatar?.url) row.avatar = g.avatar.url;
            if (g.avatar?.frame) row.avatarFrame = g.avatar.frame;
            if (g.guild?.abbreviation) row.guildTag = g.guild.abbreviation;
            if (g.guild?.name) row.guildName = g.guild.name;
            if (g.guild?.kingdom) row.guildKingdom = g.guild.kingdom;
          }
        }
      } else if (!dataset && Array.isArray(govApiData) && govApiData.length > 0) {
        dataset = buildDatasetFromApi(govApiData);
      } else if (!dataset) {
        try {
          dataset = JSON.parse(await readFile(dataFile, 'utf8'));
        } catch {
          dataset = { source: 'ROKStats', exportedAt: new Date().toISOString(), rows: [] };
        }
      }

      await applyGuildsData(guildsApiData);
      await applyOverviewData(overviewApiData);
    } catch (err) {
      console.warn('Lưu ý khi cập nhật bổ sung từ ROKStats APIs:', err);
    }

    const payload = JSON.stringify(dataset, null, 2);
    await saveToAll('governors.json', payload);
    await saveAtomic(dataFile, payload);
    return { rows: dataset.rows.length, exportedAt: dataset.exportedAt };
  } finally {
    await context.close();
  }
}

export async function syncOnce() {
  if (rokstatsSession) {
    try {
      return await syncDirect(rokstatsSession);
    } catch (err) {
      console.warn('Đồng bộ trực tiếp thất bại, chuyển sang Playwright:', (err as Error).message);
    }
  }
  return await syncBrowser();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncOnce().then(result => console.log(`Đã cập nhật ${result.rows} thống đốc lúc ${result.exportedAt}.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
