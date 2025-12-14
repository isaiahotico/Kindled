// === Firebase config ===
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

// Owner
const OWNER_PASSWORD = "Propetas6";

// Telegram User
let telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
let userId = telegramUser.id || 'USER_'+Math.floor(Math.random()*1000000);
let username = telegramUser.username || telegramUser.first_name || `User${Math.floor(Math.random()*10000)}`;

// First-time registration
const userRef = db.ref('users/'+userId);
userRef.once('value').then(snap=>{
  if(!snap.exists()) userRef.set({username, balance:0, affiliateEarn:0, referrals:0, streak:0, level:1, adsCount:0});
});

// Local state
let balance=0, adsCount=0, giftsCooldown=false;
let lock=false;

// Page navigation
function showPage(page){
  ['landing','ads','gifts','dashboard','profile','affiliate','worldChat','ownerLogin','owner'].forEach(p=>document.getElementById(p).classList.add('hidden'));
  document.getElementById(page).classList.remove('hidden');
  updateUI();
  if(page==='affiliate') updateAffiliateUI();
  if(page==='owner') updateOwnerUI();
  if(page==='worldChat') initWorldChat();
}

// Update UI
function updateUI(){
  userRef.once('value').then(snap=>{
    const d = snap.val()||{};
    balance = d.balance||0;
    adsCount = d.adsCount||0;
    document.getElementById('balanceAds').innerText = `Balance: ₱${balance.toFixed(3)}`;
    document.getElementById('balanceDash').innerText = `Balance: ₱${balance.toFixed(3)}`;
    document.getElementById('adsProgress').innerText = `Ads left: ${4-adsCount}`;
  });
}

// Watch Ads
async function rewardAds(){
  if(adsCount>=4) adsCount=0;
  try{
    await show_10276123(); // play ad
    adsCount++;
    if(adsCount===4){
      balance+=0.025;
      adsCount=0;
      await userRef.update({balance, adsCount});
      alert("🎉 You earned ₱0.025!");
    } else {
      await userRef.update({adsCount});
      alert(`Ad watched! Ads left: ${4-adsCount}`);
    }
    updateUI();
  }catch(e){alert("Ad failed, try again");}
}

// Gift Ads
function rewardGifts(){
  if(giftsCooldown) return alert("Cooldown active");
  let adCount=0;
  function playNext(){
    if(adCount>=4){
      balance+=0.03;
      giftsCooldown=true;
      userRef.update({balance});
      alert("🎁 You earned ₱0.03! Cooldown 5 min.");
      let sec=300;
      const timer=setInterval(()=>{
        document.getElementById("giftsCooldown").innerText = "Cooldown: "+sec+"s";
        sec--;
        if(sec<0){ clearInterval(timer); giftsCooldown=false; document.getElementById("giftsCooldown").innerText=""; }
      },1000);
      return;
    }
    show_10276123().then(()=>{
      adCount++;
      document.getElementById("giftsProgress").innerText=`Ads left: ${4-adCount}`;
      playNext();
    }).catch(()=>alert("Ad failed"));
  }
  playNext();
}

// Withdraw
function withdrawGCash(){
  const gcash = document.getElementById('gcashNumber').value.trim();
  if(!gcash) return alert("Enter GCash number");
  if(balance<0.025) return alert("Insufficient balance");
  db.ref('withdrawals').push({userId, username, amount:balance, gcash, status:'Pending', timestamp:Date.now()});
  balance=0; userRef.update({balance});
  updateUI();
  alert("Withdrawal saved!");
}

// Profile
function changeName(){
  const n=document.getElementById('profileNameInput').value.trim();
  if(!n) return alert("Enter name");
  username=n; userRef.update({username});
  alert("Name updated!"); updateUI();
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('watchAdsBtn').addEventListener('click',rewardAds);
  document.getElementById('giftsBtn').addEventListener('click',rewardGifts);
  document.getElementById('currentDateTime').innerText = new Date().toLocaleString();
  setInterval(()=>document.getElementById('currentDateTime').innerText = new Date().toLocaleString(),1000);
});

