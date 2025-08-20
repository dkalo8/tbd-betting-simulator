import Game from "../../src/models/Game.js";
import SimulationsDAO from "../../dao/simulationsDAO.js";
import { runMonteCarlo } from "../../utilities/simulationUtilities.js";
import { fetchOddsForSport } from "../theOddsAPI.js";
import { normalizeEventToBookmakerOdds } from "../../scripts/pullOdds.js";

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
      const { gameId, params, includeOdds = true } = req.body;

      // 1) Fetch the game document (so we can read its ML odds)
      const gameDoc = await Game.findById(gameId);
      if (!gameDoc) {
        return res.status(404).json({ error: "Game not found" });
      }

      // 1a) (Optional) Targeted bookmaker refresh for this event, cheap on quota
      try {
        if (includeOdds && gameDoc?.ext?.provider === 'odds_api' && gameDoc?.ext?.id && gameDoc?.sport) {
          const { data } = await fetchOddsForSport({
            sportKey: gameDoc.sport,
            eventIds: gameDoc.ext.id,
          });
          const ev = Array.isArray(data) ? data.find(d => d.id === gameDoc.ext.id) : data?.[0];
          if (ev) {
            const prices = normalizeEventToBookmakerOdds(ev);
            gameDoc.bookmakerOdds = prices;
            gameDoc.lastUpdated = new Date();
            await gameDoc.save();
          }
        }
      } catch (e) {
        console.warn("Targeted odds refresh failed (continuing with cached):", e?.message);
      }

      // 2) Run Monte Carlo simulation against those odds
      const result = runMonteCarlo(gameDoc.toObject(), params);

      // 3) Persist under the logged-in user
      const insertResult = await SimulationsDAO.addSimulation(
        userId,
        { gameId, params, result, home: gameDoc.home, away: gameDoc.away }
      );
      // Make the most recent simulation Sim #1 and push others down
      await SimulationsDAO.bumpNewSimulationToTop(userId, insertResult.insertedId);

      // 4) Return the newly created doc (+ bookmaker table for the UI)
      const bookmakerTable = (gameDoc.bookmakerOdds || []).map(book => ({
        bookmaker: book.bookmaker,
        homeML: book.h2h?.homeML ?? null,
        awayML: book.h2h?.awayML ?? null,
        drawML: book.h2h?.drawML ?? null,
      }));

      res.status(201).json({ ...insertResult, result, bookmakerTable });
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