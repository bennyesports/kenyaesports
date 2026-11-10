import { Router } from 'express';
import {
  createMatch,
  getPendingMatches,
  joinMatch,
  completeMatch,
} from '../controllers/matchController';

const router = Router();

router.post('/create', createMatch);
router.get('/pending', getPendingMatches);
router.post('/join', joinMatch);
router.post('/complete', completeMatch);

export default router;