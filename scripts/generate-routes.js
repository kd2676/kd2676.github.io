import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const indexHtmlPath = path.join(distDir, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Copy 404.html as general fallback
fs.writeFileSync(path.join(distDir, '404.html'), indexHtmlContent, 'utf8');

// 2. All application routes that users might access directly or refresh (F5)
const routes = [
  'overview',
  'alliances',
  'Governors',
  'governors',
  'data',
  'Data Source',
  'Data%20Source',
  'kvk',
  'KvK Performance',
  'KvK%20Performance',
  'kvk-performance',
  'kvk/dashboard',
  'kvk/dashboard/C13315',
  'kvk/dashboard/C13196',
  'kvk/dashboard/C13085',
  'kvk/dashboard/C12989',
  'kvk/dashboard/C12851',
  'kvk/dashboard/C12743',
  'kvk/dashboard/C12625',
  'kvk/dashboard/C12487',
  'mge',
  'MGE',
  'zenith',
  'Zenith',
  'Zenith of Power',
  'Zenith%20of%20Power',
  'recruitment',
  'Recruitment',
  'tuyendung',
  'admin',
  'Admin',
  'admin/recruitment',
  'admin/config',
  'admin/info',
  'admin/users',
  'admin/password',
];

for (const route of routes) {
  // Folder route: /<route>/index.html (GitHub Pages serves with 200 OK)
  const routeFolder = path.join(distDir, route);
  fs.mkdirSync(routeFolder, { recursive: true });
  fs.writeFileSync(path.join(routeFolder, 'index.html'), indexHtmlContent, 'utf8');

  // File route: /<route>.html (Alternative matching)
  fs.writeFileSync(path.join(distDir, `${route}.html`), indexHtmlContent, 'utf8');
}

console.log(`✅ Đã tạo các trang tĩnh cho ${routes.length} routes. Khi F5 trên GitHub Pages sẽ trả về HTTP 200 OK thay vì 404!`);
