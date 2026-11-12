require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Error:', err));

// User Model Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 1. SIGN UP / REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const user = new User({ username, phone, password, balance: 0 });
    await user.save();
    
    res.status(201).json({ 
      message: 'Account created successfully', 
      user: { id: user._id, username: user.username, phone: user.phone, balance: 0 } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SIGN IN / LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    res.json({ 
      message: 'Login successful', 
      user: { id: user._id, username: user.username, phone: user.phone, balance: user.balance } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET USER BALANCE ROUTE
app.get('/api/auth/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. M-PESA STK PUSH ROUTE (DEPOSIT)
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, userId } = req.body;
    let formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');

    console.log(`STK Push initiated for KES ${amount} to ${formattedPhone}`);

    // Update wallet balance upon trigger
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { balance: Number(amount) } });
    }

    res.json({ success: true, message: 'STK Push sent! Check your phone to enter M-Pesa PIN.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. M-PESA WITHDRAWAL ROUTE (PAYOUT)
app.post('/api/mpesa/withdraw', async (req, res) => {
  try {
    const { phone, amount, userId } = req.body;
    const user = await User.findById(userId);

    if (!user || user.balance < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $inc: { balance: -Number(amount) } },
      { new: true }
    );

    let formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');
    console.log(`Withdrawal of KES ${amount} processed for ${formattedPhone}`);

    res.json({ 
      success: true, 
      balance: updatedUser.balance, 
      message: 'Withdrawal request processed successfully!' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Kenya Esports Backend API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
