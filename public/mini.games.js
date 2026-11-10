// public/mini-games.js

function renderMiniGames(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
      
      <!-- 1-HOUR TOP SENDER POT -->
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 2px solid #6366f1; border-radius: 14px; padding: 18px; color: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; color: #a5b4fc;">⏱️ 1-Hour Top Sender Pot</h3>
          <span style="background: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">LIVE</span>
        </div>
        <p style="font-size: 12px; color: #cbd5e1; margin: 4px 0;">Highest sender within 60 mins wins 80% of the active pot!</p>
        <div style="margin: 12px 0; font-size: 20px; font-weight: 800; color: #38bdf8;">
          Live Pool: <span id="hourly-pot-total">12,400 KES</span>
        </div>
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 14px;">
          Current Leader: <strong id="hourly-pot-leader" style="color: #facc15;">@Omondi_KE (3,000 KES)</strong>
        </div>
        <button onclick="handleTopSender()" style="width: 100%; background: #6366f1; color: white; font-weight: bold; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px;">
          Send Money & Take Lead
        </button>
      </div>

      <!-- 10 BOB MYSTERY BOX -->
      <div style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); border: 2px solid #10b981; border-radius: 14px; padding: 18px; color: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; color: #6ee7b7;">🎁 10 Bob Mystery Box</h3>
          <span style="background: #047857; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">INSTANT</span>
        </div>
        <p style="font-size: 12px; color: #cbd5e1; margin: 4px 0;">Pay 10 Bob to pick 1 of 6 mystery boxes and win up to 50 KES!</p>
        
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin: 12px 0;">
          ${[1, 2, 3, 4, 5, 6].map(num => `
            <button id="box-btn-${num}" onclick="playMysteryBox(${num})" style="background: #065f46; border: 1px solid #34d399; color: white; font-weight: bold; padding: 10px 0; border-radius: 6px; cursor: pointer; font-size: 14px;">🎁</button>
          `).join('')}
        </div>
        <button onclick="playMysteryBox('random')" style="width: 100%; background: #10b981; color: white; font-weight: bold; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px;">
          Pay 10 Bob & Pick Box
        </button>
      </div>

    </div>
  `;

  fetchPotStatus();
}

async function fetchPotStatus() {
  try {
    const res = await fetch('/api/minigames/top-sender-status');
    const data = await res.json();
    if (data.success) {
      const potEl = document.getElementById('hourly-pot-total');
      const leaderEl = document.getElementById('hourly-pot-leader');
      if (potEl) potEl.innerText = `${data.activePool.toLocaleString()} KES`;
      if (leaderEl) leaderEl.innerText = `${data.currentLeader} (${data.leaderAmount.toLocaleString()} KES)`;
    }
  } catch (err) {
    console.error('Error fetching pot:', err);
  }
}

async function handleTopSender() {
  const token = localStorage.getItem('token');
  if (!token) return alert('Please log in to contribute to the pot.');
  const amount = prompt("Enter amount to send into the hourly pot (KES):", "100");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

  try {
    const res = await fetch('/api/minigames/top-sender-contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      if (typeof updateUserBalanceUI === 'function') updateUserBalanceUI(data.newBalance);
      fetchPotStatus();
    } else {
      alert(data.error || 'Contribution failed.');
    }
  } catch (err) {
    alert('Server error contributing to pot.');
  }
}

async function playMysteryBox(boxNumber) {
  const token = localStorage.getItem('token');
  if (!token) return alert('Please log in to play Mystery Box.');
  const selectedNum = boxNumber === 'random' ? Math.floor(Math.random() * 6) + 1 : boxNumber;
  const btn = document.getElementById(`box-btn-${selectedNum}`);
  if (btn) btn.innerText = '⏳';

  try {
    const res = await fetch('/api/minigames/mystery-box', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ stake: 10 })
    });
    const data = await res.json();
    if (data.success) {
      if (btn) btn.innerText = data.payout > 0 ? '💰' : '❌';
      alert(`Box #${selectedNum}: ${data.message}`);
      if (typeof updateUserBalanceUI === 'function') updateUserBalanceUI(data.newBalance);
    } else {
      alert(data.error || 'Mystery box failed.');
      if (btn) btn.innerText = '🎁';
    }
  } catch (err) {
    alert('Server error playing mystery box.');
    if (btn) btn.innerText = '🎁';
  }
}

function renderTipsterHub(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const predictions = [
    { id: 1, match: 'Arsenal vs Chelsea', market: 'Over 2.5 Goals', odds: 1.85, type: 'FREE' },
    { id: 2, match: 'Real Madrid vs Barcelona', market: 'Both Teams to Score', odds: 1.72, type: 'FREE' },
    { id: 3, match: 'VIP Weekend Multi-Bet (5 Games)', market: 'Accumulator', odds: 12.40, type: 'VIP' }
  ];

  container.innerHTML = `
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 20px; margin-top: 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
        <h3 style="color:#f59e0b; margin:0;">⚽ Sports Tipster & VIP Slips</h3>
        <span style="background:#047857; color:#fff; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold;">89% Win Rate</span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
        ${predictions.map(t => `
          <div style="background:#1f2937; border-radius:10px; padding:14px; border-left: 4px solid #f59e0b;">
            <div style="font-size:12px; color:#9ca3af;">${t.match}</div>
            <div style="font-size:14px; font-weight:bold; color:#fff; margin:4px 0;">Prediction: ${t.market}</div>
            <div style="font-size:13px; color:#10b981; font-weight:bold;">Odds: ${t.odds}</div>
            <button onclick="handleTipAction('${t.type}')" style="width:100%; margin-top:10px; background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#000; font-weight:800; border:none; border-radius:6px; padding:8px; cursor:pointer; font-size:11px;">
              ${t.type === 'FREE' ? 'PLACE BET ON BOOKMAKER' : 'UNLOCK VIP SLIP (50 BOB)'}
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function handleTipAction(type) {
  if (type === 'FREE') window.open('https://www.sportybet.com', '_blank');
  else alert('VIP Slip unlocked! Check your notifications.');
}