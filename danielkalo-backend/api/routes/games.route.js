import express from 'express';
import GamesController from '../controllers/games.controller';

const router = express.Router();

router.get('/', GamesController.apiGetGames);
router.get('/leagues', GamesController.apiGetLeagues);
router.get('/:id/odds', GamesController.apiGetBookmakerOdds);

export default router;