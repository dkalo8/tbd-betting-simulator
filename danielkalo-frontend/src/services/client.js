import axios from 'axios';

const DEV_BASE  = 'http://localhost:5001';
const PROD_BASE = process.env.REACT_APP_API_BASE_URL;

const baseURL = (process.env.NODE_ENV === 'production' && PROD_BASE)
  ? `${PROD_BASE}/api`
  : `${DEV_BASE}/api`;

const client = axios.create({ baseURL });

client.interceptors.request.use(config => {
  const stored = localStorage.getItem('login');
  if (stored) {
    const { idToken } = JSON.parse(stored);
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  }
  return config;
});

export default client;
