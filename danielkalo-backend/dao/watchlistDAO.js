import { ObjectId } from "mongodb";

let watchlist;
let games;

class WatchlistDAO {
  static async injectDB(conn) {
    if (watchlist && games) return;
    const db = typeof conn.db === "function" ? conn.db(process.env.SPORTS_SIMS_DB) : conn;

    watchlist = db.collection(process.env.WATCHLIST_COLLECTION || "watchlist");
    games = db.collection(process.env.GAMES_COLLECTION || "games");

    try {
      await watchlist.updateMany(
        { simulationId: { $exists: false } },
        { $set: { simulationId: null } }
      );
    } catch {}

    // Switch from old unique {userId, gameId} to new unique {userId, gameId, simulationId}
    // try { await watchlist.dropIndex("userId_1_gameId_1"); } catch {}
    // try { await watchlist.dropIndex("uniq_user_game_sim"); } catch {}

    await watchlist.createIndex({ userId: 1, gameId: 1, simulationId: 1 }, { unique: true });
    await watchlist.createIndex({ userId: 1, addedAt: -1 });
    await watchlist.createIndex({ userId: 1, order: 1 }); // for drag & drop
  }

  static async listWithGames(userId) {
    const hasOrder = await watchlist.countDocuments({ userId, order: { $exists: true } }) > 0;

    return await watchlist.aggregate([
      { $match: { userId } },
      { $lookup: { from: games.collectionName, localField: "gameId", foreignField: "_id", as: "game" } },
      { $unwind: "$game" },
      { $project: { _id: 1, userId: 1, addedAt: 1, order: 1, simResult: 1, simulationId: 1, game: 1 } },
      { $sort: hasOrder ? { order: 1, addedAt: -1 } : { "game.startTime": 1, addedAt: -1 } },
    ]).toArray();
  }

  static async upsert(userId, gameId, { simResult, simulationId, order } = {}) {
    const gid = new ObjectId(gameId); // game-only: simulationId = null
    // sim row: simulationId = ObjectId(simulationId)
    const sid = simulationId ? new ObjectId(simulationId) : null;

    const filter = { userId, gameId: gid, simulationId: sid };
    const $setOnInsert = { userId, gameId: gid, simulationId: sid, addedAt: new Date() };
    
    const update = { $setOnInsert };
    if (simResult || typeof order === "number") {
      update.$set = {};
      if (simResult) update.$set.simResult = simResult;
      if (typeof order === "number") update.$set.order = order;
    }

    return await watchlist.updateOne(filter, update, { upsert: true });
  }

  static async add(userId, gameId) {
    return this.upsert(userId, gameId);
  }

  static async remove(userId, gameId) {
    return await watchlist.deleteOne({ userId, gameId: new ObjectId(gameId),
      simulationId: null // only game-only entry
     });
  }

  // Remove a specific simulation save
  static async removeBySimulation(userId, simulationId) {
    return await watchlist.deleteOne({
      userId, simulationId: new ObjectId(simulationId),
    });
  }

  static async listIds(userId) {
    const docs = await watchlist
      .find({ userId })
      .project({ gameId: 1, simulationId: 1 })
      .toArray();
    return docs
      .filter(d => d.simulationId === null)
      .map(d => d.gameId.toString());
  }

  static async updateOrder(ids, userId) {
    const bulk = ids.map((wid, idx) => ({
      updateOne: {
        filter: { _id: new ObjectId(wid), userId },
        update: { $set: { order: idx } },
      },
    }));
    if (!bulk.length) return { ok: 1, n: 0 };
    return await watchlist.bulkWrite(bulk, { ordered: true });
  }
}

export default WatchlistDAO;