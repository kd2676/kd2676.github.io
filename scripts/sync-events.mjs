import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const session = process.env.ROKSTATS_SESSION?.trim();
const kingdom = Number(process.env.ROKSTATS_KINGDOM || '2676');

const headers = {
  'Cookie': 'connect.sid=' + session,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMgeDates(openAt, endAt) {
  if (!openAt) return '';
  const s = new Date(openAt);
  const e = endAt ? new Date(endAt) : new Date(s.getTime() + 6 * 86400000);
  return `${months[s.getUTCMonth()]} ${s.getUTCDate()}, ${s.getUTCFullYear()} — ${months[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
}

function parseScore(val) {
  if (!val) return 0;
  try {
    const b = BigInt(val);
    const n = BigInt(1e9);
    return Number(b / n);
  } catch {
    return Number(val) || 0;
  }
}

async function saveAtomic(filename, value) {
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, value, 'utf8');
}

async function saveToAll(relPath, content) {
  const targets = [
    path.resolve('public', relPath),
    path.resolve('data', relPath),
    path.resolve('dist', relPath),
  ];
  for (const t of targets) {
    try {
      await saveAtomic(t, content);
    } catch {
      // ignore if folder not present
    }
  }
}

export async function fetchAndSyncMge(requestHeaders = headers) {
  console.log('⚡ Đang đồng bộ 8 kỳ MGE gần nhất từ ROKStats API...');
  const res = await fetch(`https://app.rokstats.online/api/kingdoms/${kingdom}/mge/events?limit=30&historyScope=kingdom`, { headers: requestHeaders });
  if (!res.ok) throw new Error('Failed to fetch MGE events: ' + res.status);
  const json = await res.json();
  const rawEvents = json.data || [];

  // Sort events newest first by openAt
  rawEvents.sort((a, b) => new Date(b.openAt).getTime() - new Date(a.openAt).getTime());

  // Sliding window: keep strictly 8 most recent events, dropping the oldest
  const top8 = rawEvents.slice(0, 8);

  const processedEvents = [];
  for (const ev of top8) {
    const sDate = new Date(ev.openAt);
    const dateLabel = `${months[sDate.getUTCMonth()]} ${sDate.getUTCDate()}, ${sDate.getUTCFullYear()}`;
    const title = ev.showEpisode ? `${dateLabel} · #${ev.showEpisode}` : dateLabel;

    let status = 'finished';
    if (ev.lifecycle === 'scheduled') status = 'upcoming';
    else if (ev.lifecycle === 'active') status = 'active';
    else if (ev.lifecycle === 'closed') status = 'closed';

    let rankings = [];
    if (status !== 'upcoming') {
      try {
        const view = ['finished', 'closed'].includes(ev.lifecycle) ? 'final' : 'latest';
        const rankRes = await fetch(`https://app.rokstats.online/api/kingdoms/${kingdom}/mge/events/${ev.eventUid}/rankings?board=overall&view=${view}&limit=10`, { headers: requestHeaders });
        if (rankRes.ok) {
          const rankJson = await rankRes.json();
          const rows = rankJson.data?.rows || rankJson.data?.entries || [];
          // Strictly Top 10
          rankings = rows.slice(0, 10).map((r, idx) => {
            let avatarUrl = '';
            let avatarFrameUrl = '';
            try {
              if (r.profile?.avatar) {
                const av = typeof r.profile.avatar === 'string' ? JSON.parse(r.profile.avatar) : r.profile.avatar;
                avatarUrl = av.avatar || av.url || '';
                avatarFrameUrl = av.avatarFrame || av.frame || '';
              }
            } catch {}

            return {
              rank: r.rank || (idx + 1),
              governorId: String(r.governorId || r.playerId || ''),
              name: r.profile?.name || r.name || 'Unknown',
              score: Number(r.points || r.rawScore || r.score || 0),
              allianceTag: r.profile?.abbr || '',
              allianceName: r.profile?.aName || '',
              ch: r.profile?.townCenterLevel || 25,
              avatar: avatarUrl,
              avatarFrame: avatarFrameUrl
            };
          });
        }
      } catch (err) {
        console.warn(`Error fetching rankings for ${ev.eventUid}:`, err.message);
      }
    }

    const avail = (ev.availableCommanders?.items || []).map(c => c.name).filter(Boolean);
    const reward = (ev.observedRewardCommanders?.items || []).map(c => c.name).filter(Boolean);
    const commanders = avail.length > 0 ? avail.slice(0, 3) : reward.slice(0, 3);

    processedEvents.push({
      id: ev.eventUid,
      edition: ev.showEpisode || ev.episode || null,
      title,
      dateLabel,
      dates: formatMgeDates(ev.openAt, ev.endAt),
      status,
      commanders,
      rankings
    });
  }

  const payload = JSON.stringify({
    updatedAt: new Date().toISOString(),
    events: processedEvents
  }, null, 2);

  await saveToAll('mge-events.json', payload);
  console.log(`✅ Đã lưu ${processedEvents.length} kỳ MGE gần nhất (Top 10 mỗi kỳ)!`);
  return processedEvents;
}

export async function fetchAndSyncZenith(requestHeaders = headers) {
  console.log('⚡ Đang đồng bộ 8 mùa Zenith gần nhất từ ROKStats API...');
  const res = await fetch('https://app.rokstats.online/api/events/zenith/list', { headers: requestHeaders });
  if (!res.ok) throw new Error('Failed to fetch Zenith list: ' + res.status);
  const json = await res.json();
  const rawTasks = json.data?.tasks || [];

  // Sort newest first
  rawTasks.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  // Sliding window: keep strictly 8 most recent events, dropping the oldest
  const top8 = rawTasks.slice(0, 8);

  const processedEvents = [];
  for (const t of top8) {
    let districtId = 202; // default continent for 2676
    try {
      const kdRes = await fetch(`https://app.rokstats.online/api/events/zenith/kingdoms?taskId=${t.taskId}`, { headers: requestHeaders });
      if (kdRes.ok) {
        const kdJson = await kdRes.json();
        const districts = kdJson.data?.districts || [];
        const found = districts.find(d => d.kingdoms?.some(k => k.kingdom === kingdom));
        if (found) districtId = found.districtId;
      }
    } catch {}

    let kdRankings = [];
    let continentRankings = [];
    try {
      const rRes = await fetch(`https://app.rokstats.online/api/events/zenith/ranking?taskId=${t.taskId}&districtId=${districtId}`, { headers: requestHeaders });
      if (rRes.ok) {
        const rJson = await rRes.json();
        const allEntries = Array.isArray(rJson.data) ? rJson.data : [];

        // Filter for kingdom 2676 and take Top 10
        const kdEntries = allEntries.filter(e => (e.serverId + 1000) === kingdom || e.kingdom === kingdom);
        kdRankings = kdEntries.slice(0, 10).map((e, idx) => ({
          rank: idx + 1,
          continentRank: e.rank,
          governorId: String(e.playerId),
          name: e.name,
          score: parseScore(e.score),
          kingdom: (e.serverId + 1000) || kingdom,
          allianceTag: e.guildAbbr || '',
          allianceName: e.guildName || '',
          ch: e.cityHallLevel || 25,
          avatar: e.avatar?.url || '',
          avatarFrame: e.avatar?.frame || ''
        }));

        continentRankings = allEntries.slice(0, 10).map((e, idx) => ({
          rank: idx + 1,
          continentRank: e.rank,
          governorId: String(e.playerId),
          name: e.name,
          score: parseScore(e.score),
          kingdom: (e.serverId + 1000),
          allianceTag: e.guildAbbr || '',
          allianceName: e.guildName || '',
          ch: e.cityHallLevel || 25,
          avatar: e.avatar?.url || '',
          avatarFrame: e.avatar?.frame || ''
        }));
      }
    } catch (err) {
      console.warn(`Error fetching Zenith rankings for ${t.taskId}:`, err.message);
    }

    processedEvents.push({
      id: t.taskId,
      title: t.label,
      startDate: t.startDate,
      endDate: t.endDate,
      skin: {
        name: t.skin?.name || '',
        buff: (t.skin?.buffs || []).map(b => b.comment).join(', ') || '',
        img: t.skin?.img ? `https://app.rokstats.online${t.skin.img}` : ''
      },
      status: new Date(t.endDate).getTime() < Date.now() ? 'ended' : 'active',
      rankings: kdRankings,
      continentRankings
    });
  }

  const payload = JSON.stringify({
    updatedAt: new Date().toISOString(),
    events: processedEvents
  }, null, 2);

  await saveToAll('zenith-events.json', payload);
  console.log(`✅ Đã lưu ${processedEvents.length} mùa Zenith gần nhất (Top 10 mỗi kỳ)!`);
  return processedEvents;
}

async function run() {
  await fetchAndSyncMge();
  await fetchAndSyncZenith();
}

if (process.argv[1] && process.argv[1].endsWith('sync-events.mjs')) {
  run().catch(console.error);
}
