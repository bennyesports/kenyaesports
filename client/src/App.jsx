import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch tournaments from your backend API
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.events);
        }
      })
      .catch(err => console.error("Error fetching events:", err));
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
      const response = await fetch('http://localhost:5000/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: fee })
      });
      const data = await response.json();

      if (data.success) {
        setMessage('✅ STK Push prompt sent! Check your phone.');
      } else {
        setMessage('❌ Payment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setMessage('❌ Network error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '40px auto', padding: '20px', background: '#121212', color: '#fff', borderRadius: '10px' }}>
      <h1 style={{ color: '#00ffcc', textAlign: 'center' }}>🎮 Esports Tournament Arena</h1>
      <p style={{ textAlign: 'center', color: '#aaa' }}>Compete in top matches & pay instantly via M-Pesa STK Push</p>

      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>📱 Enter M-Pesa Number for Entry Fees</h3>
        <input 
          type="text" 
          placeholder="e.g. 254741146267" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '10px', width: '100%', maxWidth: '300px', marginRight: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
        />
      </div>

      <h2>🏆 Live Tournaments</h2>
      {events.length === 0 ? (
        <p>Loading active tournaments from MongoDB Atlas...</p>
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