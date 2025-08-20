// src/pages/Home.js
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Stack, Modal, Badge } from "react-bootstrap";

import SimsService from "../services/sims";
import useWatchlist from "../hooks/useWatchlist";
import StatusBadge from "../components/StatusBadge";

const leagueIcon = (g) => {
  const sport = (g.sport || "").toLowerCase();
  const lg = (g.league || "").toLowerCase();
  if (sport === "nba" || lg.includes("nba")) return "🏀";
  if (sport === "nfl" || lg.includes("nfl")) return "🏈";
  if (sport === "soccer") return "⚽";
  if (sport === "tennis") return "🎾";
  return "🏟️";
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState([]); // live games today
  const [soon, setSoon] = useState([]); // next 10 upcoming
  const [health, setHealth] = useState(null);
  const [showHow, setShowHow] = useState(false);

  const { isSavedGame, toggleGame } = useWatchlist(); // shared hook (Save buttons)

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Today’s games → Live ticker
        const today = await SimsService.getGames(undefined, undefined, "today");
        const liveOnly = (today || []).filter(g => {
          const s = (g.status || "").toLowerCase();
          return s === "in_progress" || s === "live";
        }).slice(0, 12);
        if (mounted) setLive(liveOnly);
      } catch {}

      try {
        // Upcoming (next 2 days) → “Starting soon”
        const upcoming = await SimsService.getGames(undefined, undefined, "upcoming", 2);
        const soonest = (upcoming || [])
          .filter(g => g.startTime)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 10);
        if (mounted) setSoon(soonest);
      } catch {}

      try {
        const res = await fetch("/api/health");
        if (mounted && res.ok) setHealth(await res.json());
      } catch {}

      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // “scores updated …” chip (from any live game’s lastScoreUpdate)
  const freshness = useMemo(() => {
    const times = live.map(g => g.lastScoreUpdate && new Date(g.lastScoreUpdate).getTime()).filter(Boolean);
    if (!times.length) return null;
    const ms = Date.now() - Math.max(...times);
    const m = Math.max(0, Math.round(ms / 60000));
    return m === 0 ? "just now" : `${m}m ago`;
  }, [live]);

  return (
    <Container className="py-4">
      {/* Hero */}
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="fw-bold mb-1">Welcome to TBD</h2>
          <div className="text-muted">
            Run simulations, track live scores, and save games to your watchlist!
          </div>
        </Col>
        <Col xs="auto">
          <Stack direction="horizontal" gap={2}>
            <Button as={Link} to="/games" variant="primary">
              Run a Sim
            </Button>
            <Button as={Link} to="/games" variant="outline-primary">
              Today’s Games
            </Button>
            <Button as={Link} to="/games/upcoming" variant="outline-primary">
              Upcoming
            </Button>
            <Button as={Link} to="/my-sims" variant="outline-secondary">
              My Sims
            </Button>
          </Stack>
        </Col>
      </Row>

      {/* Live Now ticker */}
      {loading ? (
        <div className="mb-4">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading…
        </div>
      ) : (
        <Card className="mb-4">
          <Card.Body className="py-2 d-flex flex-wrap align-items-center gap-3">
            <Badge bg="danger">Live Now</Badge>
            {freshness && (
              <small className="text-muted">scores updated {freshness}</small>
            )}
            {live.length === 0 ? (
              <small className="text-muted">No live games at the moment.</small>
            ) : (
              live.map((g) => (
                <span
                  key={g._id}
                  className="text-nowrap d-inline-flex align-items-center gap-1"
                >
                  {leagueIcon(g)}
                  <StatusBadge status={g.status} completed={g.completed} />
                  <strong>{g.away}</strong>{" "}
                  {g.score?.away ?? "-"}–{g.score?.home ?? "-"}{" "}
                  <strong>@ {g.home}</strong>
                </span>
              ))
            )}
          </Card.Body>
        </Card>
      )}

      {/* How it works + Starting soon */}
      <Row>
        <Col md={5} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>How It Works</Card.Title>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item>
                  Pick a game from Today or Upcoming
                </ListGroup.Item>
                <ListGroup.Item>
                  Choose your parameters (form weight, trials)
                </ListGroup.Item>
                <ListGroup.Item>Run 1k-20k trials and see the results!</ListGroup.Item>
              </ListGroup>
              <Button variant="outline-secondary" onClick={() => setShowHow(true)}>
                Learn more
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Next Few Games</Card.Title>
              {soon.length === 0 ? (
                <div className="text-muted">No upcoming games found.</div>
              ) : (
                <ListGroup variant="flush">
                  {soon.map((g) => (
                    <ListGroup.Item
                      key={g._id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>{leagueIcon(g)}</span>
                        <StatusBadge status={g.status} completed={g.completed} />
                        <span className="text-muted">
                          {new Date(g.startTime).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>
                          {g.away} @ {g.home}
                        </span>
                      </div>
                      <div>
                        <Button
                          as={Link}
                          to={`/game/${g._id}`}
                          size="sm"
                          className="me-2"
                        >
                          Run Simulation
                        </Button>
                        <Button
                          size="sm"
                          variant={isSavedGame(g._id) ? "outline-success" : "outline-secondary"}
                          onClick={() => toggleGame(g._id)}
                        >
                          {isSavedGame(g._id) ? "Saved" : "Save"}
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Deploy info (tiny) */}
      {health && (
        <div className="text-muted small mt-2">
          v{health.version} • {health.commit?.slice(0, 7)} • {health.deployedAt}
        </div>
      )}

      {/* Learn more modal */}
      <Modal show={showHow} onHide={() => setShowHow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>How simulations work</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          We run Monte Carlo trials using your chosen parameters (e.g., form
          weight and trial count). Results are saved to <em>My Sims</em>; you can
          reorder or delete them anytime. Save games to your <em>Watchlist</em> to
          quickly revisit when odds change.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHow(false)}>
            Close
          </Button>
          <Button
            as={Link}
            to="/games/today"
            onClick={() => setShowHow(false)}
          >
            Run a Sim
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}