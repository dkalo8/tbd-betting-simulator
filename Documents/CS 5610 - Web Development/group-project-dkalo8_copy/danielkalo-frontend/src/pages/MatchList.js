import { useEffect, useState } from 'react';
import { Container, Row, Col, ListGroup, Button, Offcanvas, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SimsService from '../services/sims';

function MatchList() {
  const [games, setGames] = useState([]);
  const [show, setShow]   = useState(false);
  const [sport, setSport] = useState('');

  useEffect(() => {
    SimsService.getGames(sport).then(setGames);
  }, [sport]);

  return (
    <Container className="pb-5">
      <Row className="align-items-center mb-3">
        <Col><h3 className="mb-0 fw-semibold">Today’s Games</h3></Col>
        <Col xs="auto"><Button onClick={() => setShow(true)}>Filters</Button></Col>
      </Row>

      <ListGroup>
        {games.map(g => (
          <ListGroup.Item key={g._id} className="game-item d-flex justify-content-between">
            <span>{g.away} @ {g.home}</span>
            <Link to={`/game/${g._id}`} className="btn btn-primary btn-sm ms-2">Run Simulation</Link>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Offcanvas show={show} onHide={() => setShow(false)} placement="end">
        <Offcanvas.Header closeButton />
        <Offcanvas.Body>
          <Form.Select value={sport} onChange={e => setSport(e.target.value)}>
            <option value="">All sports</option>
            <option>NBA</option><option>NFL</option><option>SOC</option><option>TEN</option>
          </Form.Select>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}

export default MatchList;