import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/db.js';
import Game from '../src/models/Game.js';
import { listSports, fetchOddsForSport } from '../api/theOddsAPI.js';
import { isAllowedLeagueKey, prettyLeagueTitle } from '../utilities/leagueTitles.js';

const BOOKMAKER = process.env.ODDS_BOOKMAKER || "";
const RAW_KEYS  = (process.env.ODDS_SPORT_KEYS || "basketball_nba,americanfootball_nfl,soccer_,tennis_")
  .split(",").map(s => s.trim()).filter(Boolean);

let SPORT_INFO = new Map(); // key -> { title, group }

// Group mapping for UI enum
function mapSportGroup(sportKey) {
  if (sportKey.startsWith('soccer_')) return 'Soccer';
  if (sportKey.startsWith('tennis_atp_')) return 'Tennis';
  if (sportKey.startsWith('tennis_wta_')) return 'Tennis';
  if (sportKey === 'basketball_nba') return 'NBA';
  if (sportKey === 'americanfootball_nfl') return 'NFL';
  return null;
}

async function buildSportInfo() {
    const sports = await listSports(true);
    SPORT_INFO = new Map(sports.map(s => [s.key, { title: s.title, group: s.group }]));
    return sports;
}

// Small helpers
const median = (xs) => {
  const a = xs.slice().sort((p, q) => p - q);
  const m = Math.floor(a.length/2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

// Throttle to avoid too frequent API requests
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Consensus or single-book extraction
function extractMoneyline(event) {
  const books = event.bookmakers || [];
  if (!books.length) return null;

  // Prefer a specific bookmaker if configured
  if (BOOKMAKER) {
    const book = books.find(b => b.key === BOOKMAKER);
    if (book) {
      const ml = book.markets?.find(m => m.key === 'h2h');
      const odds_home = ml?.outcomes?.find(odds => odds.name === event.home_team);
      const odds_away = ml?.outcomes?.find(odds => odds.name === event.away_team);
      if (odds_home?.price != null && odds_away?.price != null) {
        return { homeML: Number(odds_home.price), awayML: Number(odds_away.price) };
      }
    }
  }

  // Compute consensus (median) across all books
  const homePrices = [];
  const awayPrices = [];
  for (const b of books) {
    const ml = b.markets?.find(m => m.key === 'h2h');
    const odds_home = ml?.outcomes?.find(odds => odds.name === event.home_team);
    const odds_away = ml?.outcomes?.find(odds => odds.name === event.away_team);
    if (odds_home?.price != null) homePrices.push(Number(odds_home.price));
    if (odds_away?.price != null) awayPrices.push(Number(odds_away.price));
  }
  if (!homePrices.length || !awayPrices.length) return null;

  return {
    homeML: Math.round(median(homePrices)),
    awayML: Math.round(median(awayPrices)),
  };
}

// Resolve concrete sport keys from env (supports prefixes like 'soccer_'/'tennis_')
async function resolveSportKeys() {
  const sports = await buildSportInfo();
  const keys = new Set();

  for (const token of RAW_KEYS) {
    if (token.endsWith('_')) { // treat as prefix
        for (const s of sports) {
            if (!s.key.startsWith(token)) continue;
            // Keep NBA/NFL (top-level keys), otherwise must pass allowlist
            const keep = (s.key === 'basketball_nba' 
                       || s.key === 'americanfootball_nfl' 
                       || isAllowedLeagueKey(s.key));
            if (keep) keys.add(s.key);
        }
    } else {
        // Exact key; if it's soccer and not whitelisted, skip it
        if ((token.startsWith('soccer_') 
          || token.startsWith('tennis_')) 
          && !isAllowedLeagueKey(token)) continue;
        keys.add(token);
    }
  }
  return Array.from(keys);
}

async function upsertFromSportKey(sportKey) {
  const events = await fetchOddsForSport(sportKey);
  const info = SPORT_INFO.get(sportKey) || {};
  let n = 0;

  for (const ev of events) {
    const odds = extractMoneyline(ev);
    if (!odds) continue; // skip if no ML

    const leagueTitle = info.title || prettyLeagueTitle(sportKey);

    const doc = {
      sport: mapSportGroup(sportKey),
      league: sportKey,
      leagueTitle,
      leagueGroup: info.group || '',
      home: ev.home_team,
      away: ev.away_team,
      startTime: new Date(ev.commence_time),
      marketOdds: { homeML: odds.homeML, awayML: odds.awayML },
      ext: { provider: 'oddsapi', id: ev.id },
      lastUpdated: new Date()
    };

    if (!doc.sport) continue; // unknown mapping -> skip

    await Game.updateOne(
      { 'ext.provider': 'oddsapi', 'ext.id': ev.id },
      { $set: doc },
      { upsert: true }
    );
    n++;
  }
  return n;
}

async function run() {
  await connectDB();
  console.log('[games] connected to', mongoose.connection.host, mongoose.connection.name);
  const sportKeys = await resolveSportKeys();
  if (!sportKeys.length) {
    console.log('No sport keys matched. Check ODDS_SPORT_KEYS.');
    process.exit(0);
  }

  let total = 0;
  for (const key of sportKeys) {
    try {
      const n = await upsertFromSportKey(key);
      console.log(`${key}: upserted ${n}`);
      total += n;
    } catch (e) {
      const code = e?.response?.data?.error_code;
      if (code === 'EXCEEDED_FREQ_LIMIT') {
        console.warn(`Rate limited on ${key}. Waiting 600ms and retrying once...`);
        await sleep(600);
        try {
          const n = await upsertFromSportKey(key);
          console.log(`${key} (retry): upserted ${n}`);
          total += n;
        } catch (e2) {
          console.error(`Failed for ${key} after retry:`, e2?.response?.data || e2.message);
        }
      } else {
        console.error(`Failed for ${key}:`, e?.response?.data || e.message);
      }
    }

    // Small gap between calls to avoid the per-second throttle
    await sleep(350);
  }
  console.log(`Done. Total upserts: ${total}`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });