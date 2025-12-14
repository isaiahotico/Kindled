// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Owner Password
const OWNER_PASSWORD = "Propetas6";

// Telegram WebApp User Info
let telegramUser = {};
if(window.Telegram.WebApp){
  telegramUser = window.Telegram.WebApp.initDataUnsafe.user || {};
}
let userId = telegramUser.id || 'USER_'+Math.floor(Math.random()*1000000);
let username = telegramUser.username || telegramUser.first_name || `User${Math.floor(Math.random()*10000)}`;

// First-time registration
db.ref('users/'+userId).once('value', snap=>{
  if(!snap.exists()){
    db.ref('users/'+userId).set({username, balance:0, affiliateEarn:0, referrals:0, streak:0, level:1});
  }
});

// Local variables
let balance=0, streak=0, level=1, referrals=0, affiliateEarn=0;
let adsCount=0, giftsCount=0, giftsCooldown=false;

// Page navigation
function showPage(page){
  ['landing','ads','gifts','dashboard','profile','affiliate','worldChat','ownerLogin','owner'].forEach(p=>{
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(page).classList.remove('hidden');
  updateUI();
  if(page==='affiliate') updateAffiliateUI();
  if(page==='owner') updateOwnerUI();
  if(page==='worldChat') initWorldChat();
}

// UI Updates
function updateUI(){
  db.ref('users/'+userId).once('value', snap=>{
    const data = snap.val()||{};
    balance = data.balance || 0;
    streak = data.streak || 0;
    level = data.level || 1;
    referrals = data.referrals || 0;
    affiliateEarn = data.affiliateEarn || 0;

    document.getElementById('balanceAds').innerText = `Balance: ₱${balance.toFixed(3)}`;
    document.getElementById('balanceDash').innerText = `Balance: ₱${balance.toFixed(3)}`;
    document.getElementById('streak').innerText = `Daily Streak: ${streak}`;
    document.getElementById('level').innerText = `Level: ${level}`;
    document.getElementById('referrals').innerText = `Referrals: ${referrals}`;
    document.getElementById('affiliateEarn').innerText = `Affiliate Earned: ₱${affiliateEarn.toFixed(3)}`;
    document.getElementById('adsProgress').innerText = `Ads left: ${4-adsCount}`;
    document.getElementById('giftsProgress').innerText = `Ads left: ${4-giftsCount}`;
    document.getElementById('giftsCooldown').innerText = giftsCooldown ? "Cooldown active. Wait 5 minutes." : "";
  });
  updateWithdrawTable();
}

// Watch Ads
async function rewardAds(){
  if(adsCount<4){ adsCount++;
    if(adsCount===4){ 
      balance+=0.025; adsCount=0; 
      db.ref('users/'+userId).update({balance});
      alert("🎉 You earned ₱0.025!"); 
    } else alert(`You earn a reward, click again. Ads left: ${4-adsCount}`);
    updateUI();
  }
}

// Gifts
async function rewardGifts(){
  if(giftsCooldown) return alert("Cooldown active. Wait 5 minutes.");
  giftsCount++;
  if(giftsCount===4){
    balance+=0.03; giftsCount=0; giftsCooldown=true;
    db.ref('users/'+userId).update({balance});
    alert("🎁 You earned ₱0.03! Cooldown 5 min starts.");
    setTimeout(()=>{ giftsCooldown=false; updateUI(); }, 5*60*1000);
  } else alert(`You earn a gift reward, click again. Ads left: ${4-giftsCount}`);
  updateUI();
}

// Withdraw
function withdrawGCash(){
  const gcash = document.getElementById('gcashNumber').value.trim();
  if(!gcash) return alert("Enter GCash number");
  if(balance<0.025) return alert("Insufficient balance");

  const withdrawal = {userId, username, amount:balance, gcash, status:'Pending', timestamp:Date.now()};
  db.ref('withdrawals').push(withdrawal);
  balance=0; db.ref('users/'+userId).update({balance});
  updateUI();
  alert('Withdrawal request saved!');
}

// Withdraw table
function updateWithdrawTable(){
  const table = document.getElementById('withdrawTable');
  db.ref('withdrawals').orderByChild('userId').equalTo(userId).once('value', snap=>{
    const data = snap.val()||{};
    table.innerHTML='<tr><th>Amount</th><th>GCash</th><th>Status</th></tr>';
    Object.values(data).forEach(w=>{
      table.innerHTML+=`<tr><td>₱${w.amount.toFixed(2)}</td><td>${w.gcash}</td><td>${w.status}</td></tr>`;
    });
  });
}

// Ads integration
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('watchAdsBtn').addEventListener('click', async ()=>{
    for(let i=0;i<4;i++){ try{ await show_10276123(); rewardAds(); }catch(e){console.warn(e);} }
  });
  document.getElementById('giftsBtn').addEventListener('click', async ()=>{
    for(let i=0;i<4;i++){ try{ await show_10276123(); rewardGifts(); }catch(e){console.warn(e);} }
  });
  setInterval(()=>{ document.getElementById('currentDateTime').innerText=new Date().toLocaleString(); },1000);
});

// Affiliate
function updateAffiliateUI(){
  const table=document.getElementById('affiliateTable');
  const link=`http://t.me/SENTINEL_DARK_bot/start?start=${userId}`;
  table.innerHTML='<tr><th>Link</th><th>Claim Earnings</th></tr>';
  table.innerHTML+=`<tr><td><input type="text" value="${link}" readonly onclick="this.select()"/></td>
    <td><button onclick="claimAffiliate()" class="btn-neon">Claim</button></td></tr>`;
}
function claimAffiliate(){
  db.ref('users/'+userId+'/affiliateEarn').once('value',snap=>{
    const earn = snap.val()||0;
    if(earn<=0) return alert("No affiliate earnings");
    balance+=earn; db.ref('users/'+userId).update({balance, affiliateEarn:0});
    alert(`🎉 You claimed ₱${earn.toFixed(2)}!`);
    updateUI();
  });
}

// Profile Name
function changeName(){
  const newName=document.getElementById('profileNameInput').value.trim();
  if(!newName) return alert("Enter a name");
  username=newName;
  db.ref('users/'+userId).update({username});
  alert("Name updated!");
  updateUI();
}

// Owner
function loginOwner(){
  const pass=document.getElementById('ownerPass').value;
  if(pass===OWNER_PASSWORD) showPage('owner'), updateOwnerUI();
  else alert("Incorrect password");
}
function updateOwnerUI(){
  const el=document.getElementById('pendingWithdrawals');
  db.ref('withdrawals').once('value', snap=>{
    const data = snap.val()||{};
    if(!Object.keys(data).length){ el.innerHTML="No pending withdrawals"; return; }
    el.innerHTML="<table><tr><th>#</th><th>User</th><th>Amount</th><th>GCash</th><th>Status</th></tr>";
    Object.entries(data).forEach(([k,w],i)=>{
      el.innerHTML+=`<tr><td>${i+1}</td><td>${w.username}</td><td>₱${w.amount.toFixed(2)}</td><td>${w.gcash}</td><td>${w.status}</td></tr>`;
    });
    el.innerHTML+="</table>";
  });
}
function approveAllWithdrawals(){
  db.ref('withdrawals').once('value', snap=>{
    const data = snap.val()||{};
    Object.entries(data).forEach(([k,w])=>{
      db.ref('withdrawals/'+k).update({status:'Paid'});
    });
    let emailBody = Object.entries(data).map(([_,w])=>`User: ${w.username}, Amount: ₱${w.amount.toFixed(2)}, GCash: ${w.gcash}, Status: Paid`).join('%0D%0A');
    window.location.href=`mailto:otico.isai2@gmail.com?subject=Sentinel Dark Withdrawals&body=${emailBody}`;
    updateOwnerUI(); alert("All withdrawals approved and sent to Gmail!");
  });
}

// World Chat
let chatInitialized = false;
function initWorldChat(){
  if(chatInitialized) return; 
  chatInitialized = true;
  const chatBox=document.getElementById('chatBox');
  const chatInput=document.getElementById('chatInput');

  // Listen for all chat messages in real-time (persistent)
  db.ref('chat').orderByChild('timestamp').on('child_added', snap=>{
    const msg = snap.val();
    const p = document.createElement('p');
    const time = new Date(msg.timestamp).toLocaleTimeString();
    p.innerHTML = `<strong>${msg.username} [${time}]:</strong> ${msg.message}`;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight; 
  });

  window.sendChat = function(){
    const text = chatInput.value.trim();
    if(!text) return;
    db.ref('chat').push({
      telegramId: userId,
      username,
      message: text,
      timestamp: Date.now()
    });
    chatInput.value='';
  }
}

// Initialize
showPage('landing');
