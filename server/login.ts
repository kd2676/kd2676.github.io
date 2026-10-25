import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { kingdom, loginBrowserChannel, profileDir } from './config.ts';
import { syncOnce } from './sync.ts';

const discordEmail = process.env.DISCORD_EMAIL?.trim();
const discordPassword = process.env.DISCORD_PASSWORD?.trim();

const { chromium } = await import('playwright');
await mkdir(profileDir, { recursive: true });
const context = await chromium.launchPersistentContext(profileDir, {
  headless: discordEmail && discordPassword ? true : false,
  channel: loginBrowserChannel,
  acceptDownloads: true
});
try {
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://app.rokstats.online/governors');

  if (discordEmail && discordPassword) {
    console.log('Phát hiện DISCORD_EMAIL và DISCORD_PASSWORD trong .env — tự động đăng nhập...');
    // Nhấn nút Login với Discord nếu chưa đăng nhập
    try {
      const loginBtn = page.getByRole('link', { name: /login with discord/i });
      if (await loginBtn.isVisible({ timeout: 5000 })) {
        await loginBtn.click();
      }
    } catch { /* đã đăng nhập rồi */ }

    // Điền thông tin đăng nhập Discord
    try {
      await page.getByLabel(/email or phone/i).waitFor({ timeout: 10_000 });
      await page.getByLabel(/email or phone/i).fill(discordEmail);
      await page.getByLabel(/password/i).fill(discordPassword);
      await page.getByRole('button', { name: /log in/i }).click();
      console.log('Đã gửi thông tin đăng nhập, chờ xác thực...');
      // Chờ authorize Discord OAuth nếu xuất hiện
      try {
        const authBtn = page.getByRole('button', { name: /authoriz/i });
        await authBtn.waitFor({ timeout: 8000 });
        await authBtn.click();
      } catch { /* không cần authorize lại */ }
    } catch (err) {
      console.warn('Không tìm thấy form đăng nhập Discord (có thể đã đăng nhập):', (err as Error).message);
    }

    // Chờ trang ROKStats load đúng kingdom
    try {
      await page.getByRole('heading', { name: new RegExp(`All Governors\\s*-\\s*KD\\s*#${kingdom}`) }).waitFor({ timeout: 30_000 });
      console.log(`Đăng nhập thành công, đã vào KD #${kingdom}.`);
    } catch {
      console.warn(`Chưa chọn Kingdom ${kingdom}. Mở trình duyệt để kiểm tra.`);
    }
  } else {
    // Chế độ thủ công như cũ
    console.log(`Đăng nhập ROKStats bằng Discord, sau đó chọn Kingdom ${kingdom}.`);
    console.log(`Khi trang hiện "All Governors - KD #${kingdom}", quay lại cửa sổ này và nhấn Enter.`);
    const input = createInterface({ input: process.stdin, output: process.stdout });
    await input.question('Nhấn Enter sau khi đăng nhập xong...');
    input.close();
  }
} finally {
  await context.close().catch(() => {});
}
const result = await syncOnce();
console.log(`Đã xác nhận phiên đăng nhập: xuất thành công ${result.rows} thống đốc KD ${kingdom}.`);
