import 'dotenv/config';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const kingdom = process.env.ROKSTATS_KINGDOM || '2676';
const session = process.env.ROKSTATS_SESSION?.trim();

const STORY_MAP: Record<number, { codePrefix: string; name: string; cover: string }> = {
  1: { codePrefix: 'S', name: 'Endless War', cover: 'S1Endless-War.png' },
  2: { codePrefix: 'S', name: 'Distant Journey', cover: 'S2Distant-Journey.png' },
  3: { codePrefix: 'S', name: 'Light and Darkness', cover: 'S3Light-and-Darkness.png' },
  4: { codePrefix: 'C', name: 'Heroic Anthem', cover: 's4heroic_anthem_cover.png' },
  5: { codePrefix: 'C', name: 'Strife Of The Eight', cover: '' },
  9: { codePrefix: 'C', name: 'King Of The Nile', cover: 's9king_of_the_nile_cover.png' },
  10: { codePrefix: 'C', name: 'Siege of Orleans', cover: 's10siege_of_orleans_cover.png' },
  11: { codePrefix: 'C', name: 'Warriors Unbound', cover: 's11warriors_unbound_cover.png' },
  12: { codePrefix: 'C', name: 'Storm of Stratagems', cover: 's12storm_of_stratagems_cover.png' },
  14: { codePrefix: 'C', name: 'Tides of War', cover: 's14tides_of_war_cover.png' },
  15: { codePrefix: 'C', name: 'Alliance Invictus', cover: 's15alliance_invictus_cover.png' },
  16: { codePrefix: 'C', name: 'Keener Blades', cover: 's16keener_blades_cover.png' },
  18: { codePrefix: 'C', name: 'Shifting Gears', cover: '' },
  19: { codePrefix: 'C', name: 'King of All Britain', cover: 's19king_of_all_britain_cover.png' },
  20: { codePrefix: 'C', name: 'Song of Troy', cover: 's20song_of_troy_cover.png' },
  21: { codePrefix: 'C', name: 'Mighty Assembly', cover: 's21mighty_assembly_cover.png' },
};

function formatCompactNum(num?: number): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e9) {
    const v = (num / 1e9).toFixed(2);
    return v.endsWith('.00') ? `${(num / 1e9).toFixed(0)}B` : v.replace(/\.?0+$/, '') + 'B';
  }
  if (abs >= 1e6) {
    const v = (num / 1e6).toFixed(2);
    return v.endsWith('.00') ? `${(num / 1e6).toFixed(0)}M` : v.replace(/\.?0+$/, '') + 'M';
  }
  if (abs >= 1e3) {
    const v = (num / 1e3).toFixed(1);
    return v.endsWith('.0') ? `${(num / 1e3).toFixed(0)}K` : v + 'K';
  }
  return num.toLocaleString();
}

function formatDates(startIso?: string, endIso?: string) {
  if (!startIso) return { en: 'TBD', vi: 'Chưa xác định' };
  const s = new Date(startIso);
  const e = endIso ? new Date(endIso) : null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const startEn = `${months[s.getUTCMonth()]} ${s.getUTCDate()}, ${s.getUTCFullYear()}`;
  const startVi = `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)}/${s.getUTCFullYear()}`;
  
  if (!e) return { en: startEn, vi: startVi };
  
  const endEn = `${months[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  const endVi = `${pad(e.getUTCDate())}/${pad(e.getUTCMonth() + 1)}/${e.getUTCFullYear()}`;
  
  return {
    en: `${startEn} → ${endEn}`,
    vi: `${startVi} – ${endVi}`
  };
}

async function saveAtomic(filename: string, value: string) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temp = `${filename}.${process.pid}.tmp`;
  await writeFile(temp, value, 'utf8');
  await rename(temp, filename);
}

async function saveToAll(relPath: string, content: string) {
  const targets = [
    path.resolve('public', relPath),
    path.resolve('data', relPath),
    path.resolve('dist', relPath),
  ];
  for (const t of targets) {
    try {
      await saveAtomic(t, content);
    } catch {
      // ignore
    }
  }
}

export async function fetchAndBuildKvkData(headers: any, overviewApiData: any) {
  console.log('🔄 Đang đồng bộ KvK Performance & Dashboard cho Kingdom 2676...');
  
  // 1. Fetch seed-ranking kvk-performance
  const perfRes = await fetch(
    `https://app.rokstats.online/api/kingdoms/seed-ranking/kvk-performance?kingdoms=${kingdom}&limit=10&includeSelectionMeta=0`,
    { headers }
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const perfRows: any[] = perfRes?.byKingdom?.[kingdom]?.recentKvks || [];
  const activeLk = overviewApiData?.activeLostKingdom;
  const lostKingdoms: any[] = overviewApiData?.lostKingdoms || [];

  // Combine unique codes preserving order (active first, then recent past)
  const orderedCodes: number[] = [];
  if (activeLk?.code) orderedCodes.push(activeLk.code);
  for (const r of perfRows) {
    if (!orderedCodes.includes(r.lkCode)) orderedCodes.push(r.lkCode);
  }
  for (const l of lostKingdoms) {
    if (!orderedCodes.includes(l.code)) orderedCodes.push(l.code);
  }

  console.log(`Tìm thấy ${orderedCodes.length} mùa KvK của KD ${kingdom}:`, orderedCodes);

  const kvkList: any[] = [];

  for (const code of orderedCodes) {
    const perfMatch = perfRows.find(r => r.lkCode === code);
    const lkMatch = lostKingdoms.find(l => l.code === code) || (code === activeLk?.code ? activeLk : null);
    
    const storyId = Number(perfMatch?.storyId || lkMatch?.storyId || 4);
    const story = STORY_MAP[storyId] || { codePrefix: 'C', name: 'Lost Kingdom', cover: '' };
    const tier = lkMatch?.tier !== undefined && lkMatch?.tier !== null ? Number(lkMatch.tier) : 0;
    const tierBadge = tier === 1 ? 'S' : tier === 2 ? 'S+' : undefined;
    const isActive = code === activeLk?.code || lkMatch?.isActive === true;
    const openTime = perfMatch?.openTime || lkMatch?.openTime || '';
    const closeTime = perfMatch?.closeTime || lkMatch?.closeTime || '';
    const dateFormatted = formatDates(openTime, closeTime);

    // Fetch leaderboard for this KvK - FILTER STRICTLY FOR KINGDOM 2676 ONLY!
    let kdPlayers: any[] = [];
    try {
      const lbRes = await fetch(
        `https://app.rokstats.online/api/kvk/lost-kingdoms/${code}/kvk-leaderboard`,
        { headers }
      );
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        const allPlayers = lbData.data?.players || [];
        // STRICT FILTER FOR KINGDOM 2676 ONLY:
        kdPlayers = allPlayers
          .filter((p: any) => 
            String(p.kingdom) === kingdom || 
            String(p.playerServerId) === '1676' || 
            String(p.domain) === '1676'
          )
          .map((p: any) => ({
            playerId: p.playerId,
            name: p.playerName || '',
            allianceTag: p.guildAbbreviation || '',
            allianceName: p.guildName || '',
            killPoints: Number(p.killPoints) || 0,
            deathPoints: Number(p.deathPoints) || 0,
            healPoints: Number(p.healPoints) || 0,
            avatar: p.avatar?.url || '',
            avatarFrame: p.avatar?.frame || '',
            killPointsRank: Number(p.killPointsRank) || 0,
            deathPointsRank: Number(p.deathPointsRank) || 0,
            healPointsRank: Number(p.healPointsRank) || 0,
          }))
          .sort((a: any, b: any) => b.killPoints - a.killPoints);
      }
    } catch (e) {
      console.warn(`Không thể lấy leaderboard cho KvK ${code}:`, (e as Error).message);
    }

    const perfObj = perfMatch ? {
      kp: Number(perfMatch.kp) || 0,
      kpFormatted: formatCompactNum(perfMatch.kp),
      dead: Number(perfMatch.dead) || 0,
      deadFormatted: formatCompactNum(perfMatch.dead),
      t4t5kp: Number(perfMatch.t4t5kp) || 0,
      t4t5kpFormatted: formatCompactNum(perfMatch.t4t5kp),
      healed: Number(perfMatch.healed) || 0,
      healedFormatted: formatCompactNum(perfMatch.healed),
      acclaim: Number(perfMatch.acclaim) || 0,
      acclaimFormatted: formatCompactNum(perfMatch.acclaim),
      participants: Number(perfMatch.participantKingdoms || perfMatch.participants) || 0,
      trackedPlayers: Number(perfMatch.trackedPlayers) || kdPlayers.length,
      campNum: perfMatch.campNum || perfMatch.camp || 4,
      powerStart: perfMatch.powerStart,
      powerEnd: perfMatch.powerEnd,
      powerDiff: perfMatch.powerDiff,
    } : null;

    kvkList.push({
      code,
      codePrefix: story.codePrefix,
      formattedCode: `#${story.codePrefix}${code}`,
      season: perfMatch?.season || lkMatch?.season,
      tier,
      tierBadge,
      storyId,
      storyName: story.name,
      coverUrl: story.cover ? `https://app.rokstats.online/assets/media/game/kvk/covers/${story.cover}` : '',
      openTime,
      closeTime,
      datesEn: dateFormatted.en,
      datesVi: dateFormatted.vi,
      isActive,
      perf: perfObj,
      kdPlayersCount: kdPlayers.length,
      players: kdPlayers
    });

    console.log(`  ✓ KvK #${story.codePrefix}${code} (${story.name}): ${kdPlayers.length} thống đốc KD 2676`);
  }

  const payload = JSON.stringify({
    kingdom,
    updatedAt: new Date().toISOString(),
    totalKvks: kvkList.length,
    activeCode: activeLk?.code || 13315,
    kvks: kvkList
  }, null, 2);

  await saveToAll('kvk-performance.json', payload);
  console.log(`✅ Đã lưu dữ liệu 8 KvK của Kingdom ${kingdom} vào kvk-performance.json!`);
}

async function run() {
  if (!session) {
    console.error('Thiếu session');
    return;
  }
  const headers = {
    'Cookie': `connect.sid=${session}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };
  const overviewRes = await fetch(`https://app.rokstats.online/api/kingdoms/${kingdom}/overview`, { headers })
    .then(r => r.ok ? r.json() : null);
  await fetchAndBuildKvkData(headers, overviewRes?.data || overviewRes);
}

run().catch(console.error);
