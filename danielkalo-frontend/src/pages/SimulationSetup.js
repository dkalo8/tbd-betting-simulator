import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import SimsService from '../services/sims';

function SimulationSetup() {
  const { id: gameId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const [homeFormWeight, setHomeFW] = useState(0.5);
  const [awayFormWeight, setAwayFW] = useState(0.5);
  const [trials, setTrials] = useState(10000);
  const [result, setResult] = useState(null);
  const [teams, setTeams] = useState({
    home: state?.home || "",
    away: state?.away || "",
  });

  // Fallback in case user reloads on /game/:id and Link state is lost,
  // in order to fetch games and find the one we need
  useEffect(() => {
    if (teams.home && teams.away) return;
    (async () => {
      try {
        const all = await SimsService.getGames();
        const g = all.find(x => x._id === gameId);
        if (g) setTeams({ home: g.home, away: g.away });
      } catch {}
    })();
  }, [gameId, teams.home, teams.away]);

  const handleRun = async () => {
    try {
      const saved = await SimsService.createSimulation({
        gameId,
        params: { homeFormWeight, awayFormWeight, trials },
      });
      if (saved?.result) {
        setResult(saved.result);
        setTeams({ home: saved.home ?? "", away: saved.away ?? "" });
      } else if (saved?._id || saved?.insertedId) {
        const id = saved._id || saved.insertedId;
        const full = await SimsService.getSimulationById(id);
        setResult(full?.result ?? null);
        setTeams({ home: full?.home ?? "", away: full?.away ?? "" });
      }
    } catch (err) {
      console.error("Simulation failed", err);
    }
  };

  return (
    <Container className="pb-5">
      <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: 600 }}>
        <h3 className="mb-4 fw-semibold">Simulation</h3>

        <Form.Group className="mb-3">
          <Form.Label>{(teams.home || "Home")} Recent-Form Weight: {homeFormWeight}</Form.Label>
          <Form.Range min={0} max={1} step={0.1}
            value={homeFormWeight} onChange={e => setHomeFW(Number(e.target.value))}/>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{(teams.away || "Away")} Recent-Form Weight: {awayFormWeight}</Form.Label>
          <Form.Range min={0} max={1} step={0.1}
            value={awayFormWeight} onChange={e => setAwayFW(Number(e.target.value))}/>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Trials: {trials.toLocaleString()}</Form.Label>
          <Form.Range min={1000} max={20000} step={1000}
            value={trials} onChange={e => setTrials(Number(e.target.value))}/>
        </Form.Group>

        <Button type="button" onClick={handleRun}>Run Simulation</Button>

        {result && (
          <Alert variant="info" className="mt-3">
            <div className="fw-semibold mb-1">Simulation Result</div>
            <div className="d-flex align-items-center">
              <span>{teams.home || "Home"} {Math.round(result.homeWinPct * 100)}%</span>
              <span className="mx-2">·</span>
              <span>{teams.away || "Away"} {Math.round(result.awayWinPct * 100)}%</span>
            </div>
          </Alert>
        )}

        <Button variant="secondary" className="mt-2"
                onClick={() => nav('/my-sims')}>
          Go to My Sims
        </Button>
      </Card>
    </Container>
  );
}

export default SimulationSetup;