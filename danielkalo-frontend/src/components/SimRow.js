import { useState } from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import DndCard from './DnDCard';
import BookmakerOddsList from './BookmakerOddsList';

function SimRow({ s, index, moveCard, isSavedSim, toggleSim, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [bmRows, setBmRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleOdds = async () => {
    const next = !open;
    setOpen(next);
    if (next && !bmRows && s.gameId) {
      try {
        setLoading(true);
        const res = await fetch(`/api/games/${s.gameId}/odds`);
        const p = await res.json();
        setBmRows(p.rows || []);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DndCard index={index} moveCard={moveCard}>
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
            <Button size="sm" variant="outline-primary" onClick={toggleOdds}>
              {open ? 'Hide odds' : 'Show odds'}
            </Button>
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
                await onDeleted?.(s._id);
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        {open && (
          <div className="mt-2 rounded bg-sky-100 p-2">
            {loading && <div className="small">Loading bookmaker odds…</div>}
            {!loading && <BookmakerOddsList rows={bmRows || []} />}
          </div>
        )}
      </ListGroup.Item>
    </DndCard>
  );
}

export default SimRow;