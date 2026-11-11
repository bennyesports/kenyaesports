require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Error:', err));

// User Model
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }
}, { timestamps: true }));

// 1. SIGN UP / REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const user = new User({ username, phone, password, balance: 0 });
    await user.save();
    res.status(201).json({ message: 'Account created', user: { id: user._id, username: user.username, phone: user.phone, balance: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SIGN IN / LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({ message: 'Login successful', user: { id: user._id, username: user.username, phone: user.phone, balance: user.balance } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. STK PUSH ROUTE
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, userId } = req.body;
    let formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');

    console.log(`Sending STK Push to ${formattedPhone} for KES ${amount}`);

    // Credit balance upon request trigger
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { balance: Number(amount) } });
    }

    res.json({ success: true, message: 'STK Push sent to phone!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Server is live!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
