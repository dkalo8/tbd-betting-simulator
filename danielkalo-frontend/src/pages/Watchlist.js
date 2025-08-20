import { useEffect, useState } from "react";
import { Container, ListGroup, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import update from "immutability-helper";

import WatchlistService from "../services/watchlist";
import StatusBadge from "../components/StatusBadge";
import useWatchlist from "../hooks/useWatchlist";
import DndCard from "../components/DnDCard";

function Watchlist() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const { removeGame, removeSim, refresh } = useWatchlist();

  const load = async () => {
    setLoadingList(true);
    try {
      const { items } = await WatchlistService.list();
      setItems(items);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moveCard = async (dragIndex, hoverIndex) => {
    const dragItem = items[dragIndex];
    const reordered = update(items, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragItem],
      ],
    });
    setItems(reordered);
    try {
      const ids = reordered.map(i => i._id);
      await WatchlistService.updateOrder(ids);
    } catch (e) {
      console.error("Failed to persist watchlist order", e);
    }
  }

  const removeOne = async (item) => {
    const { game, simulationId } = item;
    const prev = items;

    // Optimistic UI
    setItems(prev.filter(i => 
      simulationId
        ? String(i.simulationId) !== String(simulationId)
        : String(i.game._id) !== String(game._id)
    ));

    try {
      if (simulationId) {
        await removeSim(simulationId);
      } else {
        await removeGame(game._id);
      }
      await refresh();
    } catch (e) {
      setItems(prev); // roll back on failure
      console.error(e);
    }
  };

  if (loadingList) {
    return (
      <Container className="py-4">
        <h3 className="mb-3">Watchlist</h3>
        <div className="text-muted">Loading…</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h3 className="mb-3">Watchlist</h3>
      {items.length === 0 ? (
        <div className="text-muted">No saved games yet.</div>
      ) : (
        <ListGroup>
          {items.map((item, index) => {
            const { _id, game, simResult } = item;
            const status = (game.status || "").toLowerCase();
            const inProgress = status === "in_progress" || status === "live";

            return (
              <DndCard key={_id} index={index} moveCard={moveCard}>
                <ListGroup.Item className="p-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    {/* LEFT: game info + optional sim snapshot */}
                    <div className="d-flex align-items-center flex-wrap gap-2 text-truncate" style={{ minWidth: 0 }}>
                      <StatusBadge status={game.status} completed={game.completed} />
                      {!(inProgress || game.completed) && (
                        <span className="text-muted">
                          {new Date(game.startTime).toLocaleString(undefined, {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "numeric", minute: "2-digit"
                          })}
                        </span>
                      )}
                      <span className="text-truncate">{game.away} @ {game.home}</span>
                      {(inProgress || game.completed) && (
                        <span className="fw-semibold">
                          {(game.score?.away ?? "-")}–{(game.score?.home ?? "-")}
                        </span>
                      )}

                      {simResult && (
                        <>
                          <span className="text-muted">•</span>
                          <span className="text-nowrap">
                            {(game.home ?? "Home")} {Math.round(simResult.homeWinPct * 100)}%
                          </span>
                          <span className="text-muted">·</span>
                          <span className="text-nowrap">
                            {(game.away ?? "Away")} {Math.round(simResult.awayWinPct * 100)}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* RIGHT: actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <Button as={Link} to={`/game/${game._id}`} size="sm" className="me-1">
                        Run Simulation
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => removeOne(item)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              </DndCard>
            );
          })}
        </ListGroup>
      )}
    </Container>
  );
}

export default Watchlist;