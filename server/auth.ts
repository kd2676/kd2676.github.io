import 'dotenv/config';
import type { Page } from 'playwright';

export async function ensureAuthenticated(page: Page, kingdom: string) {
  const discordEmail = process.env.DISCORD_EMAIL?.trim();
  const discordPassword = process.env.DISCORD_PASSWORD?.trim();

  // 1. Kiểm tra xem đã ở trang vương quốc chưa
  try {
    const heading = page.getByRole('heading', { name: new RegExp(`All Governors\\s*-\\s*KD\\s*#${kingdom}`, 'i') });
    if (await heading.isVisible({ timeout: 5000 })) {
      return; // Đã đăng nhập và đang ở đúng KD
    }
  } catch {
    // Chưa thấy heading, tiếp tục kiểm tra login
  }

  // 2. Nếu có credentials trong .env -> Tự động đăng nhập
  if (discordEmail && discordPassword) {
    console.log('🔄 Đang tự động đăng nhập Discord từ thông tin trong .env...');
    
    // Tìm và nhấn nút Login với Discord nếu đang ở landing/login của ROKStats
    try {
      const loginBtn = page.getByRole('link', { name: /login with discord/i });
      if (await loginBtn.isVisible({ timeout: 4000 })) {
        await loginBtn.click();
      }
    } catch {
      // Có thể đã chuyển hướng sang trang Discord
    }

    // Điền form đăng nhập Discord (nếu xuất hiện)
    try {
      const emailField = page.getByLabel(/email or phone/i);
      const isDiscordForm = await emailField.isVisible({ timeout: 8000 }).catch(() => false);
      
      if (isDiscordForm) {
        await emailField.fill(discordEmail);
        const passField = page.getByLabel(/password/i);
        await passField.fill(discordPassword);
        await page.getByRole('button', { name: /log in/i }).click();
        console.log('📨 Đã gửi thông tin đăng nhập Discord...');
      }

      // Xử lý nút Authorize OAuth của Discord nếu có
      try {
        const authBtn = page.getByRole('button', { name: /authoriz/i });
        if (await authBtn.isVisible({ timeout: 6000 })) {
          await authBtn.click();
          console.log('✅ Đã chấp thuận quyền truy cập ROKStats.');
        }
      } catch {
        // Không có prompt authorize
      }
    } catch (err) {
      console.warn('Lưu ý khi điền form Discord:', (err as Error).message);
    }

    // Điều hướng về governors nếu chưa về
    if (!page.url().includes('rokstats.online/governors')) {
      await page.goto('https://app.rokstats.online/governors', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }

    // Đợi kiểm tra heading KD
    try {
      await page.getByRole('heading', { name: new RegExp(`All Governors\\s*-\\s*KD\\s*#${kingdom}`, 'i') }).waitFor({ timeout: 25_000 });
      console.log(`🎉 Đăng nhập và vào KD #${kingdom} thành công!`);
      return;
    } catch {
      throw new Error(`Đã đăng nhập nhưng không tìm thấy dữ liệu KD #${kingdom}. Hãy kiểm tra tài khoản của bạn có quyền xem Kingdom ${kingdom} không.`);
    }
  }

  // 3. Nếu không có credentials trong .env
  throw new Error(`Chưa đăng nhập ROKStats. Hãy thêm DISCORD_EMAIL và DISCORD_PASSWORD vào file .env để tự động đăng nhập, hoặc chạy "npm run login".`);
}
