import { Request, Response } from 'express';

/**
 * Controller to handle user deposit requests (e.g., triggering STK Push)
 */
export const initiateDeposit = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required.'
      });
    }

    // TODO: Add your Safaricom Daraja API STK Push logic here
    console.log(`Initiating M-Pesa deposit of KES ${amount} for phone number ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: 'STK push prompt sent successfully. Please check your phone and enter your M-Pesa PIN.'
    });
  } catch (error: any) {
    console.error('M-Pesa Deposit Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate M-Pesa deposit.',
      error: error.message
    });
  }
};

/**
 * Controller to handle incoming webhooks/callbacks from Safaricom after transaction completion
 */
export const handleCallback = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('M-Pesa Callback Payload Received:', JSON.stringify(req.body, null, 2));

    // Here you would typically parse the callback metadata, check if the transaction succeeded,
    // and update the user's wallet balance in MongoDB.

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: any) {
    console.error('M-Pesa Callback Error:', error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Server Error' });
  }
};