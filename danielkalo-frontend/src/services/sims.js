import client from './client'

const SimsService = {
  health: () => 
    client.get('/health')
          .then(res => res.data),

  getGames: (sport, league, when, days) =>
    client
      .get('/games', { params: { sport, league, when, days } })
      .then(res => res.data),

  getLeagues: (sport) =>
    client
      .get('/games/leagues', { params: { sport } })
      .then(res => res.data),

  createSimulation: ({ gameId, params }) =>
    client
      .post('/simulations', { gameId, params })
      .then(res => res.data),

  getSimulations: () =>
    client
      .get('/simulations')
      .then(res => res.data.sims),

  getSimulationById: (id) =>
    client
      .get(`/simulations/${id}`)
      .then(res => res.data),

  deleteSimulation: (simulationId) =>
    client
      .delete('/simulations', { data: { simulationId } })
      .then(res => res.data),

  updateOrder: (order) =>
    client
      .put('/simulations/order', { order })
      .then(res => res.data),
};

export default SimsService;