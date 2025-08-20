import { fetchOddsForSport } from '../api/theOddsAPI.js';
import { prettyLeagueTitle } from '../utilities/leagueTitles.js';
import Game from '../src/models/Game.js';

function pickH2H(bookmaker) {
  const m = bookmaker?.markets?.find(m => m.key === 'h2h');
  if (!m) return null;
  const home = m.outcomes.find(odds => odds.name === 'Home');
  const away = m.outcomes.find(odds => odds.name === 'Away');
  const draw = m.outcomes.find(odds => odds.name === 'Draw');
  return {
    bookmaker: bookmaker.key,
    lastUpdate: new Date(bookmaker.last_update || Date.now()),
    h2h: {
      homeML: home?.price ?? null,
      awayML: away?.price ?? null,
      drawML: draw?.price ?? null,
    }
  };
}

export async function upsertOddsForLeague(sportKey) {
  const events = await fetchOddsForSport({ sportKey, markets: 'h2h', oddsFormat: 'american', regions: 'us' });
  for (const ev of events) {
    const prices = (ev.bookmakers || [])
      .map(pickH2H)
      .filter(Boolean);

    await Game.findOneAndUpdate(
      { 'ext.provider': 'odds_api', 'ext.id': ev.id },
      {
        $set: {
          sport: ev.sport_key,
          leagueKey: ev.sport_key,
          leagueTitle: prettyLeagueTitle(ev.sport_key),
          vendorSportTitle: ev.sport_title, // raw label from The Odds API
          startTime: new Date(ev.commence_time),
          bookmakerOdds: prices,
          lastUpdated: new Date(),
          'marketOdds.homeML': Math.min(...prices.map(price => price.h2h.homeML).filter(Number.isFinite)),
          'marketOdds.awayML': Math.max(...prices.map(price => price.h2h.awayML).filter(Number.isFinite)), // or choose best price intelligently
        }
      },
      { upsert: true }
    );
  }
}