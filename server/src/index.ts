import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you use individual credentials instead of a connection string, comment out 
  // connectionString above and use user/host/database/password/port properties instead.
});

// Helper: Get Daraja Access Token
async function getDarajaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return response.data.access_token;
}

// 1. M-Pesa Deposit (STK Push) Endpoint
app.post('/api/mpesa/deposit', async (req: Request, res: Response) => {
  try {
    const { user_id, phone_number, amount } = req.body;

    if (!phone_number || !amount) {
      return res.status(400).json({ message: 'Phone number and amount are required' });
    }

    const accessToken = await getDarajaToken();
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const date = new Date();
    const timestamp = date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const requestBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone_number,
      PartyB: shortCode,
      PhoneNumber: phone_number,
      CallBackURL: process.env.MPESA_CALLBACK_URL, // Your ngrok callback URL
      AccountReference: 'GamingPlatform',
      TransactionDesc: 'Wallet Deposit',
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const checkoutRequestId = response.data.CheckoutRequestID;

    // Save pending transaction to PostgreSQL
    await pool.query(
      'INSERT INTO transactions (user_id, checkout_request_id, amount, status) VALUES ($1, $2, $3, $4)',
      [user_id || 1, checkoutRequestId, amount, 'pending']
    );

    return res.status(200).json({
      message: 'STK push sent successfully',
      data: response.data,
    });
  } catch (error: any) {
    console.error('STK Push Error:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to initiate STK push', error: error.message });
  }
});

// 2. M-Pesa Callback Endpoint
app.post('/api/mpesa/callback', async (req: Request, res: Response) => {
  try {
    const callbackData = req.body;
    const stkCallback = callbackData.Body?.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ message: 'Invalid callback structure' });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode; // 0 = Success

    if (resultCode === 0) {
      const metadataItems = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = metadataItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const mpesaReceiptNumber = receiptItem ? receiptItem.Value : null;

      console.log(`Payment successful! Receipt: ${mpesaReceiptNumber}, CheckoutID: ${checkoutRequestId}`);

      // Update transaction status to completed in PostgreSQL
      await pool.query(
        'UPDATE transactions SET status = $1, receipt = $2 WHERE checkout_request_id = $3',
        ['completed', mpesaReceiptNumber, checkoutRequestId]
      );
    } else {
      console.log(`Payment failed or cancelled: ${stkCallback.ResultDesc}`);

      // Update transaction status to failed in PostgreSQL
      await pool.query(
        'UPDATE transactions SET status = $1 WHERE checkout_request_id = $2',
        ['failed', checkoutRequestId]
      );
    }

    // Acknowledge receipt to Safaricom
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});