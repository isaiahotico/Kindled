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

// User Data
let balance=0, streak=0, level=1, referrals=0, affiliateEarn=0;
let withdrawHistory=[], adsCount=0, giftsCount=0;
let giftsCooldown=false;

// Owner
const OWNER_PASSWORD = "Propetas6";

// Page nav
function showPage(page){
  ['landing','ads','gifts','dashboard','profile','owner'].forEach(p=>{
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(page).classList.remove('hidden');
  updateUI();
  if(page==='owner') updateOwnerUI();
}

// Update UI
function updateUI(){
  document.getElementById('balanceAds').innerText = `Balance: ₱${balance.toFixed(3)}`;
  document.getElementById('balanceDash').innerText = `Balance: ₱${balance.toFixed(3)}`;
  document.getElementById('streak').innerText = `Daily Streak: ${streak}`;
  document.getElementById('level').innerText = `Level: ${level}`;
  document.getElementById('referrals').innerText = `Referrals: ${referrals}`;
  document.getElementById('affiliateEarn').innerText = `Affiliate Earned: ₱${affiliateEarn.toFixed(3)}`;
  document.getElementById('adsProgress').innerText = `Ads left: ${4-adsCount}`;
  document.getElementById('giftsProgress').innerText = `Ads left: ${4-giftsCount}`;
  if(giftsCooldown){
    document.getElementById('giftsCooldown').innerText = "Cooldown active. Wait 5 minutes.";
  } else { document.getElementById('giftsCooldown').innerText = ""; }
  updateWithdrawTable();
}

// Reward functions
function rewardAds(){
  if(adsCount<4){
    adsCount++;
    if(adsCount===4){
      balance+=0.025; // reward triggers once
      adsCount=0;
      alert("🎉 You earned ₱0.025!");
    } else {
      alert(`You earn a reward, click again. Ads left: ${4-adsCount}`);
    }
    updateUI();
  }
}

function rewardGifts(){
  if(giftsCooldown) return;
  if(giftsCount<4){
    giftsCount++;
    if(giftsCount===4){
      balance+=0.03;
      giftsCount=0;
      giftsCooldown=true;
      alert("🎁 You earned ₱0.03! Cooldown 5 min starts.");
      setTimeout(()=>{ giftsCooldown=false; updateUI(); }, 5*60*1000);
    } else {
      alert(`You earn a gift reward, click again. Ads left: ${4-giftsCount}`);
    }
    updateUI();
  }
}

// Withdraw
function withdrawGCash(){
  const gcash=document.getElementById('gcashNumber').value;
  if(!gcash){ alert('Enter GCash number'); return; }
  if(balance<0.025){ alert('Insufficient balance'); return; }

  const withdrawal={amount:balance, gcash,status:'Pending', timestamp:Date.now()};
  withdrawHistory.push(withdrawal);

  // Firebase store
  db.ref('withdrawals').push(withdrawal);

  balance=0;
  updateUI();
  alert('Withdrawal request saved!');
}

// Withdraw table
function updateWithdrawTable(){
  const table=document.getElementById('withdrawTable');
  table.innerHTML='<tr><th>Amount</th><th>GCash</th><th>Status</th></tr>';
  withdrawHistory.forEach(w=>{
    table.innerHTML+=`<tr><td>₱${w.amount.toFixed(2)}</td><td>${w.gcash}</td><td>${w.status}</td></tr>`;
  });
}

// Ads integration
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('watchAdsBtn').addEventListener('click', async ()=>{
    for(let i=0;i<4;i++){
      try{ await show_10276123(); rewardAds(); }catch(e){ console.warn(e);}
    }
  });

  document.getElementById('giftsBtn').addEventListener('click', async ()=>{
    if(giftsCooldown){ alert("Wait 5 minutes cooldown"); return;}
    for(let i=0;i<4;i++){
      try{ await show_10276123(); rewardGifts(); }catch(e){ console.warn(e);}
    }
  });

  // Footer date/time
  setInterval(()=>{ document.getElementById('currentDateTime').innerText=new Date().toLocaleString(); },1000);
});

// Owner
function loginOwner(){
  const pass=document.getElementById('ownerPass').value;
  if(pass===OWNER_PASSWORD){ showPage('owner'); updateOwnerUI(); }
  else{ alert('Incorrect password'); }
}

function updateOwnerUI(){
  const el=document.getElementById('pendingWithdrawals');
  db.ref('withdrawals').once('value',snapshot=>{
    const data=snapshot.val()||{};
    const list=Object.values(data);
    if(list.length===0) el.innerHTML="No pending withdrawals";
    else el.innerHTML=list.map((w,i)=>`<div>${i+1}. ₱${w.amount.toFixed(2)} → ${w.gcash} [${w.status}]</div>`).join('');
  });
}

function sendWithdrawalsEmail(){
  db.ref('withdrawals').once('value',snapshot=>{
    const data=snapshot.val()||{};
    const list=Object.values(data);
    if(list.length===0){ alert('No withdrawals'); return; }
    let emailBody=list.map(w=>`Amount: ₱${w.amount.toFixed(2)}, GCash: ${w.gcash}, Status: ${w.status}`).join('%0D%0A');
    window.location.href=`mailto:otico.isai2@gmail.com?subject=Sentinel Dark Withdrawals&body=${emailBody}`;
    // mark all as Paid
    Object.keys(data).forEach(k=>{ db.ref('withdrawals/'+k).update({status:'Paid'}); });
    updateOwnerUI();
    alert('Withdrawals sent and marked as Paid!');
  });
}

// Initialize
showPage('landing');
