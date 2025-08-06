import axios from 'axios';

const PROD_BASE = process.env.REACT_APP_API_BASE_URL || '';
const API_BASE =
  process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : PROD_BASE;

const client = axios.create({ baseURL: `${API_BASE}/api` });

const SimsService = {
  health: () => client.get('/health').then(r => r.data),
  getGames: (sport) =>
    client.get('/games', { params: sport ? { sport } : {} }).then(r => r.data),
  createSimulation: (payload) =>
    client.post('/simulations', payload).then(r => r.data),
  getSimulations: (userId = 'demo') =>
    client.get('/simulations', { params: { userId } }).then(r => r.data),
};

export default SimsService;