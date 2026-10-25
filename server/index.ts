import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { root, dataFile, intervalMinutes, port } from './config.ts';
import { syncOnce } from './sync.ts';

const dist = path.join(root, 'dist');
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const status: { lastAttempt?: string; lastSuccess?: string; error?: string | null; running: boolean } = { running: false };
async function update() {
  if (status.running) return;
  status.running = true; status.lastAttempt = new Date().toISOString(); status.error = null;
  try {
    const result = await syncOnce();
    status.lastSuccess = result.exportedAt;
    console.log(`ROKStats: ${result.rows} thống đốc, ${result.exportedAt}`);
  } catch (error) {
    status.error = (error as Error).message;
    console.error(`Đồng bộ thất bại: ${status.error}`);
  } finally { status.running = false; }
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', `http://127.0.0.1:${port}`).pathname;
  if (pathname === '/api/status') {
    response.writeHead(200, { 'content-type': types['.json'], 'cache-control': 'no-store' });
    response.end(JSON.stringify(status)); return;
  }
  if (pathname === '/api/governors') {
    try {
      const body = await readFile(dataFile);
      response.writeHead(200, { 'content-type': types['.json'], 'cache-control': 'no-store' });
      response.end(body); return;
    } catch { response.writeHead(503); response.end('No synchronized data yet'); return; }
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
  let file = path.resolve(dist, `.${decodeURIComponent(pathname)}`);
  if (!file.startsWith(dist + path.sep) && file !== dist) { response.writeHead(403); response.end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch { file = path.join(dist, 'index.html'); }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=300' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => {
  console.log(`Trang Kingdom 2676: http://127.0.0.1:${port}`);
  void update();
  setInterval(() => void update(), intervalMinutes * 60_000);
});
