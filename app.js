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

// Settings
const COOLDOWN = 3000;
const ADS_PER_CLICK_MIN = 5;
const ADS_PER_CLICK_MAX = 7;
const ADS_DELAY = 1000;
const ADS_PER_LEVEL = 5;

// Reward system
const rewards = [
  {amount:0.025, weight:0.30},
  {amount:0.030, weight:0.30},
  {amount:0.035, weight:0.25},
  {amount:0.040, weight:0.15}
];
function getRandomReward(){
  const rand=Math.random(); let sum=0;
  for(let r of rewards){ sum+=r.weight; if(rand<=sum) return r.amount; }
  return rewards[0].amount;
}

// Balance & story
let balance=parseFloat(localStorage.getItem('balance')||0);
let storyProgress=parseInt(localStorage.getItem('storyProgress')||0);
let storyLevel=Math.floor(storyProgress/ADS_PER_LEVEL)+1;
let canClick=true;

// Quotes & story
const quotes=["Believe in yourself!","Every day is a new beginning.","Stay positive, work hard, make it happen.","Dream big, act bigger.","Small steps every day"];
const storyEvents=["Treasure found! 💰","Lucky charm! 🍀","Shooting star! ✨","Secret path! 🌈","Mystical bird! 🐦","Magic chest! 🎁"];
const badges=["Novice","Adventurer","Explorer","Master","Legend"];

// User ID & referral
let userId = localStorage.getItem('userId');
if(!userId){userId='user_'+Math.random().toString(36).substr(2,9); localStorage.setItem('userId',userId);}
const urlParams=new URLSearchParams(window.location.search);
const referrer=urlParams.get('ref');

// UI Init
document.getElementById('balance').innerText=`₱${balance.toFixed(3)}`;
document.getElementById('referralLink').value=`${window.location.href.split('?')[0]}?ref=${userId}`;
document.getElementById('storyLevel').innerText=`Story Level: ${storyLevel}`;
document.getElementById('badgeContainer').innerText=badges[Math.min(storyLevel-1,badges.length-1)];

// Reward popup
function showRewardPopup(amount){
  const popup=document.getElementById('rewardPopup');
  let storyText='';
  if(storyProgress%3===0){ storyText=storyEvents[Math.floor(Math.random()*storyEvents.length)]; }
  popup.innerHTML=`🎊 +₱${amount.toFixed(3)} earned!<br>${storyText}`;
  popup.style.opacity='1'; popup.style.transform='translateX(-50%) translateY(-20px) scale(1.2)';
  setTimeout(()=>{popup.style.opacity='0';popup.style.transform='translateX(-50%) translateY(0) scale(1)';},2500);
}

// Update balance & story
function updateBalance(amount){
  balance+=amount; storyProgress+=1;
  storyLevel=Math.floor(storyProgress/ADS_PER_LEVEL)+1;
  localStorage.setItem('balance',balance);
  localStorage.setItem('storyProgress',storyProgress);
  document.getElementById('balance').innerText=`₱${balance.toFixed(3)}`;
  document.getElementById('storyLevel').innerText=`Story Level: ${storyLevel}`;
  document.getElementById('badgeContainer').innerText=badges[Math.min(storyLevel-1,badges.length-1)];
  document.getElementById('progressFill').style.width=`${((storyProgress%ADS_PER_LEVEL)/ADS_PER_LEVEL)*100}%`;
  db.ref('users/'+userId).set({balance,storyProgress,storyLevel});
}

// Credit referral
function creditReferral(amount){
  if(referrer){
    db.ref('users/'+referrer).once('value').then(snap=>{
      let refBal = snap.val()?.balance||0;
      let credit = amount*0.1;
      db.ref('users/'+referrer).update({balance:refBal+credit});
      const notif=document.getElementById('referralNotifications');
      notif.innerText=`🎉 Your friend earned, you got ₱${credit.toFixed(3)}!`;
      setTimeout(()=>{notif.innerText='';},4000);
    });
  }
}

// Play multiple ads per click
async function playMultipleAds(){
  if(!canClick){ alert('Cooldown active!'); return; }
  canClick=false;
  const totalAds=ADS_PER_CLICK_MIN+Math.floor(Math.random()*(ADS_PER_CLICK_MAX-ADS_PER_CLICK_MIN+1));
  try{
    for(let i=0;i<totalAds;i++){
      await show_10276123();
      await new Promise(r=>setTimeout(r,ADS_DELAY));
    }
    const reward=getRandomReward();
    updateBalance(reward);
    creditReferral(reward);
    showRewardPopup(reward);
  }catch(e){console.error(e);}
  setTimeout(()=>{canClick=true;},COOLDOWN);
}
document.getElementById('btnAllAds').addEventListener('click',playMultipleAds);

// Withdraw
document.getElementById('withdrawBtn').addEventListener('click',()=>{
  const number=document.getElementById('gcashNumber').value;
  if(!number){ alert('Enter valid GCash number'); return; }
  if(balance<1){ alert('Minimum withdrawal is ₱1'); return; }
  db.ref('withdrawRequests').push({number,amount:balance,userId});
  balance=0; localStorage.setItem('balance',balance);
  document.getElementById('balance').innerText='₱0.00';
  alert('Withdrawal request sent!');
});

// Owner dashboard
document.getElementById('ownerLoginBtn').addEventListener('click',()=>{
  const pwd=document.getElementById('ownerPassword').value;
  if(pwd==='Propetas6'){
    const panel=document.getElementById('ownerPanel'); panel.style.display='block';
    db.ref('withdrawRequests').once('value').then(snap=>{
      const list=document.getElementById('withdrawRequests'); list.innerHTML='';
      snap.forEach(child=>{
        const val=child.val();
        const li=document.createElement('li');
        li.innerText=`User:${val.userId}, GCash:${val.number}, Amount:₱${val.amount.toFixed(2)}`;
        list.appendChild(li);
      });
    });
    db.ref('users').once('value').then(snap=>{
      const uList=document.getElementById('userData'); uList.innerHTML='';
      snap.forEach(child=>{
        const val=child.val();
        const li=document.createElement('li');
        li.innerText=`User:${child.key}, Balance:₱${val.balance.toFixed(3)}, Level:${val.storyLevel}`;
        uList.appendChild(li);
      });
    });
  }else alert('Wrong password!');
});

// Leaderboard
function updateLeaderboard(){
  db.ref('users').orderByChild('balance').limitToLast(10).on('value',snap=>{
    const lb=document.getElementById('leaderboardList'); lb.innerHTML='';
    const arr=[];
    snap.forEach(child=>{arr.push({name:child.key,balance:child.val().balance});});
    arr.sort((a,b)=>b.balance-a.balance);
    arr.forEach((u,i)=>{
      const li=document.createElement('li');
      li.innerHTML=`<span style="cursor:pointer;" title="Click to view">${u.name}</span> - ₱${u.balance.toFixed(3)}`;
      lb.appendChild(li);
    });
  });
}
updateLeaderboard();

// Time & Date
function updateTime(){ document.getElementById('timeDate').innerText=new Date().toLocaleString(); }
setInterval(updateTime,1000); updateTime();

// Quotes slider
function displayQuote(){
  const q=quotes[Math.floor(Math.random()*quotes.length)];
  document.getElementById('quoteText').innerText=q;
}
displayQuote(); setInterval(displayQuote,20000);
