import { parse } from 'csv-parse/sync';

export type Governor = {
  id: string; name: string; alliance: string; power: number; troopPower: number;
  killPoints: number; t4Kills: number; t5Kills: number; dead: number;
  ch?: number; snapshotTime?: string;
  avatar?: string;
  avatarFrame?: string;
  guildTag?: string;
  guildName?: string;
  guildKingdom?: number;
};
export type Dataset = { source: string; exportedAt: string; rows: Governor[] };
type CsvRow = Record<string, string>;
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const keys = {
  id: ['id', 'governorid', 'playerid', 'characterid', 'userid'],
  name: ['name', 'governor', 'governorname', 'nickname', 'player', 'playername'],
  alliance: ['alliance', 'alliancename', 'alliancetag', 'tag'],
  power: ['power', 'totalpower'],
  troopPower: ['trooppower'],
  killPoints: ['killpoints', 'killpoint', 'totalkp', 'kp'],
  t4Kills: ['t4kills', 't4kill', 't4', 'tier4kills'],
  t5Kills: ['t5kills', 't5kill', 't5', 'tier5kills'],
  dead: ['dead', 'deaths', 'deadtroops', 'death'],
  ch: ['ch', 'cityhall', 'cityhalllevel'],
  snapshotTime: ['scantime', 'snapshottime', 'snapshottimeutc', 'lastscan']
} as const;

function get(row: CsvRow, field: keyof typeof keys) {
  const match = Object.keys(row).find(key => (keys[field] as readonly string[]).includes(normalized(key)));
  return match ? String(row[match] ?? '').trim() : '';
}
function number(value: string) {
  const raw = value.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  if (!raw) return 0;
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, '')) || 0;
  if (raw.includes(',') && raw.includes('.')) return Number(raw.lastIndexOf(',') > raw.lastIndexOf('.') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '')) || 0;
  return Number(raw.replace(',', '.')) || 0;
}
function scanTime(value: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4]}+07:00` : value;
}

export function parseGovernorsCsv(csv: string): Dataset {
  const records = parse(csv.replace(/^\uFEFF/, ''), { columns: true, skip_empty_lines: true, relax_column_count: true, bom: true }) as CsvRow[];
  if (!records.length) throw new Error('CSV trống.');
  const headers = Object.keys(records[0]);
  for (const field of ['name', 'power'] as const) {
    if (!headers.some(key => (keys[field] as readonly string[]).includes(normalized(key)))) throw new Error(`CSV thiếu cột ${field}. Các cột nhận được: ${headers.join(', ')}`);
  }
  const rows = records.map(row => {
    const rawName = get(row, 'name');
    const rawId = get(row, 'id') || rawName.match(/\b\d{5,12}\b/)?.[0] || '';
    return {
      id: rawId,
      name: rawName.replace(new RegExp(`\\s*${rawId}$`), '').trim() || rawName,
      alliance: get(row, 'alliance'),
      power: number(get(row, 'power')),
      troopPower: number(get(row, 'troopPower')),
      killPoints: number(get(row, 'killPoints')),
      t4Kills: number(get(row, 't4Kills')),
      t5Kills: number(get(row, 't5Kills')),
      dead: number(get(row, 'dead')),
      ch: number(get(row, 'ch')),
      snapshotTime: scanTime(get(row, 'snapshotTime'))
    } satisfies Governor;
  }).filter(row => row.id && row.name);
  if (rows.length < 50) throw new Error(`Bản xuất chỉ có ${rows.length} thống đốc; giữ dữ liệu cũ để tránh cập nhật nhầm.`);
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('CSV có ID thống đốc trùng lặp; giữ dữ liệu cũ.');
  return { source: 'ROKSTATS All Governors - KD 2676 CSV', exportedAt: new Date().toISOString(), rows };
}
