// server/src/routes/mpesaRoutes.ts
import { Router } from 'express';
import { initiateDeposit, handleCallback } from '../controllers/mpesaController';

const router = Router();

/**
 * @route   POST /api/mpesa/deposit
 * @desc    Initiate an M-Pesa STK push for user deposits
 * @access  Public (or Protected if you add auth middleware later)
 */
router.post('/deposit', initiateDeposit);

/**
 * @route   POST /api/mpesa/callback
 * @desc    Receive transaction status updates/callbacks from Safaricom Daraja API
 * @access  Public (Safaricom servers need open access to post here)
 */
router.post('/callback', handleCallback);

export default router;