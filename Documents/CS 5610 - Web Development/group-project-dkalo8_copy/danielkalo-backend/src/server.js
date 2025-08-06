require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const Game = require('./models/Game');
const Simulation = require('./models/Simulation');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_,res)=>res.json({status:'ok'}));

app.get('/api/games', async (req,res)=>{
  const { sport } = req.query;
  const q = sport ? { sport } : {};
  const games = await Game.find(q).sort({ startTime: 1 }).lean();
  res.json(games);
});

app.post('/api/simulations', async (req,res)=>{
  const { gameId, userId='demo', params } = req.body;

  // TEMP result; replace with real model next iteration
  const result = { homeWinPct: 0.55, awayWinPct: 0.45 };

  const doc = await Simulation.create({ gameId, userId, params, result });
  res.status(201).json(doc);
});

app.get('/api/simulations', async (req,res)=>{
  const { userId='demo' } = req.query;
  const sims = await Simulation.find({ userId }).sort({ createdAt:-1 }).lean();
  res.json(sims);
});

const PORT = process.env.PORT || 8080;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });