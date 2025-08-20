const SOCCER_TITLES = {
  soccer_epl: 'Premier League',
  soccer_fa_cup: 'FA Cup',
  soccer_fifa_club_world_cup: 'FIFA Club World Cup',
  soccer_fifa_world_cup: 'FIFA World Cup',
  soccer_fifa_world_cup_qualifiers_europe: 'World Cup Qualifiers — Europe',
  soccer_france_ligue_one: 'Ligue 1',
  soccer_germany_bundesliga: 'Bundesliga',
  soccer_italy_serie_a: 'Serie A',
  soccer_spain_la_liga: 'La Liga',
  soccer_uefa_champs_league: 'UEFA Champions League',
  soccer_uefa_champs_league_qualification: 'UCL Qualifying',
  soccer_uefa_euro_qualification: 'EURO Qualifying',
  soccer_uefa_europa_conference_league: 'UEFA Europa Conference League',
  soccer_uefa_europa_league: 'UEFA Europa League',
  soccer_uefa_european_championship: 'EURO Championship',
  soccer_uefa_nations_league: 'UEFA Nations League',
};

export function prettyLeagueTitle(key) {
  if (SOCCER_TITLES[key]) return SOCCER_TITLES[key];
  const m = key.match(/^tennis_(atp|wta)_(.+)$/);
  if (m) {
    const tour = m[1].toUpperCase();
    const rest = m[2].split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return `${tour} ${rest}`;
  }
  return key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export const SOCCER_ALLOW = new Set(Object.keys(SOCCER_TITLES));
export const TENNIS_PREFIXES = ['tennis_atp_', 'tennis_wta_'];
export const TOP_LEVEL_SPORTS = ['basketball_nba', 'americanfootball_nfl'];

export function isAllowedLeagueKey(key) {
  if (!key) return false;
  if (key.startsWith('soccer_')) return SOCCER_ALLOW.has(key);
  return TENNIS_PREFIXES.some(p => key.startsWith(p)); // allow all ATP/WTA tour events
}

export function filterAllowedLeagueKeys(keys = []) {
  return keys.filter(isAllowedLeagueKey);
}