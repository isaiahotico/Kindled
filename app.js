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

// User data
let balance=0, streak=0, level=1, referrals=0, affiliateEarn=0;
let withdrawHistory=[], adsCount=0, giftsCount=0;
let giftsCooldown=false;
let userId = 'USER_' + Math.floor(Math.random()*100000);

// Owner
const OWNER_PASSWORD = "Propetas6";

// Page nav
function showPage(page){
  ['landing','ads','gifts','dashboard','profile','affiliate','worldChat','ownerLogin','owner'].forEach(p=>{
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(page).classList.remove('hidden');
  updateUI();
  if(page==='affiliate') updateAffiliateUI();
  if(page==='owner') updateOwnerUI();
  if(page==='worldChat') updateChatUI();
}

// UI Updates
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

// Ads Rewards
function rewardAds(){ 
  if(adsCount<4){ adsCount++;
    if(adsCount===4){ balance+=0.025; adsCount=0; alert("🎉 You earned ₱0.025!"); }
    else alert(`You earn a reward, click again. Ads left: ${4-adsCount}`);
    updateUI();
  }
}

// Gifts Rewards
function rewardGifts(){
  if(giftsCooldown) return;
  if(giftsCount<4){ giftsCount++;
    if(giftsCount===4){ balance+=0.03; giftsCount=0; giftsCooldown=true; alert("🎁 You earned ₱0.03! Cooldown 5 min starts.");
      setTimeout(()=>{ giftsCooldown=false; updateUI(); }, 5*60*1000);
    } else alert(`You earn a gift reward, click again. Ads left: ${4-giftsCount}`);
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
  db.ref('withdrawals').push(withdrawal);
  balance=0; updateUI();
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
    for(let i=0;i<4;i++){ try{ await show_10276123(); rewardAds(); }catch(e){console.warn(e);} }
  });

  document.getElementById('giftsBtn').addEventListener('click', async ()=>{
    if(giftsCooldown){ alert("Wait 5 minutes cooldown"); return;}
    for(let i=0;i<4;i++){ try{ await show_10276123(); rewardGifts(); }catch(e){console.warn(e);} }
  });

  setInterval(()=>{ document.getElementById('currentDateTime').innerText=new Date().toLocaleString(); },1000);
});

// Affiliate Page
function updateAffiliateUI(){
  const table=document.getElementById('affiliateTable');
  table.innerHTML='<tr><th>Link</th><th>Claim Earnings</th></tr>';
  const link = `http://t.me/SENTINEL_DARK_bot/start?start=${userId}`;
  table.innerHTML+=`<tr><td><input type="text" value="${link}" readonly onclick="this.select()"/></td>
    <td><button onclick="claimAffiliate()" class="btn-neon">Claim</button></td></tr>`;
}

// Claim affiliate earnings
function claimAffiliate(){
  db.ref('users/'+userId+'/affiliateEarn').once('value',snap=>{
    const earn = snap.val()||0;
    if(earn<=0){ alert('No affiliate earnings to claim'); return; }
    balance += earn;
    db.ref('users/'+userId).update({affiliateEarn:0});
    updateUI();
    alert(`🎉 You claimed ₱${earn.toFixed(2)}!`);
  });
}

// Owner Login
function loginOwner(){
  const pass=document.getElementById('ownerPass').value;
  if(pass===OWNER_PASSWORD){ showPage('owner'); updateOwnerUI(); }
  else alert('Incorrect password');
}

// Owner Withdrawals
function updateOwnerUI(){
  const el=document.getElementById('pendingWithdrawals');
  db.ref('withdrawals').once('value', snapshot=>{
    const data=snapshot.val()||{};
    const list=Object.entries(data);
    if(list.length===0) el.innerHTML="No pending withdrawals";
    else{
      el.innerHTML="<table><tr><th>#</th><th>User</th><th>Amount</th><th>GCash</th><th>Status</th></tr>";
      list.forEach(([key,w],i)=>{
        el.innerHTML+=`<tr>
          <td>${i+1}</td>
          <td>${w.userId}</td>
          <td>₱${w.amount.toFixed(2)}</td>
          <td>${w.gcash}</td>
          <td>${w.status}</td>
        </tr>`;
      });
      el.innerHTML+="</table>";
    }
  });
}

// Approve all withdrawals
function approveAllWithdrawals(){
  db.ref('withdrawals').once('value', snapshot=>{
    const data = snapshot.val() || {};
    const list = Object.entries(data);
    if(list.length===0){ alert('No withdrawals'); return; }

    list.forEach(([key,w])=>{
      db.ref('withdrawals/'+key).update({status:'Paid'});
    });

    let emailBody = list.map(([_,w])=>`User: ${w.userId}, Amount: ₱${w.amount.toFixed(2)}, GCash: ${w.gcash}, Status: Paid`).join('%0D%0A');
    window.location.href=`mailto:otico.isai2@gmail.com?subject=Sentinel Dark Withdrawals&body=${emailBody}`;
    alert('All withdrawals approved and sent to Gmail!');
    updateOwnerUI();
  });
}

// World Chat
function updateChatUI(){
  const chatBox=document.getElementById('chatBox');
  chatBox.innerHTML='';
  db.ref('chat').on('child_added',snap=>{
    const msg=snap.val();
    const p=document.createElement('p');
    p.innerHTML=`<strong>${msg.userId}:</strong> ${msg.message}`;
    chatBox.appendChild(p);
    chatBox.scrollTop=chatBox.scrollHeight;
  });
}

function sendChat(){
  const input=document.getElementById('chatInput');
  const text=input.value.trim();
  if(text==='') return;
  db.ref('chat').push({userId,message:text,timestamp:Date.now()});
  input.value='';
}

// Initialize
showPage('landing');
