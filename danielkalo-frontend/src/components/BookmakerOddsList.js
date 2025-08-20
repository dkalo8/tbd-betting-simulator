function mlToProb(ml) {
  if (ml == null) return null;
  return ml > 0 ? 100 / (ml + 100) : (-ml) / ((-ml) + 100);
}

function pct(prob) {
  return prob == null ? '—' : `${(prob * 100).toFixed(1)}%`;
}

function computeBest(rows = []) {
  const homes = rows.map(r => r.homeML).filter(v => v != null);
  const aways = rows.map(r => r.awayML).filter(v => v != null);
  const draws = rows.map(r => r.drawML).filter(v => v != null);
  return {
    bestHome: homes.length ? Math.max(...homes) : null,
    bestAway: aways.length ? Math.max(...aways) : null,
    bestDraw: draws.length ? Math.max(...draws) : null,
    showDraw: draws.length > 0,
  };
}

export default function BookmakerOddsList({ rows = [], boldBest = true }) {
  if (!rows.length) return <div className="small text-muted">No bookmaker odds available.</div>;

  const best = computeBest(rows);

  return (
    <ul className="small mb-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
      {rows.map(r => {
        const homeImpl = mlToProb(r.homeML);
        const awayImpl = mlToProb(r.awayML);
        const drawImpl = mlToProb(r.drawML);
        const hBest = boldBest && best.bestHome != null && r.homeML === best.bestHome;
        const aBest = boldBest && best.bestAway != null && r.awayML === best.bestAway;
        const dBest = boldBest && best.bestDraw != null && r.drawML === best.bestDraw;

        return (
          <li key={r.bookmaker} className="d-flex justify-content-between py-1 border-top">
            <span>{r.bookmaker}</span>
            <span className="text-end">
              <span className={hBest ? 'fw-semibold' : ''}>
                H {r.homeML ?? '—'} ({pct(homeImpl)})
              </span>
              {' · '}
              {best.showDraw && (
                <>
                  <span className={dBest ? 'fw-semibold' : ''}>
                    D {r.drawML ?? '—'} ({pct(drawImpl)})
                  </span>
                  {' · '}
                </>
              )}
              <span className={aBest ? 'fw-semibold' : ''}>
                A {r.awayML ?? '—'} ({pct(awayImpl)})
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}