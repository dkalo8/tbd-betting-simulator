import 'dotenv/config';
import { connectDB } from '../src/db.js';
import Game from '../src/models/Game.js';

async function run() {
  await connectDB();
  // Delete any game that didn't come from the provider
  const { deletedCount } = await Game.deleteMany({ $or: [
    { ext: { $exists: false } },
    { 'ext.provider': { $ne: 'oddsapi' } },
  ]});
  console.log('Deleted seeded/non-provider games:', deletedCount);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });