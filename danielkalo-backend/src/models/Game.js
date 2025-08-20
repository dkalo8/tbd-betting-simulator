import mongoose from "mongoose";

const OddsSchema = new mongoose.Schema({
  homeML: Number,
  awayML: Number
}, { _id: false });

const RecentFormSchema = new mongoose.Schema({
  home: Number,
  away: Number
}, { _id: false });

const ExtSchema = new mongoose.Schema({
  provider: String, // i.e. 'odds api'
  id: String // provider's event ID
}, {_id: false});

const BookmakerPriceSchema = new mongoose.Schema({
  bookmaker: String,
  lastUpdate: Date,
  h2h: {
    homeML: Number,
    awayML: Number,
    drawML: Number,
  }
}, { _id: false });

const GameSchema = new mongoose.Schema({
  sport: { type: String, enum: ['NBA','NFL','Soccer','Tennis'], required: true },
  league: String,
  leageTitle: String,
  leagueGroup: String,
  home: { type: String, required: true },
  away: { type: String, required: true },
  startTime: { type: Date, required: true },
  marketOdds: OddsSchema,
  recentForm: RecentFormSchema,
  ext: ExtSchema,
  bookmakerOdds: [BookmakerPriceSchema],
  lastUpdated: Date,
  status: String,
  score: { home: Number, away: Number },
  completed: Boolean,
  lastScoreUpdate: Date
}, { timestamps: true });

GameSchema.index({ sport: 1, league: 1, startTime: 1 });
GameSchema.index({ 'ext.provider': 1, 'ext.id': 1 }, { unique: true, sparse: true });

export default mongoose.model("Game", GameSchema);