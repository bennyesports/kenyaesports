import { Request, Response } from 'express';
import axios from 'axios';

// Helper to generate Safaricom timestamp (YYYYMMDDHHmmss)
const getTimestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Step 1: Generate OAuth Access Token from Daraja
const getAccessToken = async (): Promise<string> => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
  const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';

  const authUrl = environment === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(authUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return response.data.access_token;
};

/**
 * Step 2: Initiate STK Push (Lipa Na M-Pesa Online)
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

    let formattedPhone = phoneNumber.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const accessToken = await getAccessToken();
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://kenyaesports.onrender.com/api/mpesa/callback';

    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(Number(amount)),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'KenyaEsports',
      TransactionDesc: 'Wallet Deposit'
    };

    const darajaResponse = await axios.post(stkUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'STK push prompt sent successfully to your phone.',
      data: darajaResponse.data
    });

  } catch (error: any) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate M-Pesa deposit.',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Step 3: Handle Safaricom Daraja Webhook Callback
 */
export const handleCallback = async (req: Request, res: Response): Promise<Response> => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback Payload:', JSON.stringify(callbackData, null, 2));

    const stkCallback = callbackData.Body?.stkCallback;
    if (stkCallback) {
      const resultCode = stkCallback.ResultCode;
      if (resultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata?.Item;
        let amountPaid = 0;
        let mpesaReceipt = '';
        let phoneNumber = '';

        callbackMetadata?.forEach((item: { Name: string; Value: any }) => {
          if (item.Name === 'Amount') amountPaid = item.Value;
          if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
          if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
        });

        console.log(`Payment confirmed! Receipt: ${mpesaReceipt}, Amount: ${amountPaid}, Phone: ${phoneNumber}`);
      } else {
        console.log(`Payment failed or cancelled by user. Reason: ${stkCallback.ResultDesc}`);
      }
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: any) {
    console.error('M-Pesa Callback Processing Error:', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Received with errors' });
  }
};

// Aliases to support any route imports looking for depositFunds or mpesaCallback
export const depositFunds = initiateDeposit;
export const mpesaCallback = handleCallback;
