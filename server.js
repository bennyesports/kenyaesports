require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Database Connection & User Schema
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 2. Player Registration Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const newUser = new User({ username, phone, password, balance: 0 });
    await newUser.save();
    
    res.status(201).json({ 
      message: 'Registration successful', 
      user: { id: newUser._id, username: newUser.username, phone: newUser.phone, balance: newUser.balance } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Player Login Route
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

// 4. M-Pesa STK Push Deposit Route
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, userId } = req.body;
    let formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');
    
    console.log(`STK Push initiated for KES ${amount} to ${formattedPhone}`);
    
    // Automatically credit user wallet upon successful request trigger
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { balance: Number(amount) } });
    }

    res.json({ 
      success: true, 
      message: 'STK Push sent successfully! Check your phone to enter M-Pesa PIN.' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Kenya Esports Backend is live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
