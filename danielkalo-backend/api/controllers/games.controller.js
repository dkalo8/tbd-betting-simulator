import Game from '../../src/models/Game.js';
import { prettyLeagueTitle, SOCCER_ALLOW, TENNIS_PREFIXES } from '../../utilities/leagueTitles.js';
import { moneylineToProb } from '../../utilities/simulationUtilities.js';

class GamesController {
  static async apiGetGames(req, res) {
    try {
      const { sport, league, when, from, to, days } = req.query;
      const filter = {};
      if (sport) filter.sport  = sport;
      if (league) filter.league = league;

      // Time window
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday.getTime() + 864e5); // 864e5 = 1 day

      if (from || to) {
        filter.startTime = {};
        if (from) filter.startTime.$gte = new Date(from);
        if (to) filter.startTime.$lt = new Date(to);
      } else if (when === 'today') {
        filter.startTime = { $gte: startOfToday, $lt: startOfTomorrow };
      } else if (when === 'upcoming') {
        const horizonDays = Number(days) > 0 ? Number(days) : 365;
        const end = new Date(startOfTomorrow.getTime() + horizonDays * 864e5);
        filter.startTime = { $gte: startOfTomorrow, $lt: end }; // excludes today
      }

      // Only show allowed leagues unless a specific league was requested
      if (!league) {
        if (sport === 'Soccer') {
          filter.league = { $in: Array.from(SOCCER_ALLOW) };
        } else if (sport === 'Tennis') {
          filter.$or = TENNIS_PREFIXES.map(p => ({ league: { $regex: `^${p}` } }));
        } else if (!sport) {
          // "All Sports" -> NBA/NFL + allowed Soccer/Tennis leagues
          filter.$or = [
            { sport: { $in: ['NBA', 'NFL'] } },
            { league: { $in: Array.from(SOCCER_ALLOW) } },
            ...TENNIS_PREFIXES.map(p => ({ league: { $regex: `^${p}` } })),
          ];
        }
      }

      const games = await Game.find(filter).sort({ startTime: 1 }).lean();
      res.json(games);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async apiGetLeagues(req, res) {
    try {
      const { sport } = req.query;
      const match = sport ? { sport } : {};

      const rows = await Game.aggregate([
        { $match: match },
        { $group: { _id: '$league', title: { $first: '$leagueTitle' } } },
        { $project: { _id: 0, key: '$_id', title: { $ifNull: ['$title', '$_id'] } } },
        { $sort: { title: 1 } }
      ]);
      // Fallback prettify + final sort by pretty title
      const out = rows.map(r => ({
        key: r.key,
        title: r.title === r.key ? prettyLeagueTitle(r.key) : r.title
      })).sort((a,b) => a.title.localeCompare(b.title));
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async apiGetBookmakerOdds(req, res) {
    const game = await Game.findById(req.params.id).lean();
    if (!game) return res.status(404).json({ error: "Not Found" });
    const rows = (game.bookmakerOdds || []).map(book => ({
      bookmaker: book.bookmaker,
      homeML: book.h2h.homeML,
      awayML: book.h2h.awayML,
      drawML: book.h2h.drawML,
      impliedHome: book.h2h.homeML != null ? moneylineToProb(book.h2h.homeML) : null,
      impliedAway: book.h2h.awayML != null ? moneylineToProb(book.h2h.awayML) : null,
    }));
    res.json({ rows, updatedAt: game.lastUpdated, startTime: game.startTime });
  }
}

export default GamesController;