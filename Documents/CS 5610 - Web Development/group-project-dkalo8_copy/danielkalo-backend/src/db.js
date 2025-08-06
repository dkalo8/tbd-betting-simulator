const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI; // set in .env

async function connectDB() {
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  console.log('✅ Mongo connected');
}

module.exports = { connectDB };