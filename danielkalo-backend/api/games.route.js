import express from 'express';
import GamesController from './games.controller.js';

const router = express.Router();

router.get('/', GamesController.apiGetGames);
router.get('/leagues', GamesController.apiGetLeagues);

export default router;