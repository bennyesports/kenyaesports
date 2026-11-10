require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your M-Pesa controller functions
const { generateAccessToken, stkPush } = require('./server/controllers/mpesaController');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Event Schema & Model for Tournaments
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    gameId: { type: String, required: true },
    entryFee: { type: Number, required: true },
    prizePool: { type: Number, required: true },
    eventDate: { type: String, required: true },
    maxParticipants: { type: Number, default: 16 }
});

const Event = mongoose.model('Event', eventSchema);

// --- ROUTES ---

// Health check / status route
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "Esports Platform Backend is live and running!" });
});

// Get all tournaments/events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a test tournament/event (Admin)
app.post('/api/admin/events/create', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json({ success: true, message: "Event created successfully", event: newEvent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// M-Pesa STK Push Route (Protected by generateAccessToken middleware)
app.post('/api/mpesa/stkpush', generateAccessToken, stkPush);

// Mini-games staking mock route
app.post('/api/minigames/mystery-box', (req, res) => {
    res.status(200).json({ success: true, message: "Mystery Box stake processed", payout: 0 });
});

// Dynamic Port Binding for Render & cloud deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});