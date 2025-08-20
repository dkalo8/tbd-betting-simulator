import 'dotenv/config';
import mongoose from 'mongoose';
import Game from '../src/models/Game.js';
import { fetchScoresForSport } from '../api/theOddsAPI.js';
import { filterAllowedLeagueKeys } from '../utilities/leagueTitles.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function buildSportKeys(daysFrom) {
  const since = new Date(Date.now() - Number(daysFrom) * 864e5);

  // 1) Discover league keys present in DB in window
  const leagueKeysRaw = await Game.distinct('league', {
    league: { $exists: true, $ne: '' },
    startTime: { $gte: since },
  });

  // 2) Keep only allowed (soccer map + all ATP/WTA)
  const leagueKeys = filterAllowedLeagueKeys(leagueKeysRaw || []);

  // 3) Add NBA/NFL only if they exist in the window
  const [hasNBA, hasNFL] = await Promise.all([
    Game.exists({ sport: 'NBA', startTime: { $gte: since } }),
    Game.exists({ sport: 'NFL', startTime: { $gte: since } }),
  ]);

  const topLevel = [
    ...(hasNBA ? ['basketball_nba'] : []),
    ...(hasNFL ? ['americanfootball_nfl'] : []),
  ];

  return [...topLevel, ...leagueKeys];
}

function arg(name, def) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  if (!a) return def;
  const v = a.split('=')[1];
  return v === undefined ? def : v;
}

const parseCsv = (s = '') => s.split(',').map(x => x.trim()).filter(Boolean);

async function main() {
  const DB_NAME = process.env.SPORTS_SIMS_DB || 'sports_sims_db';
  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
  console.log('[scores] connected to', mongoose.connection.host, mongoose.connection.name);
  console.log('[scores] MongoDB connected');

  const daysFrom = Number(arg('daysFrom', 2));

  // If user passed --sports, honor it; else auto-discover from DB (and allowlist)
  const cli = arg('sports', '');
  let sports = cli ? parseCsv(cli) : await buildSportKeys(daysFrom);

  // Optional CLI/env filters
  const include = parseCsv(arg('include', process.env.SCORES_INCLUDE || ''));
  const exclude = parseCsv(arg('exclude', process.env.SCORES_EXCLUDE || ''));

  if (include.length) {
    const allow = new Set(include);
    sports = sports.filter(k => allow.has(k));
  }
  if (exclude.length) {
    const deny = new Set(exclude);
    sports = sports.filter(k => !deny.has(k));
  }

  if (!sports.length) {
    console.log('[scores] No sport keys to fetch after filtering; nothing to do.');
    await mongoose.disconnect();
    return;
  }

  await Game.collection.createIndex({ 'ext.id': 1 }, { name: 'ext_id_idx' }).catch(() => {});
  console.log('[scores] using sport keys:', sports);

  let totalMatched = 0;

  for (const sportKey of sports) {
    console.log(`[scores] Fetching ${sportKey} (daysFrom=${daysFrom})…`);
    const scores = await fetchScoresForSport(sportKey, { daysFrom });
    if (!scores.length) { console.log(`[scores] ${sportKey}: none`); continue; }

    const counts = scores.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      if (s.completed) acc.completed = (acc.completed || 0) + 1;
      return acc;
    }, {});
    console.log(`[scores] ${sportKey}: API statuses`, counts);

    let matchedThisSport = 0;

    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday.getTime() + 864e5);

    for (const s of scores) {
      const $set = {
        status: s.status,
        completed: s.completed,
        'score.home': s.score.home ?? null,
        'score.away': s.score.away ?? null,
        lastScoreUpdate: new Date(s.lastScoreUpdate),
        lastUpdated: new Date(),
      };

      // 1) Try provider id
      let r = await Game.updateOne({ 'ext.id': s.id }, { $set });
      if (r.matchedCount) { matchedThisSport += r.matchedCount; continue; }

      // 2) Fallback: league + teams + ±24h (tennis tournaments can drift)
      const t = new Date(s.commence_time);
      const t0 = new Date(t.getTime() - 24 * 3600_000);
      const t1 = new Date(t.getTime() + 24 * 3600_000);
      r = await Game.updateOne(
        { league: s.sport_key, home: s.home_team, away: s.away_team, startTime: { $gte: t0, $lte: t1 } },
        { $set }
      );
      if (r.matchedCount) { matchedThisSport += r.matchedCount; continue; }

      // 3) Create a minimal doc **only if the match is TODAY**
      if (t >= startOfToday && t < startOfTomorrow) {
        const sport =
          s.sport_key.startsWith('soccer_') ? 'Soccer' :
          s.sport_key.startsWith('tennis_') ? 'Tennis' :
          (s.sport_key === 'basketball_nba' ? 'NBA' :
          s.sport_key === 'americanfootball_nfl' ? 'NFL' : null);
        if (!sport) continue;

        await Game.updateOne(
          { 'ext.provider': 'oddsapi', 'ext.id': s.id },
          {
            $setOnInsert: {
              sport,
              league: s.sport_key,
              leagueTitle: s.sport_key, // or prettyLeagueTitle(s.sport_key)
              home: s.home_team,
              away: s.away_team,
              startTime: t,
              ext: { provider: 'oddsapi', id: s.id },
            },
            $set
          },
          { upsert: true }
        );
        matchedThisSport += 1;
      }
    }

    console.log(`[scores] ${sportKey}: matched = ${matchedThisSport}`)
    totalMatched += matchedThisSport;
    await sleep(350); // small pause between sport keys
  }

  console.log(`[scores] Done. Total matched = ${totalMatched}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('[scores] ERROR', e?.response?.data || e);
  process.exit(1);
});