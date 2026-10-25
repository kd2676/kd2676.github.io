import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAuthenticated } from './auth.ts';
import { browserChannel, dataFile, kingdom, profileDir, publicDataFile } from './config.ts';
import { parseGovernorsCsv } from './parse-csv.ts';

const { chromium } = await import('playwright');
async function saveAtomic(filename: string, value: string) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temp = `${filename}.${process.pid}.tmp`;
  await writeFile(temp, value, 'utf8');
  await rename(temp, filename);
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
    await page.getByText(/Showing \d+ of \d+ records/i).waitFor({ timeout: 30_000 });
    await page.getByRole('button', { name: /Export/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      page.getByRole('link', { name: 'CSV' }).click()
    ]);
    const csvPath = await download.path();
    if (!csvPath) throw new Error('ROKStats không trả về file CSV.');
    const dataset = parseGovernorsCsv(await readFile(csvPath, 'utf8'));

    // Fetch live governors API for avatars and guilds ranking API concurrently
    try {
      const [govApiData, guildsApiData] = await page.evaluate(async (kd) => {
        const [res1, res2] = await Promise.all([
          fetch('https://app.rokstats.online/api/governors?limit=1000').then(r => r.json()).catch(() => null),
          fetch(`https://app.rokstats.online/api/guilds/ranking/${kd}/power?limit=100&loadStorehouse=false&from=0`).then(r => r.json()).catch(() => null)
        ]);
        return [res1?.data || res1, res2?.data || res2];
      }, kingdom);

      if (Array.isArray(govApiData)) {
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
      }

      if (Array.isArray(guildsApiData) && guildsApiData.length > 0) {
        const guildsPayload = JSON.stringify(guildsApiData, null, 2);
        await saveAtomic(path.resolve('data/kingdom-guilds.json'), guildsPayload);
        await saveAtomic(path.resolve('public/kingdom-guilds.json'), guildsPayload);
      }
    } catch (err) {
      console.warn('Không thể tải bổ sung avatar hoặc guild rankings từ API:', err);
    }

    const payload = JSON.stringify(dataset);
    await saveAtomic(dataFile, payload);
    await saveAtomic(publicDataFile, payload);
    return { rows: dataset.rows.length, exportedAt: dataset.exportedAt };
  } finally {
    await context.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncOnce().then(result => console.log(`Đã cập nhật ${result.rows} thống đốc lúc ${result.exportedAt}.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
