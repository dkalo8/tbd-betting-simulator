import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, ListGroup, Button, Offcanvas, Form } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

import SimsService from '../services/sims';
import StatusBadge from '../components/StatusBadge';
import useWatchlist from '../hooks/useWatchlist';

function MatchList({ initialWhen = 'today' }) {
  const [games, setGames] = useState([]);
  const [show, setShow] = useState(false);
  const [sport, setSport] = useState('');
  const [league, setLeague] = useState(''); // selected league key or ""
  const [leagues, setLeagues] = useState([]); // [{ key, title }, ...]
  const [when, setWhen] = useState(initialWhen);
  const location = useLocation();
  const { isSavedGame, toggleGame } = useWatchlist();

  const loadGames = useCallback(() => {
    return SimsService.getGames(
      sport || undefined, 
      league || undefined,
      when, 
      when === 'upcoming' ? 365 : undefined // pull a year by default
    ).then(setGames)
     .catch((e) => console.error('loadGames error:', e));
  }, [sport, league, when]);

  useEffect(() => {
    setWhen(initialWhen);
  }, [initialWhen, location.pathname]);

  useEffect(() => {
    if (sport === 'Soccer' || sport === 'Tennis') {
      SimsService.getLeagues(sport).then(setLeagues);
    } else {
      setLeagues([]);
      setLeague('');
    }
  }, [sport]);

  useEffect(() => { loadGames(); }, [loadGames]);

  // Auto-refresh only for "today"
  useEffect(() => {
    if (when !== 'today') return;
    let id;
    const start = () => (id = setInterval(loadGames, 30_000));
    const stop = () => id && clearInterval(id);
    const vis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener('visibilitychange', vis);
    return () => { stop(); document.removeEventListener('visibilitychange', vis); };
  }, [when, loadGames]);

  return (
    <Container className="pb-5">
      <Row className="align-items-center mb-3">
        <Col>
          <h3 className="mb-0 fw-semibold">
            {when === 'today' ? "Today's Games" : 'Upcoming Games'}
          </h3>
        </Col>
        <Col xs="auto"><Button onClick={() => setShow(true)}>Filters</Button></Col>
      </Row>

      <ListGroup>
        {games.map((g) => {
          const status = (g.status || '').toLowerCase();
          const isLive = status === 'in_progress' || status === 'live';
          const isFinal = g.completed || status === 'final';

          return (
            <ListGroup.Item key={g._id} className="game-item d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                {isLive || isFinal ? (
                  <StatusBadge status={g.status} completed={g.completed} />
                ) : (
                  <span className="text-muted">
                    {new Date(g.startTime).toLocaleString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </span>
                )}

                <span>{g.away} @ {g.home}</span>

                {(isLive || isFinal) && (
                  <span className="ms-1 fw-semibold">
                    {(g.score?.away ?? '-')}–{(g.score?.home ?? '-')}
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center">
                <Button
                  as={Link}
                  to={`/game/${g._id}`}
                  state={{ home: g.home, away: g.away }}
                  size="sm"
                  className="ms-2 text-decoration-none"
                >
                  Run Simulation
                </Button>
                <Button
                  variant={isSavedGame(g._id) ? "outline-success" : "outline-secondary"}
                  size="sm"
                  className="ms-2"
                  onClick={() => toggleGame(g._id)}
                >
                  {isSavedGame(g._id) ? "Saved" : "Save"}
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      <Offcanvas show={show} onHide={() => setShow(false)} placement="end">
        <Offcanvas.Header closeButton />
        <Offcanvas.Body>
          <Form>
            {/* Sport */}
            <Form.Group className="mb-3">
              <Form.Label>Sport</Form.Label>
              <Form.Select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="">All Sports</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="Soccer">Soccer</option>
                <option value="Tennis">Tennis</option>
              </Form.Select>
            </Form.Group>

            {/* League / Tournament (only when Soccer/Tennis is selected) */}
            {(sport === 'Soccer' || sport === 'Tennis') && (
              <Form.Group className="mb-3">
                <Form.Label>League / Tournament</Form.Label>
                <Form.Select
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  disabled={leagues.length === 0}
                >
                  <option value="">
                    {leagues.length ? `All ${sport} Leagues` : 'Loading…'}
                  </option>
                  {leagues.map((l) => (
                    <option key={l.key} value={l.key}>
                      {l.title ?? l.key}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <div className="d-flex gap-2">
              <Button variant="primary" onClick={() => setShow(false)}>Apply</Button>
              <Button
                variant="outline-secondary"
                onClick={() => { setSport(''); setLeague(''); }}
              >
                Clear
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}

export default MatchList;