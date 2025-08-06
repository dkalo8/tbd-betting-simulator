const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  userId: { type: String, required: true }, // replace with real auth later
  params: {
    formWeight: { type: Number, default: 0.5 },
    trials: { type: Number, default: 10000 }
  },
  result: {
    homeWinPct: Number,
    awayWinPct: Number
  }
}, { timestamps: true });

SimulationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Simulation', SimulationSchema);