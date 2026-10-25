import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
    try {
      await page.getByRole('heading', { name: new RegExp(`All Governors\\s*-\\s*KD\\s*#${kingdom}`) }).waitFor({ timeout: 30_000 });
    } catch {
      throw new Error(`Chưa đăng nhập ROKStats hoặc chưa chọn KD ${kingdom}. Chạy npm run login để đăng nhập lại.`);
    }
    await page.getByText(/Showing \d+ of \d+ records/i).waitFor({ timeout: 30_000 });
    await page.getByRole('button', { name: /Export/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      page.getByRole('link', { name: 'CSV' }).click()
    ]);
    const csvPath = await download.path();
    if (!csvPath) throw new Error('ROKStats không trả về file CSV.');
    const dataset = parseGovernorsCsv(await readFile(csvPath, 'utf8'));
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
