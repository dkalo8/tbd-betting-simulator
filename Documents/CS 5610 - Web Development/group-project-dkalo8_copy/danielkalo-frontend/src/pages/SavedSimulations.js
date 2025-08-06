import { useEffect, useState } from 'react';
import { Container, ListGroup } from 'react-bootstrap';
import SimsService from '../services/sims';

function SavedSimulations() {
  const [sims, setSims] = useState([]);

  useEffect(() => {
    SimsService.getSimulations('demo').then(setSims);
  }, []);

  return (
    <Container className="pb-5">
      <h3 className="fw-semibold mb-3">My Simulations</h3>

      <ListGroup>
        {sims.map(s => (
          <ListGroup.Item key={s._id} className="game-item d-flex justify-content-between">
            <span>{new Date(s.createdAt).toLocaleString()}</span>
            <span>
              H&nbsp;{Math.round(s.result.homeWinPct * 100)}%&nbsp;·&nbsp;
              A&nbsp;{Math.round(s.result.awayWinPct * 100)}%
            </span>
          </ListGroup.Item>
        ))}
        {sims.length === 0 && (
          <ListGroup.Item>No simulations yet&nbsp;🤓</ListGroup.Item>
        )}
      </ListGroup>
    </Container>
  );
}

export default SavedSimulations;