import { db } from "../firebase/config.js";
import { ref, get, onValue, set } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// TELEGRAM ID (replace with WebApp later)
const tgId = localStorage.getItem("tgId") || ("TG" + Date.now());
localStorage.setItem("tgId", tgId);

const userRef = ref(db, "users/" + tgId);

// CREATE USER IF NOT EXISTS
get(userRef).then(snap => {
  if (!snap.exists()) {
    set(userRef, {
      coins: 0,
      referralEarnings: 0,
      name: "User",
      joined: Date.now()
    });
  }
});

// LIVE UPDATE DASHBOARD
onValue(userRef, snap => {
  if (!snap.exists()) return;
  const u = snap.val();
  document.getElementById("coins").textContent = u.coins || 0;
  document.getElementById("referral").textContent = u.referralEarnings || 0;
});
