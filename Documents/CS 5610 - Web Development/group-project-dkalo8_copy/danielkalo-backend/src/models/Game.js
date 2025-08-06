const mongoose = require('mongoose');

const OddsSchema = new mongoose.Schema({
  homeML: Number, // e.g., -140
  awayML: Number // e.g., +120
}, { _id: false });

const GameSchema = new mongoose.Schema({
  sport: { type: String, enum: ['NBA','NFL','SOC','TEN'], required: true },
  home: { type: String, required: true },
  away: { type: String, required: true },
  startTime: { type: Date, required: true },
  marketOdds: OddsSchema
}, { timestamps: true });

GameSchema.index({ sport: 1, startTime: 1 });

module.exports = mongoose.model('Game', GameSchema);