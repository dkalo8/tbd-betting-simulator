import { ObjectId } from "mongodb";

let simulations;

class SimulationsDAO {
  /**
   * Initialize the simulations collection handle
   */
  static async injectDB(conn) {
    if (simulations) return;

    try {
      const db =
        typeof conn.db === "function"
          ? conn.db(process.env.SPORTS_SIMS_DB)
          : conn;

      simulations = db.collection(
        process.env.SPORTS_SIMS_COLLECTION || "simulations"
      );
      console.log("SimulationsDAO connected to collection");

      await simulations.createIndex({ userId: 1, order: 1 });
      await simulations.createIndex({ userId: 1, createdAt: -1 });
    } catch (e) {
      console.error(`Unable to establish collection handle in SimulationsDAO: ${e}`);
    }
  }

  /**
   * Fetch a paginated list of simulations for a user
   * Deterministic: prefer explicit `order`, fall back to most-recent-first.
   */
  static async getSimulations({ filters = {}, page = 0, simsPerPage = 20 } = {}) {
    const query = {};
    if (filters.userId) {
      query.userId = filters.userId;
    }

    try {
      const hasOrder =
        (await simulations.countDocuments({ ...query, order: { $exists: true } })) > 0;

      // If this user has any `order` fields, sort by it; otherwise fallback to createdAt desc.
      const sortSpec = hasOrder ? { order: 1, createdAt: -1 } : { createdAt: -1 };

      const cursor = simulations
        .find(query)
        .sort(sortSpec)
        .skip(page * simsPerPage)
        .limit(simsPerPage);

      const simsList = await cursor.toArray();
      const totalNumSims = await simulations.countDocuments(query);

      return { simsList, totalNumSims };
    } catch (e) {
      console.error(`Unable to fetch simulations: ${e}`);
      return { simsList: [], totalNumSims: 0 };
    }
  }

  /**
   * Fetch a single simulation by its ID
   */
  static async getSimulationById(id) {
    try {
      return await simulations.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      console.error(`Error in getSimulationById: ${e}`);
      throw e;
    }
  }

  /**
   * Add a new simulation document
   * Behavior: new sim appears at the TOP (order: 0); existing sims are pushed down by 1.
   * This preserves the “most recently run on top” default while still allowing manual reordering later.
   */
  static async addSimulation(userId, simData) {
    try {
      // Push existing sims down for this user
      await simulations.updateMany({ userId }, { $inc: { order: 1 } });

      const now = new Date();
      const simDoc = {
        userId,
        ...simData,
        order: 0, // new one goes to the very top
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId } = await simulations.insertOne(simDoc);
      return { _id: insertedId, ...simDoc };
    } catch (e) {
      console.error(`Unable to post simulation: ${e}`);
      return { error: e };
    }
  }

  /**
   * Update simulation fields (e.g., modify fields on a single sim)
   */
  static async updateSimulation(simulationId, userId, updateData) {
    try {
      return await simulations.updateOne(
        { _id: new ObjectId(simulationId), userId },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
    } catch (e) {
      console.error(`Unable to update simulation: ${e}`);
      return { error: e };
    }
  }

  /**
   * Delete a simulation document
   */
  static async deleteSimulation(simulationId, userId) {
    try {
      return await simulations.deleteOne({
        _id: new ObjectId(simulationId),
        userId,
      });
    } catch (e) {
      console.error(`Unable to delete simulation: ${e}`);
      return { error: e };
    }
  }

  /**
   * Persist a new manual order from the client (drag & drop).
   * `orderIds` is an array of simulation _id strings in desired top->bottom order.
   */
  static async updateOrder(orderIds, userId) {
    try {
      if (!Array.isArray(orderIds)) {
        throw new Error("orderIds must be an array");
      }

      const ops = orderIds.map((id, idx) => ({
        updateOne: {
          filter: { _id: new ObjectId(id), userId }, // userId is a STRING in your schema
          update: { $set: { order: idx, updatedAt: new Date() } },
        },
      }));

      if (ops.length === 0) return { matchedCount: 0, modifiedCount: 0 };

      const res = await simulations.bulkWrite(ops, { ordered: false });
      return res;
    } catch (e) {
      console.error(`Unable to reorder simulations: ${e}`);
      return { error: e };
    }
  }

  /**
   * (Optional helper) Put an already-inserted simulation at the top.
   * Not used by addSimulation anymore, but safe to keep if referenced elsewhere.
   */
  static async bumpNewSimulationToTop(userId, insertedId) {
    try {
      await simulations.updateMany(
        { userId, _id: { $ne: insertedId } },
        { $inc: { order: 1 } }
      );
      await simulations.updateOne(
        { _id: insertedId },
        { $set: { order: 0, updatedAt: new Date() } }
      );
    } catch (e) {
      console.error(`Unable to bump simulation to top: ${e}`);
      return { error: e };
    }
  }
}

export default SimulationsDAO;