import React, { useState, useEffect } from 'react';
import './App.css';

// Uses your Netlify environment variable, falling back to your Render backend if not set
const API_URL = import.meta.env.VITE_API_URL || 'https://kenyaesports.onrender.com';

function App() {
  const [events, setEvents] = useState([]);
  const [walletBalance, setWalletBalance] = useState(4500); // Example initial wallet balance
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch tournaments from your backend API
  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          // Fallback mock tournaments for immediate testing
          setEvents([
            { _id: '1', title: 'FIFA 26 Pro Showdown', gameId: 'EA Sports FC', entryFee: 50, prizePool: 5000 },
            { _id: '2', title: 'Comrades Ludo Championship', gameId: 'Ludo King Mobile', entryFee: 20, prizePool: 2000 }
          ]);
        }
      })
      .catch(err => {
        console.error("Error fetching events, loading fallback data:", err);
        setEvents([
          { _id: '1', title: 'FIFA 26 Pro Showdown', gameId: 'EA Sports FC', entryFee: 50, prizePool: 5000 },
          { _id: '2', title: 'Comrades Ludo Championship', gameId: 'Ludo King Mobile', entryFee: 20, prizePool: 2000 }
        ]);
      });
  }, []);

  // Format phone number to standard 254XXXXXXXXX required by Safaricom Daraja API
  const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, ''); // Remove all non-numeric characters
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1);
    }
    return cleaned;
  };

  // Handle Automated M-Pesa STK Push Deposit
  const handleStkPushDeposit = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !amount) {
      alert("Please enter both your M-Pesa phone number and deposit amount.");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    setLoading(true);
    setMessage('Sending STK Push prompt to your phone...');

    try {
      const response = await fetch(`${API_URL}/api/mpesa/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone, amount: Number(amount) })
      });

      const data = await response.json();

      if (response.ok && (data.success || data.ResponseCode === "0")) {
        setMessage('✅ STK Push prompt sent! Check your phone to enter your M-Pesa PIN.');
      } else {
        setMessage('❌ STK Push failed: ' + (data.message || data.error || data.errorMessage || 'Unknown error'));
      }
    } catch (error) {
      console.error('STK Push Error:', error);
      setMessage('❌ Network error connecting to Render backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', background: '#121212', color: '#fff', borderRadius: '10px' }}>
      
      {/* Top Header with Wallet & Deposit Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1 style={{ color: '#00ffcc', margin: 0, fontSize: '24px' }}>🎮 KenyaEsports</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ background: '#1e1e1e', padding: '8px 15px', borderRadius: '20px', border: '1px solid #00ffcc', color: '#00ffcc', fontWeight: 'bold' }}>
            Wallet: {walletBalance} KES
          </span>
          <button 
            onClick={() => setShowDepositModal(true)}
            style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '10px 18px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}
          >
            Deposit
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '30px' }}>Compete in top matches & deposit instantly via automated M-Pesa STK Push</p>

      {/* Live Tournaments Section */}
      <h2>🏆 Live Tournaments</h2>
      {events.length === 0 ? (
        <p>Loading active tournaments...</p>
      ) : (
        events.map((ev) => (
          <div key={ev._id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #00ffcc' }}>
            <h3>{ev.title}</h3>
            <p>Game: <strong>{ev.gameId}</strong> | Entry Fee: <strong>KES {ev.entryFee}</strong> | Prize Pool: <strong>KES {ev.prizePool}</strong></p>
          </div>
        ))
      )}

      {/* STK Push Deposit Modal Overlay */}
      {showDepositModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #00ffcc', position: 'relative' }}>
            
            <button 
              onClick={() => setShowDepositModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h2 style={{ color: '#00ffcc', marginTop: 0, marginBottom: '20px' }}>📱 M-Pesa STK Push Deposit</h2>
            
            <form onSubmit={handleStkPushDeposit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>Amount (KES)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 100" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#ccc' }}>M-Pesa Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0712345678 or 2547..." 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: '#00ffcc', color: '#000', border: 'none', padding: '12px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}
              >
                {loading ? 'Triggering STK Push...' : 'Trigger M-Pesa STK Push'}
              </button>
            </form>

            {message && <p style={{ marginTop: '15px', padding: '10px', background: '#262626', borderRadius: '5px', fontSize: '14px', textAlign: 'center' }}>{message}</p>}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;