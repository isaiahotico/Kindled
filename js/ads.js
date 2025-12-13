import { db } from "../firebase/config.js";
import { ref, get, update } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const tgId = localStorage.getItem("tgId");
const status = document.getElementById("status");

document.getElementById("watch").onclick = () => {
  status.textContent = "Loading ad...";

  show_10276123('pop').then(() => {
    rewardUser();
  }).catch(() => {
    status.textContent = "Ad failed";
  });
};

function rewardUser() {
  const userRef = ref(db, "users/" + tgId);

  get(userRef).then(snap => {
    if (!snap.exists()) return;
    const u = snap.val();

    const earn = 0.5;
    let updates = {};
    updates["users/" + tgId + "/coins"] = (u.coins || 0) + earn;

    if (u.referredBy) {
      updates["users/" + u.referredBy + "/coins"] =
        ((u.refCoins || 0) + earn * 0.1);
      updates["users/" + u.referredBy + "/referralEarnings"] =
        ((u.referralEarnings || 0) + earn * 0.1);
    }

    update(ref(db), updates);
    status.textContent = "✔ Earned 0.5 coin";
  });
}
