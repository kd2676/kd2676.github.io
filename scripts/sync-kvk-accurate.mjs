import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const kingdom = process.env.ROKSTATS_KINGDOM || '2676';
const session = process.env.ROKSTATS_SESSION?.trim();
const headers = {
  'Cookie': `connect.sid=${session}`,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

const STORY_MAP = {
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

function formatCompactNum(num) {
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

function formatDates(startIso, endIso) {
  if (!startIso) return { en: 'TBD', vi: 'Chưa xác định' };
  const s = new Date(startIso);
  const e = endIso ? new Date(endIso) : null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  
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

async function main() {
  console.log('🔄 Đang đồng bộ KvK Performance với dữ liệu chính xác từ ROKStats...');

  // 1. Fetch seed-ranking kvk-performance
  const perfRes = await fetch(
    `https://app.rokstats.online/api/kingdoms/seed-ranking/kvk-performance?kingdoms=${kingdom}&limit=10&includeSelectionMeta=0`,
    { headers }
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const perfRows = perfRes?.byKingdom?.[kingdom]?.recentKvks || [];

  // 2. Fetch overview to get lostKingdoms list
  const overviewRes = await fetch(
    `https://app.rokstats.online/api/kingdoms/${kingdom}/overview`,
    { headers }
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const activeLk = overviewRes?.data?.activeLostKingdom;
  const lostKingdoms = overviewRes?.data?.lostKingdoms || [];

  const orderedCodes = [];
  if (activeLk?.code) orderedCodes.push(activeLk.code);
  for (const r of perfRows) {
    if (!orderedCodes.includes(r.lkCode)) orderedCodes.push(r.lkCode);
  }
  for (const l of lostKingdoms) {
    if (!orderedCodes.includes(l.code)) orderedCodes.push(l.code);
  }

  console.log(`Tìm thấy ${orderedCodes.length} mùa KvK của KD ${kingdom}:`, orderedCodes);

  const kvkList = [];

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

    let kdPlayers = [];
    let domainData = null;

    // Fetch dashboard data
    try {
      const dashRes = await fetch(
        `https://app.rokstats.online/api/kvk/lost-kingdoms/${code}/dashboard`,
        { headers }
      );
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        const allPlayers = dashData.stats?.players || [];
        domainData = dashData.stats?.domainStats?.[1676] || dashData.stats?.domainStats?.['1676'] || null;

        // Rank all players across Lost Kingdom by DKP (totalPoints)
        const sortedAll = [...allPlayers].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        const rankMap = new Map();
        sortedAll.forEach((p, idx) => {
          rankMap.set(p.playerId, idx + 1);
        });

        // Filter STRICTLY for Kingdom 2676 (domain 1676 or kingdom 2676)
        const filteredKd = allPlayers.filter(p =>
          p.domain === 1676 ||
          p.kingdom === 2676 ||
          String(p.domain) === '1676' ||
          String(p.playerServerId) === '1676'
        );

        // Sort KD 2676 players by killPointsDiff descending (or totalPoints / KP)
        filteredKd.sort((a, b) => {
          const kpDiffB = b.killPointsDiff !== undefined ? b.killPointsDiff : (b.killPoints || 0);
          const kpDiffA = a.killPointsDiff !== undefined ? a.killPointsDiff : (a.killPoints || 0);
          if (kpDiffB !== kpDiffA) return kpDiffB - kpDiffA;
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        });

        kdPlayers = filteredKd.map((p, idx) => {
          const overallRank = rankMap.get(p.playerId) || (idx + 1);
          const kpDiff = p.killPointsDiff !== undefined ? Number(p.killPointsDiff) : Number(p.killPoints) || 0;
          const deadDiff = p.deadDiff !== undefined ? Number(p.deadDiff) : Number(p.dead) || 0;
          const healedDiff = p.troopsHealedDiff !== undefined ? Number(p.troopsHealedDiff) : Number(p.troopsHealed) || 0;
          const lossSum = (healedDiff + deadDiff) * 20;
          const tradesRatio = (kpDiff > 0 && lossSum > 0) ? Math.floor((kpDiff / lossSum) * 100) : 0;

          return {
            playerId: p.playerId,
            name: p.name || p.playerName || '',
            allianceTag: p.guildAbbr || p.guildAbbreviation || '',
            allianceName: p.guildName || '',
            campNum: p.campNum,
            overallRank,
            kdRank: idx + 1,
            power: Number(p.power) || 0,
            powerDiff: Number(p.powerDiff) || 0,
            killPoints: Number(p.killPoints) || 0,
            killPointsDiff: kpDiff,
            dead: Number(p.dead) || 0,
            deadDiff: deadDiff,
            t4: Number(p.t4) || 0,
            t4Diff: Number(p.t4Diff) || 0,
            t5: Number(p.t5) || 0,
            t5Diff: Number(p.t5Diff) || 0,
            troopsHealed: Number(p.troopsHealed) || 0,
            troopsHealedDiff: healedDiff,
            acclaim: Number(p.acclaim || p.acclaimDiff) || 0,
            totalPoints: Number(p.totalPoints) || 0,
            trades: tradesRatio,
            avatar: p.avatar?.url || '',
            avatarFrame: p.avatar?.frame || '',
          };
        });
      }
    } catch (e) {
      console.warn(`Không thể lấy dashboard cho KvK ${code}:`, e.message);
    }

    // Build perf object
    const perfKp = domainData?.killPoints !== undefined ? Number(domainData.killPoints) : Number(perfMatch?.kp) || 0;
    const perfDead = domainData?.dead !== undefined ? Number(domainData.dead) : Number(perfMatch?.dead) || 0;
    const perfHealed = domainData?.troopsHealed !== undefined ? Number(domainData.troopsHealed) : Number(perfMatch?.healed) || 0;
    const perfT4T5 = (domainData?.t4 && domainData?.t5)
      ? (Number(domainData.t4) * 20 + Number(domainData.t5) * 100)
      : Number(perfMatch?.t4t5kp) || 0;
    const perfAcclaim = domainData?.acclaim !== undefined ? Number(domainData.acclaim) : Number(perfMatch?.acclaim) || 0;

    const perfObj = {
      kp: perfKp,
      kpFormatted: formatCompactNum(perfKp),
      dead: perfDead,
      deadFormatted: formatCompactNum(perfDead),
      t4t5kp: perfT4T5,
      t4t5kpFormatted: formatCompactNum(perfT4T5),
      healed: perfHealed,
      healedFormatted: formatCompactNum(perfHealed),
      acclaim: perfAcclaim,
      acclaimFormatted: formatCompactNum(perfAcclaim),
      participants: Number(perfMatch?.participantKingdoms || perfMatch?.participants) || 0,
      trackedPlayers: kdPlayers.length,
      campNum: perfMatch?.campNum || perfMatch?.camp || 4,
    };

    kvkList.push({
      code,
      codePrefix: story.codePrefix,
      formattedCode: `#${story.codePrefix}${code}`,
      season: perfMatch?.season || lkMatch?.season,
      tier,
      tierBadge,
      storyId,
      storyName: story.name,
      coverUrl: story.cover ? `/covers/${story.cover}` : '',
      openTime,
      closeTime,
      datesEn: dateFormatted.en,
      datesVi: dateFormatted.vi,
      isActive,
      perf: perfObj,
      kdPlayersCount: kdPlayers.length,
      players: kdPlayers
    });

    console.log(`  ✓ KvK #${story.codePrefix}${code} (${story.name}): ${kdPlayers.length} thống đốc KD 2676, cover: ${story.cover}`);
  }

  const payload = JSON.stringify({
    kingdom,
    updatedAt: new Date().toISOString(),
    totalKvks: kvkList.length,
    activeCode: activeLk?.code || 13315,
    kvks: kvkList
  }, null, 2);

  const targets = [
    path.resolve('public', 'kvk-performance.json'),
    path.resolve('data', 'kvk-performance.json'),
    path.resolve('dist', 'kvk-performance.json'),
  ];
  for (const t of targets) {
    try {
      fs.writeFileSync(t, payload, 'utf8');
      console.log(`  ✓ Đã ghi ${t}`);
    } catch (e) {
      console.warn(`Lỗi ghi ${t}:`, e.message);
    }
  }

  console.log(`✅ Hoàn thành cập nhật KvK Performance data!`);
}

main().catch(console.error);
