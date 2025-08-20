import { useEffect, useState } from 'react';
import { Container, ListGroup } from 'react-bootstrap';

import update from 'immutability-helper';
import SimsService from '../services/sims';
import useWatchlist from '../hooks/useWatchlist';
import SimRow from '../components/SimRow';

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
          <SimRow
            key={s._id}
            s={s}
            index={index}
            moveCard={moveCard}
            isSavedSim={isSavedSim}
            toggleSim={toggleSim}
            onDeleted={async (id) => {
              await SimsService.deleteSimulation(id);
              setSims(curr => curr.filter(x => x._id !== id));
            }}
          />
        ))}
        {sims.length === 0 && <ListGroup.Item>No Simulations Yet</ListGroup.Item>}
      </ListGroup>
    </Container>
  );
}

export default SavedSimulations;