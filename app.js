import { db, ref, onValue, set } from './firebase.js';
import { uid, canWatchAd, markAdWatched } from './utils.js';

Telegram.WebApp.ready();
Telegram.WebApp.expand();

const balanceEl = document.getElementById('balance');
const userRef = ref(db, `users/${uid}`);

// Load balance in real-time
onValue(userRef, snap => {
  const val = snap.val();
  if(val?.balance!==undefined){
    balanceEl.innerText = val.balance.toFixed(2);
  }
});

// Reward function
function rewardUser(amount){
  markAdWatched();
  onValue(userRef, snap => {
    const val = snap.val() || {balance:0};
    set(userRef, {...val, balance:(val.balance||0)+amount, lastActive:Date.now()});
  });
  balanceEl.innerText = (parseFloat(balanceEl.innerText)+0.03).toFixed(2);
}

// Monetag triple ads
async function watchTripleAds() {
  if(!canWatchAd()){ alert("Please wait before watching another ad."); return; }
  try{
    await show_10276123();       // Rewarded Interstitial
    await show_10276123('pop');  // Rewarded Popup
    show_10276123({              // In-app Interstitial
      type:'inApp', inAppSettings:{frequency:1, interval:30, timeout:5, everyPage:false}
    });
    rewardUser(0.03);
  }catch(e){ console.log("Ad interrupted", e); }
}

document.getElementById('watchBtn').addEventListener('click', watchTripleAds);
