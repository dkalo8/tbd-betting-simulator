import 'dotenv/config';
import { connectDB } from '../src/db.js';
import Game from '../src/models/Game.js';

async function run() {
  await connectDB();
  const now = new Date();
  const addHrs = h => new Date(now.getTime() + h*3600*1000);

  const docs = [
    { sport:'NBA', home:'Celtics', away:'Heat', startTime:addHrs(24), marketOdds:{homeML:-150, awayML:+130} },
    { sport:'NFL', home:'Patriots', away:'Jets', startTime:addHrs(48), marketOdds:{homeML:-110, awayML:-110} },
    { sport:'SOC', home:'Arsenal', away:'Spurs', startTime:addHrs(72), marketOdds:{homeML:-105, awayML:+260} },
    { sport:'TEN', home:'Alcaraz', away:'Sinner', startTime:addHrs(30), marketOdds:{homeML:-135, awayML:+115} }
  ];

  await Game.deleteMany({});
  await Game.insertMany(docs);
  console.log(`Seeded ${docs.length} games`);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });