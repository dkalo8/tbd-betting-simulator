import client from "./client";

const BASE = "/watchlist";

const WatchlistService = {
  list: () => client.get(BASE).then(r => r.data),
  add: (gameId, extra = {}) => client.post(BASE, { gameId, ...extra }).then(r => r.data),
  remove: (gameId) => client.delete(`${BASE}/${gameId}`).then(r => r.data),
  removeBySimulation: (simulationId) => client.delete(`${BASE}/sim/${simulationId}`).then(r => r.data),
  updateOrder: (ids) => client.put(`${BASE}/order`, { ids }).then(r => r.data),
};

export default WatchlistService;