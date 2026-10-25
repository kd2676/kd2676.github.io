import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const kingdom = process.env.ROKSTATS_KINGDOM || '2676';
export const profileDir = path.join(root, '.private', 'rokstats-profile');
export const dataFile = path.join(root, 'data', 'current.json');
export const publicDataFile = path.join(root, 'public', 'governors.json');
export const intervalMinutes = Math.max(5, Number(process.env.SYNC_INTERVAL_MINUTES) || 60);
export const port = Number(process.env.PORT) || 2676;
export const browserChannel = process.env.BROWSER_CHANNEL?.trim() || undefined;
export const loginBrowserChannel = process.env.LOGIN_BROWSER_CHANNEL?.trim() || browserChannel;
