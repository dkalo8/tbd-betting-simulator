import { useEffect, useState } from 'react';
import { Container, ListGroup, Button } from 'react-bootstrap';

import update from 'immutability-helper';
import SimsService from '../services/sims';
import DndCard from '../components/DnDCard';
import useWatchlist from '../hooks/useWatchlist';

function SavedSimulations() {
  const [sims, setSims] = useState([]);
  const { isSavedSim, toggleSim } = useWatchlist();
  
  const moveCard = async (dragIndex, hoverIndex) => {
    const dragSim = sims[dragIndex];
    const reordered = update(sims, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragSim],
      ],
    });
    setSims(reordered);
    // Persist new order
    const ids = reordered.map(s => s._id);
    try {
      await SimsService.updateOrder(ids);
    } catch (err) {
      console.error("Failed to save order", err);
    }
  };

  useEffect(() => {
    SimsService.getSimulations().then(setSims);
  }, []);

  return (
    <Container className="pb-5">
      <h3 className="fw-semibold mb-3">My Simulations</h3>
      <ListGroup>
        {sims.map((s, index) => (
          <DndCard key={s._id} index={index} moveCard={moveCard}>
            <ListGroup.Item className="p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                {/* LEFT */}
                <div className="d-flex align-items-center flex-wrap gap-2 text-truncate" style={{ minWidth: 0 }}>
                  <span className="text-nowrap">{new Date(s.createdAt).toLocaleString()}</span>
                  <span className="text-muted">•</span>
                  <span className="text-nowrap">
                    {(s.home ?? 'Home')} {Math.round(s.result.homeWinPct * 100)}%
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-nowrap">
                    {(s.away ?? 'Away')} {Math.round(s.result.awayWinPct * 100)}%
                  </span>
                </div>

                {/* RIGHT */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="ms-2"
                    variant={isSavedSim(s._id) ? "outline-success" : "outline-secondary"}
                    onClick={() => toggleSim(s)}
                  >
                    {isSavedSim(s._id) ? "Saved" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={async () => {
                      await SimsService.deleteSimulation(s._id);
                      setSims(curr => curr.filter(x => x._id !== s._id));
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          </DndCard>
        ))}
        {sims.length === 0 && (
          <ListGroup.Item>No Simulations Yet</ListGroup.Item>
        )}
      </ListGroup>
    </Container>
  );
}

export default SavedSimulations;