import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import SimsService from '../services/sims';

function SimulationSetup() {
  const { id: gameId }      = useParams();
  const nav                 = useNavigate();
  const [formWeight, setFW] = useState(0.5);
  const [trials, setTrials] = useState(10000);
  const [result, setResult] = useState(null);

  const run = async () => {
    const doc = await SimsService.createSimulation({
      gameId,
      userId : 'demo',
      params : { formWeight, trials }
    });
    setResult(doc.result);
  };

  return (
    <Container className="pb-5">
      <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: 600 }}>
        <h3 className="mb-4 fw-semibold">Simulation</h3>

        <Form.Group className="mb-4">
          <Form.Label>Recent-form weight: {formWeight}</Form.Label>
          <Form.Range min={0} max={1} step={0.1}
            value={formWeight} onChange={e => setFW(Number(e.target.value))}/>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Trials: {trials.toLocaleString()}</Form.Label>
          <Form.Range min={1000} max={20000} step={1000}
            value={trials} onChange={e => setTrials(Number(e.target.value))}/>
        </Form.Group>

        <Button onClick={run}>Run</Button>

        {result && (
          <Alert variant="info" className="mt-4">
            Model result: <strong>Home {Math.round(result.homeWinPct * 100)}%</strong> ·
            <strong> Away {Math.round(result.awayWinPct * 100)}%</strong>
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