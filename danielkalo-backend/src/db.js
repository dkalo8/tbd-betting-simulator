import mongoose from "mongoose";

export async function connectDB() {
  try {
    const DB_NAME = process.env.SPORTS_SIMS_DB || 'sports_sims_db';
    await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
    console.log('[scores] connected to', mongoose.connection.host, mongoose.connection.name);
    console.log("MongoDB connected");
  } catch (e) {
    console.error("MongoDB connection error:", e);
    throw e;
  }
}