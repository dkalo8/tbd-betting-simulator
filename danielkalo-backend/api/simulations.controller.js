import Game from "../src/models/Game.js";
import SimulationsDAO from "../dao/simulationsDAO.js";
import { runMonteCarlo } from "../utilities/simulationUtilities.js";

class SimulationsController {
  static async apiGetSimulations(req, res, next) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 0;
      const simsPerPage = parseInt(req.query.simsPerPage) || 20;

      const { simsList, totalNumSims } = await SimulationsDAO.getSimulations({
        filters: { userId },
        page,
        simsPerPage,
      });

      res.json({ sims: simsList, total_results: totalNumSims });
    } catch (e) {
      console.error(`apiGetSimulations error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiGetSimulationById(req, res, next) {
    try {
      const sim = await SimulationsDAO.getSimulationById(req.params.id);
      if (!sim) {
        res.status(404).json({ error: "Simulation not found" });
        return;
      }
      res.json(sim);
    } catch (e) {
      console.error(`apiGetSimulationById error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiAddSimulation(req, res, next) {
    try {
      const userId = req.user._id;
      const { gameId, params } = req.body;

      // 1) Fetch the game document (so we can read its ML odds)
      const game = await Game.findById(gameId).lean();
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      // 2) Run Monte Carlo simulation against those odds
      const result = runMonteCarlo(game, params);

      // 3) Persist under the logged-in user
      const insertResult = await SimulationsDAO.addSimulation(
        userId, { gameId, params, result, home: game.home, away: game.away }
      );
      // Make the most recent simulation Sim #1 and push others down
      await SimulationsDAO.bumpNewSimulationToTop(userId, insertResult.insertedId);

      // 4) Return the newly created doc
      res.status(201).json(insertResult);
    } catch (e) {
      console.error(`apiAddSimulation error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiUpdateSimulation(req, res, next) {
    try {
      const userId = req.user._id;
      const { simulationId, updateData } = req.body;
      const updateResponse = await SimulationsDAO.updateSimulation(
        simulationId,
        userId,
        updateData
      );
      res.json(updateResponse);
    } catch (e) {
      console.error(`apiUpdateSimulation error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiDeleteSimulation(req, res, next) {
    try {
      const userId = req.user._id;
      const { simulationId } = req.body;
      const deleteResponse = await SimulationsDAO.deleteSimulation(
        simulationId,
        userId
      );
      res.json(deleteResponse);
    } catch (e) {
      console.error(`apiDeleteSimulation error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiUpdateOrder(req, res, next) {
    try {
      const userId = req.user._id;
      const { order } = req.body; // array of simulation IDs
      const response = await SimulationsDAO.updateOrder(order, userId);
      res.json({ success: true, result: response })
    } catch (e) {
      console.error(`apiUpdateOrder error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }
}

export default SimulationsController;