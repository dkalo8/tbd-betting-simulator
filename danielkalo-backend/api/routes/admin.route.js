import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

function isCron(req) {
  // App Engine Cron adds this header
  return req.get('X-Appengine-Cron') === 'true';
}

function isAdmin(req) {
  const hdr = req.get('authorization') || req.get('Authorization') || '';
  return ADMIN_TOKEN && hdr === `Bearer ${ADMIN_TOKEN}`;
}

// Single auth gate: allow Cron header OR matching bearer token
router.use((req, res, next) => {
  if (!isCron(req) && !isAdmin(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
});

// Spawn helper
function runNode(scriptRelative, args = [], extraEnv = {}) {
  const scriptAbs = path.resolve(process.cwd(), scriptRelative);
  const child = spawn('node', [scriptAbs, ...args], {
    stdio: 'inherit', // logs go to gcloud logs
    env: { ...process.env, ...extraEnv },
  });
  child.on('exit', (code) => {
    console.log(`[admin] ${path.basename(scriptAbs)} exited with code ${code}`);
  });
}

// Seed today’s fixtures/odds (respects allowlist + ODDS_SPORT_KEYS)
router.all('/seed-today', (req, res) => {
  runNode('scripts/realGames.js');
  res.json({ ok: true, started: 'realGames' });
});

// Sync scores (supports ?daysFrom=&sports=&include=&exclude=)
router.all('/scores-sync', (req, res) => {
  const { daysFrom = '1', sports = '', include = '', exclude = '' } = req.query;
  const args = [`--daysFrom=${daysFrom}`];
  if (sports) args.push(`--sports=${sports}`);
  if (include) args.push(`--include=${include}`);
  if (exclude) args.push(`--exclude=${exclude}`);
  runNode('scripts/realScores.js', args);
  res.json({ ok: true, started: 'realScores', args });
});

export default router;