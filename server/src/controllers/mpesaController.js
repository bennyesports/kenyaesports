const axios = require('axios');

// Helper to generate Safaricom timestamp (YYYYMMDDHHmmss)
const getTimestamp = () => {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
};

// 1. Generate Daraja OAuth Access Token middleware
const generateAccessToken = async (req, res, next) => {
    try {
        const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
        const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
            console.error("❌ ERROR: Missing Safaricom Consumer Key or Secret in .env");
            return res.status(500).json({ success: false, error: "Missing Safaricom credentials in .env" });
        }

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );

        req.token = response.data.access_token;
        console.log("🔑 Safaricom Token Generated Successfully");
        next();
    } catch (error) {
        console.error("❌ M-Pesa Access Token Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to generate M-Pesa access token",
            details: error.response?.data || error.message
        });
    }
};

// 2. Initiate STK Push
const stkPush = async (req, res) => {
    try {
        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({ success: false, error: "Phone number and amount are required." });
        }

        const accessToken = req.token;
        const shortCode = process.env.SAFARICOM_SHORTCODE || "174379";
        const passkey = process.env.SAFARICOM_PASSKEY;
        const callbackUrl = process.env.CALLBACK_URL || "https://sandbox.safaricom.co.ke/mpesa";

        const timestamp = getTimestamp();
        
        // Encode password using Shortcode + Passkey + Timestamp
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Number(amount),
            PartyA: phone,
            PartyB: shortCode,
            PhoneNumber: phone,
            CallBackURL: callbackUrl,
            AccountReference: "GamingPlatform",
            TransactionDesc: "Esports Tournament Entry"
        };

        console.log("🚀 Sending STK Push request to Safaricom for phone:", phone);

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("✅ STK Push Success Response:", response.data);
        return res.status(200).json({
            success: true,
            message: "STK Push sent successfully",
            data: response.data
        });

    } catch (error) {
        console.error("❌ STK Push Execution Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to initiate STK Push",
            details: error.response?.data || error.message
        });
    }
};

module.exports = {
    generateAccessToken,
    stkPush
};