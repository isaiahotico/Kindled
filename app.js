// User data
let balance = 0;
let streak = 0;
let level = 1;
let referrals = 0;
let withdrawHistory = [];

// Page navigation
function showPage(page) {
  ['landing','ads','dashboard','profile'].forEach(p=>{
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(page).classList.remove('hidden');
  updateUI();
}

// Update UI elements
function updateUI() {
  ['balanceAds','balanceDash'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerText = `Balance: ₱${balance.toFixed(3)}`;
  });
  const streakEl = document.getElementById('streak');
  if(streakEl) streakEl.innerText = `Daily Streak: ${streak}`;
  const levelEl = document.getElementById('level');
  if(levelEl) levelEl.innerText = `Level: ${level}`;
  const refEl = document.getElementById('referrals');
  if(refEl) refEl.innerText = `Referrals: ${referrals}`;
  const historyEl = document.getElementById('withdrawHistory');
  if(historyEl) {
    historyEl.innerHTML = withdrawHistory.map(w=>`<div>₱${w.amount.toFixed(2)} → ${w.gcash}</div>`).join('');
  }
}

// Reward function
function rewardUser(amount=0.025){
  balance += amount;
  streak++;
  if(streak % 50 === 0) level++;
  updateUI();
}

// Withdraw function
function withdrawGCash(){
  const gcash = document.getElementById('gcashNumber').value;
  if(!gcash){ alert('Enter your GCash number'); return; }
  if(balance < 0.025){ alert('Insufficient balance'); return; }
  withdrawHistory.push({amount:balance,gcash});
  balance=0;
  updateUI();
  alert('Withdrawal request sent!');
}

// Monetag Ads sequence
document.addEventListener('DOMContentLoaded',()=>{
  const watchBtn = document.getElementById('watchAdsBtn');
  if(!watchBtn) return;

  watchBtn.addEventListener('click', async ()=>{
    for(let i=0;i<4;i++){
      try{
        await show_10276123(); rewardUser();
        await show_10276123('pop'); rewardUser();
        await show_10276123({type:'inApp', inAppSettings:{frequency:1, capping:0.1, interval:10, timeout:2, everyPage:false}}); rewardUser();
      }catch(e){ console.warn('Ad error:', e);}
    }
  });
});

// Initialize UI
showPage('landing');
