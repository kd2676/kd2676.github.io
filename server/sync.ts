import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAuthenticated } from './auth.ts';
import { browserChannel, dataFile, kingdom, profileDir } from './config.ts';
import { parseGovernorsCsv } from './parse-csv.ts';

const { chromium } = await import('playwright');

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

export async function syncOnce() {
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
      console.warn('Lưu ý: Bỏ qua tải CSV, chuyển sang đồng bộ qua ROKStats API:', (csvErr as Error).message);
    }

    // Concurrently fetch APIs: governors (avatars/frames), guild rankings, and kingdom overview!
    try {
      const [govApiData, guildsApiData, overviewApiData] = await page.evaluate(async (kd) => {
        const [res1, res2, res3] = await Promise.all([
          fetch('https://app.rokstats.online/api/governors?limit=1000').then(r => r.json()).catch(() => null),
          fetch(`https://app.rokstats.online/api/guilds/ranking/${kd}/power?limit=100&loadStorehouse=false&from=0`).then(r => r.json()).catch(() => null),
          fetch(`https://app.rokstats.online/api/kingdoms/${kd}/overview`).then(r => r.json()).catch(() => null)
        ]);
        return [res1?.data || res1, res2?.data || res2, res3?.data || res3];
      }, kingdom);

      // 1. Process Governors (either from CSV enriched by API, or directly from API)
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
        dataset = {
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
      } else if (!dataset) {
        try {
          dataset = JSON.parse(await readFile(dataFile, 'utf8'));
        } catch {
          dataset = { source: 'ROKStats', exportedAt: new Date().toISOString(), rows: [] };
        }
      }

      // 2. Update Alliances (Guilds)
      if (Array.isArray(guildsApiData) && guildsApiData.length > 0) {
        const guildsPayload = JSON.stringify(guildsApiData, null, 2);
        await saveToAll('kingdom-guilds.json', guildsPayload);
      }

      // 3. Update Overview (Kingdom Snapshot)
      if (overviewApiData && typeof overviewApiData === 'object') {
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
    } catch (err) {
      console.warn('Lưu ý khi cập nhật bổ sung từ ROKStats APIs:', err);
    }

    const payload = JSON.stringify(dataset);
    await saveToAll('governors.json', payload);
    await saveAtomic(dataFile, payload);
    return { rows: dataset.rows.length, exportedAt: dataset.exportedAt };
  } finally {
    await context.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncOnce().then(result => console.log(`Đã cập nhật ${result.rows} thống đốc lúc ${result.exportedAt}.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
