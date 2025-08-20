import axios from 'axios';

const API_BASE = process.env.ODDS_API_BASE || 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;
const REGION = 'us';
const MARKETS = 'h2h'; // ML odds
const FORMAT = 'american' // American ML odds

const client = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    params: { apiKey: API_KEY},
});

export function logQuota(label, headers = {}) {
    const used = Number(headers['x-requests-used'] ?? 0);
    const remaining = Number(headers['x-requests-remaining'] ?? 0);
    if (!Number.isNaN(used) || !Number.isNaN(remaining)) {
        console.log(`[quota:${label}] used = ${used}, remaining = ${remaining}`);
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getWithRetry(path, { params } = {}, { tries = 3, label = 'req' } = {}) {
    let attempt = 0;
    while(true) {
        try {
            const res = await client.get(path, { params });
            logQuota(label, res.headers);
            return res.data;
        } catch (e) {
            const status = e.response?.status;
            attempt++;
            // Retry only 429/5xx; fail on other 4xx errors
            if (attempt >= tries || (status && status < 500 && status !== 429)) throw e;
            const delay = 500 * attempt * attempt;
            console.warn(`[${label}] attempt ${attempt} failed (status = ${status}). 
                Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

export async function listSports(all = true) {
    return getWithRetry('/sports', { params: { all } }, { label: 'sports' });
}

export async function fetchOddsForSport(sportKey) {
    return getWithRetry(
        `/sports/${sportKey}/odds`,
        { params: {
            regions: REGION,
            markets: MARKETS,
            oddsFormat: FORMAT,
            dateFormat: 'iso'
        } }, { label: `odds:${sportKey}` }
    );
}

export async function fetchScoresForSport(
    sportKey,
    { daysFrom = 2, dateFormat = 'iso' } = {}
) {
    const data = await getWithRetry(
        `/sports/${sportKey}/scores`,
        { params: { daysFrom, dateFormat } },
        { label: `scores:${sportKey}` }
    );

    return (data ?? []).map((g) => {
        const home = g.scores?.find(t => t.name === g.home_team)?.score;
        const away = g.scores?.find(t => t.name === g.away_team)?.score;
        const completed = Boolean(g.completed);
        const status = completed 
            ? 'completed' : (g.scores ? 'in_progress' : 'scheduled');

            return {
                id: g.id,
                sport_key: g.sport_key,
                commence_time: g.commence_time,
                home_team: g.home_team,
                away_team: g.away_team,
                completed,
                status,
                score: {
                    home: home != null ? Number(home) : null,
                    away: away != null ? Number(away) : null,
                },
                lastScoreUpdate: g.last_update || new Date().toISOString(),
            };
    });
}