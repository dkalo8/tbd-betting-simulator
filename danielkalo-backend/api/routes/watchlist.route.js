import express from "express";
import WatchlistController from "../controllers/watchlist.controller.js";

const router = express.Router();

router.get("/", WatchlistController.apiList);
router.post("/", WatchlistController.apiAdd);
router.delete("/:gameId", WatchlistController.apiRemove);
router.delete("/sim/:simulationId", WatchlistController.apiRemoveBySimulation);
router.put("/order", WatchlistController.apiUpdateOrder);

export default router;