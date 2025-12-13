// Firebase CDN import (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMGU5X7BBp-C6tIl34Uuu5N9MXAVFTn7c",
  authDomain: "paper-house-inc.firebaseapp.com",
  databaseURL: "https://paper-house-inc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "paper-house-inc",
  storageBucket: "paper-house-inc.appspot.com",
  messagingSenderId: "658389836376",
  appId: "1:658389836376:web:2ab1e2743c593f4ca8e02d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Telegram ID or guest
const uid = Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest_' + Math.floor(Math.random()*10000);

// Anti-abuse cooldown
const AD_COOLDOWN = 45000; // 45s

function canWatchAd() {
  const last = localStorage.getItem('lastAdTime');
  return !last || Date.now() - last > AD_COOLDOWN;
}

// Reward user
function rewardUser(amount=0.03) {
  localStorage.setItem('lastAdTime', Date.now());
  const userRef = ref(db, 'users/' + uid);
  onValue(userRef, snap => {
    const data = snap.val() || { balance: 0 };
    const newBalance = (parseFloat(data.balance || 0) + amount).toFixed(2);
    set(userRef, {...data, balance: newBalance});
    document.getElementById('balance').innerText = newBalance;
  }, { onlyOnce: true });
}

// Triple Ads watcher
async function watchTripleAds() {
  if (!canWatchAd()) {
    alert("Hold your horses! Wait a moment before venturing again.");
    return;
  }

  try {
    // 1️⃣ Rewarded Interstitial
    await show_10276123();

    // 2️⃣ Rewarded Popup
    await show_10276123('pop');

    // 3️⃣ In-app Interstitial
    show_10276123({
      type: 'inApp',
      inAppSettings: {
        frequency: 1,
        interval: 30,
        timeout: 5,
        everyPage: false
      }
    });

    rewardUser(0.03);
    alert("✨ You gained +₱0.03 coins! Keep exploring.");

  } catch(e) {
    console.log("Ad interrupted", e);
  }
}

// Event listener
document.getElementById('watchAdsBtn').addEventListener('click', watchTripleAds);
