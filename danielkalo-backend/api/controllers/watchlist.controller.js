import WatchlistDAO from "../../dao/watchlistDAO.js";

const getUserId = (req) =>
  req.user?._id || req.user?.sub || req.user?.userId || req.user;

class WatchlistController {
  static async apiList(req, res) {
    try {
      const items = await WatchlistDAO.listWithGames(getUserId(req));
      res.json({ items });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed_to_list_watchlist" });
    }
  }

  static async apiAdd(req, res) {
    try {
      const { gameId, simResult, simulationId } = req.body || {};
      if (!gameId) return res.status(400).json({ error: "gameId_required" });

      await WatchlistDAO.upsert(getUserId(req), gameId, { simResult, simulationId });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed_to_add_watchlist" });
    }
  }

  static async apiRemove(req, res) {
    try {
      await WatchlistDAO.remove(getUserId(req), req.params.gameId);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed_to_remove_watchlist" });
    }
  }

  static async apiRemoveBySimulation(req, res) {
    try {
      await WatchlistDAO.removeBySimulation(getUserId(req), req.params.simulationId);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed_to_remove_watchlist_sim" });
    }
  }

  static async apiUpdateOrder(req, res) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids_array_required" });
      
      await WatchlistDAO.updateOrder(ids, getUserId(req));
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed_to_update_order" });
    }
  }
}

export default WatchlistController;