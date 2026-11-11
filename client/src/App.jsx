import React, { useState, useEffect } from 'react';
import './App.css';

// Uses your Netlify environment variable, falling back to your Render backend if not set
const API_URL = import.meta.env.VITE_API_URL || 'https://kenyaesports.onrender.com';

function App() {
  const [events, setEvents] = useState([]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch tournaments from your backend API with fallback mock tournaments for testing
  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          // Fallback mock tournaments so you can test live payment right away
          setEvents([
            { _id: '1', title: 'FIFA 26 Pro Showdown', gameId: 'EA Sports FC', entryFee: 50, prizePool: 5000 },
            { _id: '2', title: 'Comrades Ludo Championship', gameId: 'Ludo King Mobile', entryFee: 20, prizePool: 2000 }
          ]);
        }
      })
      .catch(err => {
        console.error("Error fetching events, loading fallback data:", err);
        // Fallback mock tournaments on network error
        setEvents([
          { _id: '1', title: 'FIFA 26 Pro Showdown', gameId: 'EA Sports FC', entryFee: 50, prizePool: 5000 },
          { _id: '2', title: 'Comrades Ludo Championship', gameId: 'Ludo King Mobile', entryFee: 20, prizePool: 2000 }
        ]);
      });
  }, []);

  // Handle M-Pesa Payment Trigger
  const handlePay = async (fee) => {
    if (!phone) {
      alert("Please enter your M-Pesa phone number (e.g., 2547XXXXXXXX)");
      return;
    }

    setLoading(true);
    setMessage('Sending STK Push prompt to your phone...');

    try {
      const response = await fetch(`${API_URL}/api/mpesa/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, amount: fee })
      });
      const data = await response.json();

      if (data.success) {
        setMessage('✅ STK Push prompt sent successfully! Check your phone.');
      } else {
        setMessage('❌ Payment failed: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('M-Pesa Network Error:', error);
      setMessage('❌ Network error connecting to Render backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', background: '#121212', color: '#fff', borderRadius: '10px' }}>
      <h1 style={{ color: '#00ffcc', textAlign: 'center' }}>🎮 KenyaEsports Tournament Arena</h1>
      <p style={{ textAlign: 'center', color: '#aaa' }}>Compete in top matches & pay instantly via M-Pesa STK Push</p>

      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>📱 Enter M-Pesa Number for Entry Fees</h3>
        <input 
          type="text" 
          placeholder="e.g. 254708374149" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '10px', width: '100%', maxWidth: '300px', marginRight: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
        />
      </div>

      <h2>🏆 Live Tournaments</h2>
      {events.length === 0 ? (
        <p>Loading active tournaments...</p>
      ) : (
        events.map((ev) => (
          <div key={ev._id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #00ffcc' }}>
            <h3>{ev.title}</h3>
            <p>Game: <strong>{ev.gameId}</strong> | Entry Fee: <strong>KES {ev.entryFee}</strong> | Prize Pool: <strong>KES {ev.prizePool}</strong></p>
            <button 
              onClick={() => handlePay(ev.entryFee)}
              disabled={loading}
              style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}
            >
              {loading ? 'Processing...' : `Pay KES ${ev.entryFee} & Join`}
            </button>
          </div>
        ))
      )}

      {message && <p style={{ marginTop: '20px', padding: '10px', background: '#333', borderRadius: '5px' }}>{message}</p>}
    </div>
  );
}

export default App;
