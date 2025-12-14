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
let userId = 'USER_' + Math.floor(Math.random()*100000);

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
  document.getElementById('giftsCooldown').innerText = giftsCooldown ? "Cooldown active. Wait 5 minutes." : "";
  updateWithdrawTable();
}

// Reward functions
function rewardAds(){
  if(adsCount<4){
    adsCount++;
    if(adsCount===4){
      balance+=0.025;
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

  const withdrawal={userId,amount:balance,gcash,status:'Pending', timestamp:Date.now()};
  withdrawHistory.push(withdrawal);

  // Firebase store
  db.ref('withdrawals').push(withdrawal);

  // Affiliate reward
  db.ref('users/'+userId).once('value',snap=>{
    const userData = snap.val()||{};
    if(userData.referrerId){
      db.ref('users/'+userData.referrerId+'/balance').once('value',s=>{
        db.ref('users/'+userData.referrerId).update({balance:(s.val()||0)+balance*0.1});
      });
    }
  });

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

// Owner Dashboard
function updateOwnerUI(){
  const el=document.getElementById('pendingWithdrawals');
  const affiliateEl=document.getElementById('affiliateSettings');
  db.ref('withdrawals').once('value', snapshot=>{
    const data=snapshot.val()||{};
    const list=Object.entries(data);
    if(list.length===0) el.innerHTML="No pending withdrawals";
    else{
      el.innerHTML="<table><tr><th>#</th><th>User</th><th>Amount</th><th>GCash</th><th>Status</th></tr>";
      list.forEach(([key,w],i)=>{
        el.innerHTML+=`<tr>
          <td>${i+1}</td>
          <td>${w.userId||'Unknown'}</td>
          <td>₱${w.amount.toFixed(2)}</td>
          <td>${w.gcash}</td>
          <td>${w.status}</td>
        </tr>`;
      });
      el.innerHTML+="</table>";
    }
  });

  // Affiliate Settings
  if(affiliateEl){
    db.ref('affiliate').once('value', snapshot=>{
      const data=snapshot.val()||{enabled:true,percent:10};
      affiliateEl.innerHTML=`Affiliate Enabled: ${data.enabled}, Reward: ${data.percent}%
      <br>Telegram Link Example: http://t.me/SENTINEL_DARK_bot/start?ref=USER_ID`;
    });
  }
}

// Approve all withdrawals
function approveAllWithdrawals(){
  db.ref('withdrawals').once('value', snapshot=>{
    const data = snapshot.val() || {};
    const list = Object.entries(data);
    if(list.length===0){ alert('No withdrawals'); return; }

    // Mark all as Paid & apply affiliate reward
    list.forEach(([key,w])=>{
      db.ref('withdrawals/'+key).update({status:'Paid'});
      if(w.referrerId){
        db.ref('users/'+w.referrerId+'/balance').once('value',s=>{
          db.ref('users/'+w.referrerId).update({balance:(s.val()||0)+w.amount*0.1});
        });
      }
    });

    // Send Gmail
    let emailBody = list.map(([_,w])=>`User: ${w.userId||'Unknown'}, Amount: ₱${w.amount.toFixed(2)}, GCash: ${w.gcash}, Status: Paid`).join('%0D%0A');
    window.location.href=`mailto:otico.isai2@gmail.com?subject=Sentinel Dark Withdrawals&body=${emailBody}`;

    alert('All withdrawals approved and sent to Gmail!');
    updateOwnerUI();
  });
}

// Initialize
showPage('landing');
