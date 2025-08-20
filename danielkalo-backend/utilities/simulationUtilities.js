// Convert money-line odds to implied win probability
export function moneylineToProb(ml) {
  return ml < 0 ? Math.abs(ml) / (Math.abs(ml) + 100) : 100 / (ml + 100);
}

const clamp = (x, lo = 0.0001, hi = 0.9999) => Math.min(hi, Math.max(lo, x));
const logit = (p) => Math.log(p / (1 - p));
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/**
 * Option B: If recentForm is missing/neutral, apply a calibrated bias on log-odds
 * based on (homeFormWeight - awayFormWeight). If recentForm exists, blend
 * directionally toward the team with better recent form.
 * params:
 *   - trials
 *   - formWeight OR homeFormWeight & awayFormWeight  (0..1)
 */
export function runMonteCarlo(game, params = {}) {
  // 1) Market baseline
  const baseP = clamp(moneylineToProb(game.marketOdds.homeML));
  const baseZ = logit(baseP);

  // 2) Trials
  const trials = Math.max(1000, Math.min(500_000, Number(params.trials) || 10000));

  // 3) Recent form (defaults to 0.5/0.5 if missing)
  const homeRecent = clamp(game.recentForm?.home ?? 0.5);
  const awayRecent = clamp(game.recentForm?.away ?? 0.5);
  const recentP =
    homeRecent + awayRecent > 0
      ? clamp(homeRecent / (homeRecent + awayRecent))
      : 0.5;
  const hasRecentSignal = Math.abs(recentP - 0.5) > 1e-6;

  // 4) Weights (support one or two sliders)
  let wHome = params.homeFormWeight;
  let wAway = params.awayFormWeight;
  if (wHome == null || wAway == null) {
    // fall back to single slider
    const w = clamp(Number(params.formWeight ?? 0));
    wHome = w;
    wAway = w;
  }
  wHome = clamp(Number(wHome ?? 0));
  wAway = clamp(Number(wAway ?? 0));

  // Direction (+ home, - away) and strength
  const delta = clamp(wHome - wAway, -1, 1);

  // 5) Compute final probability
  let p;
  if (hasRecentSignal) {
    // Directional blend toward recent matchup when it exists
    const strength = Math.abs(delta);                 // 0..1
    const targetP = delta >= 0 ? recentP : (1 - recentP);
    const z = (1 - strength) * baseZ + strength * logit(targetP);
    p = clamp(sigmoid(z));
  } else {
    // No recent signal: apply a calibrated bias on log-odds
    const BIAS = 0.8; // tune 0.4=soft, 0.8=strong, 1.2=very strong
    const z = baseZ + BIAS * delta;
    p = clamp(sigmoid(z));
  }

  // 6) Monte Carlo
  let homeWins = 0;
  for (let i = 0; i < trials; i++) if (Math.random() < p) homeWins++;
  const homeWinPct = homeWins / trials;

  return {
    // Helpful for debugging/QA
    baseP, // implied from moneyline
    recentP, // matchup prob from recent form
    trials,
    // main outputs
    homeWinPct,
    awayWinPct: 1 - homeWinPct,
  };
}