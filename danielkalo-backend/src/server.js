import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { connectDB } from './db.js';
import { verifyGoogleToken } from './auth.js';

import SimulationsDAO from '../dao/simulationsDAO.js';
import WatchlistDAO from '../dao/watchlistDAO.js';

import simulationsRouter from '../api/routes/simulations.route.js';
import gamesRouter from '../api/routes/games.route.js';
import watchlistRouter from '../api/routes/watchlist.route.js';
import adminRouter from '../api/routes/admin.route.js';

const app = express();

// Basic request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Games endpoints (public)
app.use('/api/games', gamesRouter);

// Simulations endpoints (protected)
app.use('/api/simulations', verifyGoogleToken, simulationsRouter);

// Watchlist endpoints (protected)
app.use("/api/watchlist", verifyGoogleToken, watchlistRouter);

// Admin endpoints
app.use('/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', method: req.method, path: req.path });
});

const PORT = process.env.PORT || 5001;

connectDB()
  .then(async () => {
    await SimulationsDAO.injectDB(mongoose.connection.db);
    await WatchlistDAO.injectDB(mongoose.connection.db);
    console.log('DAOs injected');

    app.listen(PORT, () =>
      console.log(`API listening on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });