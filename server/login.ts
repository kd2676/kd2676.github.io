import { mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { kingdom, loginBrowserChannel, profileDir } from './config.ts';
import { syncOnce } from './sync.ts';

const { chromium } = await import('playwright');
await mkdir(profileDir, { recursive: true });
const context = await chromium.launchPersistentContext(profileDir, {
  headless: false,
  channel: loginBrowserChannel,
  acceptDownloads: true
});
try {
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://app.rokstats.online/governors');
  console.log(`Đăng nhập ROKStats bằng Discord, sau đó chọn Kingdom ${kingdom}.`);
  console.log(`Khi trang hiện "All Governors - KD #${kingdom}", quay lại cửa sổ này và nhấn Enter.`);
  const input = createInterface({ input: process.stdin, output: process.stdout });
  await input.question('Nhấn Enter sau khi đăng nhập xong...');
  input.close();
} finally {
  await context.close().catch(() => {});
}
const result = await syncOnce();
console.log(`Đã xác nhận phiên đăng nhập: xuất thành công ${result.rows} thống đốc KD ${kingdom}.`);
