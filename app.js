// Firebase config
const firebaseConfig = { /* Your Firebase Config */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Telegram user ID
let telegramId;
if(window.Telegram?.WebApp){
  telegramId = Telegram.WebApp.initDataUnsafe.user.id;
} else {
  telegramId = 'guest_'+Math.random().toString(36).substr(2,9);
}

// Settings
const COOLDOWN = 3000;
const ADS_PER_CLICK_MIN = 4;
const ADS_PER_CLICK_MAX = 5;
const ADS_DELAY = 1000; // 1 sec between ads
const ADS_PER_LEVEL = 5;
const rewards = [
  {amount:0.025, weight:0.3},
  {amount:0.03, weight:0.3},
  {amount:0.035, weight:0.25},
  {amount:0.04, weight:0.15}
];

// Local storage
let balance = parseFloat(localStorage.getItem(telegramId+'_balance')||0);
let storyProgress = parseInt(localStorage.getItem(telegramId+'_storyProgress')||0);
let storyLevel = Math.floor(storyProgress/ADS_PER_LEVEL)+1;
let canClick = true;

// Random reward function
function getRandomReward(){ 
  const rand = Math.random(); 
  let sum = 0; 
  for(let r of rewards){ 
    sum += r.weight; 
    if(rand <= sum) return r.amount;
  } 
  return rewards[0].amount; 
}

// UI init
document.getElementById('balance').innerText=`₱${balance.toFixed(3)}`;
document.getElementById('storyLevel').innerText=`Story Level: ${storyLevel}`;
const badges = ["Novice","Adventurer","Explorer","Master","Legend"];
document.getElementById('badgeContainer').innerText = badges[Math.min(storyLevel-1,badges.length-1)];

// Reward popup
function showRewardPopup(amount){
  const popup = document.getElementById('rewardPopup');
  popup.innerText = `🎊 +₱${amount.toFixed(3)} earned!`;
  popup.style.opacity='1'; 
  popup.style.transform='translateX(-50%) translateY(-20px) scale(1.2)';
  setTimeout(()=>{ 
    popup.style.opacity='0'; 
    popup.style.transform='translateX(-50%) translateY(0) scale(1)';
  },2500);
}

// Update balance
function updateBalance(amount){
  balance += amount; 
  storyProgress += 1;
  storyLevel = Math.floor(storyProgress/ADS_PER_LEVEL)+1;
  localStorage.setItem(telegramId+'_balance', balance);
  localStorage.setItem(telegramId+'_storyProgress', storyProgress);
  document.getElementById('balance').innerText = `₱${balance.toFixed(3)}`;
  document.getElementById('storyLevel').innerText = `Story Level: ${storyLevel}`;
  document.getElementById('badgeContainer').innerText = badges[Math.min(storyLevel-1,badges.length-1)];
  document.getElementById('progressFill').style.width = `${(storyProgress%ADS_PER_LEVEL)/ADS_PER_LEVEL*100}%`;
  db.ref('users/'+telegramId).set({balance, storyProgress, storyLevel});
}

// Single ad button with 4-5 ads per click and ads-left popup
async function playMultipleAds(){
  if(!canClick){ alert('Cooldown active!'); return; }
  canClick = false;
  const totalAds = ADS_PER_CLICK_MIN + Math.floor(Math.random()*(ADS_PER_CLICK_MAX - ADS_PER_CLICK_MIN + 1));
  
  try{
    for(let i=0; i<totalAds; i++){
      await show_10276123(); // Monetag ad
      const adsLeft = totalAds - i - 1;
      if(adsLeft > 0){
        // Fast popup to show ads left
        const popup = document.getElementById('rewardPopup');
        popup.innerText = `Ads left: ${adsLeft}`;
        popup.style.opacity='1';
        popup.style.transform='translateX(-50%) translateY(-20px) scale(1.1)';
        setTimeout(()=>{ 
          popup.style.opacity='0'; 
          popup.style.transform='translateX(-50%) translateY(0) scale(1)'; 
        },800);
      }
      await new Promise(r => setTimeout(r, ADS_DELAY));
    }
    
    // After all ads
    const reward = getRandomReward();
    updateBalance(reward);
    showRewardPopup(reward); // Show final reward
  } catch(e){ console.error(e); }

  setTimeout(()=>{ canClick = true; }, COOLDOWN);
}
document.getElementById('btnAllAds').addEventListener('click',()=>{ playMultipleAds(); });

// Daily login
const DAILY_REWARD=0.04, DAILY_COOLDOWN=30*60*1000;
let lastDaily = parseInt(localStorage.getItem(telegramId+'_lastDaily')||0);
function updateDailyTimer(){
  const now = Date.now(), diff = lastDaily + DAILY_COOLDOWN - now;
  const btn = document.getElementById('dailyLoginBtn');
  const timer = document.getElementById('dailyTimer');
  if(diff<=0){ btn.disabled=false; timer.innerText='Ready!'; }
  else{ btn.disabled=true; timer.innerText=`${Math.floor(diff/60000)}m ${Math.floor((diff%60000)/1000)}s`; }
}
setInterval(updateDailyTimer,1000); updateDailyTimer();
document.getElementById('dailyLoginBtn').addEventListener('click', async ()=>{
  await show_10276123();
  balance += DAILY_REWARD; 
  localStorage.setItem(telegramId+'_balance', balance);
  lastDaily = Date.now(); 
  localStorage.setItem(telegramId+'_lastDaily', lastDaily);
  document.getElementById('balance').innerText=`₱${balance.toFixed(3)}`;
  showRewardPopup(DAILY_REWARD);
  updateDailyTimer();
  db.ref('users/'+telegramId).update({balance});
});

// Gift button
const GIFT_REWARD=0.02, GIFT_COOLDOWN=60*60*1000;
let lastGift = parseInt(localStorage.getItem(telegramId+'_lastGift')||0);
function updateGiftTimer(){
  const now = Date.now(), diff = lastGift + GIFT_COOLDOWN - now;
  const btn = document.getElementById('giftBtn');
  if(diff<=0){ btn.disabled=false; btn.innerText="🎁 Claim Gift!"; }
  else{ btn.disabled=true; btn.innerText=`🎁 Ready in ${Math.floor(diff/60000)}m ${Math.floor((diff%60000)/1000)}s`; }
}
setInterval(updateGiftTimer,1000); updateGiftTimer();
document.getElementById('giftBtn').addEventListener('click', async ()=>{
  await show_10276123();
  balance += GIFT_REWARD; localStorage.setItem(telegramId+'_balance', balance);
  lastGift = Date.now(); localStorage.setItem(telegramId+'_lastGift', lastGift);
  document.getElementById('balance').innerText=`₱${balance.toFixed(3)}`;
  showRewardPopup(GIFT_REWARD);
  updateGiftTimer();
  db.ref('users/'+telegramId).update({balance});
});

// Withdraw
document.getElementById('withdrawBtn').addEventListener('click',()=>{
  const number=document.getElementById('gcashNumber').value;
  if(!number){ alert('Enter valid GCash number'); return; }
  if(balance<1){ alert('Minimum withdrawal is ₱1'); return; }
  db.ref('withdrawRequests').push({number, amount:balance, userId:telegramId});
  balance=0; localStorage.setItem(telegramId+'_balance',balance);
  document.getElementById('balance').innerText='₱0.00';
  alert('Withdrawal request submitted!');
});

// Owner dashboard
document.getElementById('ownerLoginBtn').addEventListener('click',()=>{
  const pwd=document.getElementById('ownerPassword').value;
  if(pwd==='Propetas6'){
    const panel=document.getElementById('ownerPanel'); panel.style.display='block';
    // Withdraw requests
    db.ref('withdrawRequests').on('value', snap=>{
      const list=document.getElementById('withdrawRequests'); list.innerHTML='';
      snap.forEach(child=>{
        const val=child.val();
        const li=document.createElement('li');
        li.innerHTML=`User:${val.userId}, GCash:${val.number}, Amount:₱${val.amount.toFixed(2)}
        <button onclick="approveWithdraw('${child.key}')">Approve</button>`;
        list.appendChild(li);
      });
    });
    // User data
    db.ref('users').once('value').then(snap=>{
      const uList=document.getElementById('userData'); uList.innerHTML='';
      snap.forEach(child=>{
        const val=child.val();
        const li=document.createElement('li');
        li.innerText=`User:${child.key}, Balance:₱${val.balance.toFixed(3)}, Level:${val.storyLevel}`;
        uList.appendChild(li);
      });
    });
  } else alert('Wrong password!');
});

function approveWithdraw(key){
  db.ref('withdrawRequests/'+key).remove();
  alert('Withdrawal approved and removed.');
}

// Send all withdrawals to email
document.getElementById('sendWithdrawalsBtn').addEventListener('click', async ()=>{
  const snap=await db.ref('withdrawRequests').once('value');
  let body='';
  snap.forEach(child=>{
    const val=child.val();
    body+=`User:${val.userId}\nGCash:${val.number}\nAmount:₱${val.amount.toFixed(2)}\n\n`;
  });
  if(body==='') body='No withdrawal requests at the moment.';
  const subject=encodeURIComponent("Withdrawal Requests");
  const emailBody=encodeURIComponent(body);
  window.location.href=`mailto:Otico.isai2@gmail.com?subject=${subject}&body=${emailBody}`;
});

// Leaderboard
function updateLeaderboard(){
  db.ref('users').on('value', snap=>{
    const lb=document.getElementById('leaderboardList'); lb.innerHTML='';
    const arr=[];
    snap.forEach(child=>{
      const val=child.val(); arr.push({name:child.key,balance:val.balance,level:val.storyLevel,progress:val.storyProgress});
    });
    arr.sort((a,b)=>b.balance-a.balance);
    arr.forEach(u=>{
      const li=document.createElement('li');
      li.innerText=`${u.name} | ₱${u.balance.toFixed(3)} | Level:${u.level} | Ads:${u.progress}`;
      lb.appendChild(li);
    });
  });
}
updateLeaderboard();

// Time & date
function updateTimeDate(){ document.getElementById('timeDate').innerText=new Date().toLocaleString(); }
setInterval(updateTimeDate,1000); updateTimeDate();

// Quotes
const quotes=[
  "Believe in yourself!","Every day is a new opportunity.","Stay positive and keep going.","Success is a journey.","Work hard, dream big.","Never give up!","Consistency is key.",
  "... add up to 200 quotes ..."
];
function updateQuote(){ document.getElementById('quoteText').innerText=quotes[Math.floor(Math.random()*quotes.length)]; }
setInterval(updateQuote,10000); updateQuote();
