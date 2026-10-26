import { chromium } from 'playwright';
import path from 'node:path';

async function main() {
  const profileDir = path.resolve('.private/rokstats-profile');
  try {
    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      channel: 'msedge'
    });
    const cookies = await context.cookies('https://app.rokstats.online');
    await context.close();

    const sid = cookies.find(c => c.name === 'connect.sid')?.value;
    if (sid) {
      console.log('\n=================== ROKSTATS SESSION COOKIE ===================');
      console.log(`connect.sid=${sid}`);
      console.log('===============================================================\n');
      console.log('Ví dụ lệnh curl kiểm tra:');
      console.log(`curl.exe -s "https://app.rokstats.online/api/kingdoms/2676/overview" -H "Cookie: connect.sid=${sid}"\n`);
    } else {
      console.error('Không tìm thấy cookie connect.sid trong profile. Hãy chạy `npm run login` trước.');
    }
  } catch (err) {
    console.error('Lỗi khi đọc cookie:', (err as Error).message);
  }
}

main();
