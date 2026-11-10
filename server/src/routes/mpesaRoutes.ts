import { Router } from 'express';
import { depositFunds, mpesaCallback } from '../controllers/mpesaController';

const router = Router();

router.post('/deposit', depositFunds);
router.post('/callback', mpesaCallback);

export default router;