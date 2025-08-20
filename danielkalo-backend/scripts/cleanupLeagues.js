import 'dotenv/config';
import mongoose from 'mongoose';
import Game from '../src/models/Game.js';
import { SOCCER_ALLOW } from '../utilities/leagueTitles.js';

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const soccerBad = await Game.deleteMany({
    $and: [
      { league: { $regex: '^soccer_' } },
      { league: { $nin: Array.from(SOCCER_ALLOW) } },
    ],
  });
  const tennisBad = await Game.deleteMany({
    $and: [
      { league: { $regex: '^tennis_' } },
      { league: { $not: { $regex: '^tennis_(atp|wta)_' } } },
    ],
  });
  console.log('Deleted soccer:', soccerBad.deletedCount, 'tennis:', tennisBad.deletedCount);
  await mongoose.disconnect();
};
main().catch(e => { console.error(e); process.exit(1); });