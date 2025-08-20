export function computeRecentForm(lastMatches, { sport='generic', k=8 } = {}) {
  const games = lastMatches.slice(0, k);
  let score = 0, weightSum = 0;

  const outcomeToScore = (g) => {
    if (sport.startsWith('soccer')) {
      return g.isDraw ? 0.5 : (g.didTeamWin ? 1 : 0);
    }
    // NBA/NFL/MLB: W/L only
    return g.didTeamWin ? 1 : 0;
  };

  games.forEach((g, i) => {
    const w = Math.pow(0.7, i); // recency weight
    score += w * outcomeToScore(g);
    weightSum += w;
  });

  const base = weightSum ? score / weightSum : 0.5; // 0..1
  // Optional: home-court bump, opponent strength, injuries, etc.
  return base;
}