import express from "express";
import SimulationsController from "../controllers/simulations.controller.js";

const router = express.Router();

router
  .route("/")
  .get(SimulationsController.apiGetSimulations)
  .post(SimulationsController.apiAddSimulation)
  .put(SimulationsController.apiUpdateSimulation)
  .delete(SimulationsController.apiDeleteSimulation);

router.route("/:id").get(SimulationsController.apiGetSimulationById);

router
  .route("/order")
  .put(SimulationsController.apiUpdateOrder);

export default router;