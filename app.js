// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_FIREBASE_PROJECT.firebaseio.com",
  projectId: "YOUR_FIREBASE_PROJECT",
  storageBucket: "YOUR_FIREBASE_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// App Settings
const REWARD = 0.025;
const REFERRAL_PERCENT = 0.1;
const COOLDOWN = 5000;
const ADS_PER_LEVEL = 5; // Ads needed for next story level

let balance = parseFloat(localStorage.getItem('balance') || 0);
let storyProgress = parseInt(localStorage.getItem('storyProgress') || 0);
let storyLevel = Math.floor(storyProgress / ADS_PER_LEVEL) + 1;
let canClick = true;

// Story Events & Badges
const storyEvents = [
  "A hidden treasure appears! 💰",
  "You find a lucky charm! 🍀",
  "A shooting star streaks! ✨",
  "You unlocked a secret path! 🌈",
  "A mystical bird delivers coins! 🐦",
  "You found a magic chest! 🎁"
];

const badges = ["Novice", "Adventurer", "Explorer", "Master", "Legend"];

// User ID
let userId = localStorage.getItem('userId');
if(!userId){
  userId = 'user_' + Math.random().toString(36).substr(2,9);
  localStorage.setItem('userId', userId);
}

// Referral
const urlParams = new URLSearchParams(window.location.search);
const referrer = urlParams.get('ref');

// Initialize UI
document.getElementById('balance').innerText = `₱${balance.toFixed(3)}`;
document.getElementById('referralLink').value = `${window.location.href.split('?')[0]}?ref=${userId}`;
document.getElementById('storyLevel').innerText = `Story Level: ${storyLevel}`;
document.getElementById('badgeContainer').innerText = badges[Math.min(storyLevel-1,badges.length-1)];

// Reward Popup with Story
function showRewardPopup(amount){
  const popup = document.getElementById('rewardPopup');
  let storyText = '';
  if(storyProgress % 3 === 0){
    storyText = storyEvents[Math.floor(Math.random()*storyEvents.length)];
  }
  popup.innerHTML = `🎊 +₱${amount.toFixed(3)} earned!<br>${storyText}`;
  popup.style.opacity='1';
  popup.style.transform='translateX(-50%) translateY(-20px) scale(1.2)';
  setTimeout(()=>{
    popup.style.opacity='0';
    popup.style.transform='translateX(-50%) translateY(0) scale(1)';
  },2500);
}

// Update balance, story progress, and Firebase
function updateBalance(amount){
  balance += amount;
  storyProgress += 1;
  storyLevel = Math.floor(storyProgress / ADS_PER_LEVEL) + 1;

  localStorage.setItem('balance', balance);
  localStorage.setItem('storyProgress', storyProgress);

  document.getElementById('balance').innerText = `₱${balance.toFixed(3)}`;
  document.getElementById('storyLevel').innerText = `Story Level: ${storyLevel}`;
  document.getElementById('badgeContainer').innerText = badges[Math.min(storyLevel-1,badges.length-1)];

  // Update progress bar
  const progressFill = document.getElementById('progressFill');
  const progressPercent = ((storyProgress % ADS_PER_LEVEL)/ADS_PER_LEVEL)*100;
  progressFill.style.width = `${progressPercent}%`;

  // Update Firebase
  db.ref('users/' + userId).set({ balance, storyProgress, storyLevel });
}

// Referral credit with notification
function creditReferral(amount){
  if(referrer){
    db.ref('users/' + referrer).once('value').then(snap=>{
      let refBal = snap.val()?.balance || 0;
      let credit = amount * REFERRAL_PERCENT;
      db.ref('users/' + referrer).update({ balance: refBal + credit });
      const notif = document.getElementById('referralNotifications');
      notif.innerText = `🎉 Your friend earned, you got ₱${credit.toFixed(3)}!`;
      setTimeout(()=>{ notif.innerText=''; },4000);
    });
  }
}

// Sequential Ads with story
async function watchAds(){
  if(!canClick){ alert('Cooldown active!'); return; }
  canClick=false;
  try{
    await show_10276123();
    updateBalance(REWARD); creditReferral(REWARD); showRewardPopup(REWARD);
    await new Promise(r=>setTimeout(r,10000));

    await show_10276123('pop');
    updateBalance(REWARD); creditReferral(REWARD); showRewardPopup(REWARD);
    await new Promise(r=>setTimeout(r,10000));

    await show_10276123({ type:'inApp', inAppSettings:{ frequency:999, capping:0, interval:0, timeout:0, everyPage:false } });
    updateBalance(REWARD); creditReferral(REWARD); showRewardPopup(REWARD);
  }catch(e){ console.error(e);}
  setTimeout(()=>{ canClick=true; }, COOLDOWN);
}
document.getElementById('btnAllAds').addEventListener('click', watchAds);

// Withdraw
document.getElementById('withdrawBtn').addEventListener('click', ()=>{
  const number = document.getElementById('gcashNumber').value;
  if(!number){ alert('Enter valid GCash number'); return; }
  if(balance<1){ alert('Minimum withdrawal is ₱1'); return; }
  db.ref('withdrawRequests').push({ number, amount: balance, userId });
  balance=0; localStorage.setItem('balance', balance);
  document.getElementById('balance').innerText='₱0.00';
  alert('Withdrawal request sent!');
});

// Owner Dashboard
document.getElementById('ownerLoginBtn').addEventListener('click',()=>{
  const pwd = document.getElementById('ownerPassword').value;
  if(pwd==='Propetas6'){
    const panel = document.getElementById('ownerPanel'); panel.style.display='block';
    db.ref('withdrawRequests').once('value').then(snap=>{
      const list = document.getElementById('withdrawRequests'); list.innerHTML='';
      snap.forEach(child=>{
        const li=document.createElement('li');
        const val = child.val();
        li.innerText = `User:${val.userId}, GCash:${val.number}, Amount:₱${val.amount.toFixed(2)}`;
        list.appendChild(li);
      });
    });
  }else alert('Wrong password!');
});

// Auto-updating Leaderboard with highlights
function updateLeaderboard(){
  db.ref('users').orderByChild('balance').limitToLast(5).on('value',snap=>{
    const lb = document.getElementById('leaderboardList'); lb.innerHTML='';
    const arr = [];
    snap.forEach(child=>{ arr.push({name: child.key, balance: child.val().balance}); });
    arr.sort((a,b)=>b.balance-a.balance);
    arr.forEach((u,i)=>{
      const li=document.createElement('li');
      li.innerText=`${u.name} - ₱${u.balance.toFixed(3)}`;
      if(i===0) li.style.color='gold';
      if(i===1) li.style.color='silver';
      if(i===2) li.style.color='orange';
      li.style.fontWeight='bold';
      lb.appendChild(li);
    });
  });
}
updateLeaderboard();
