// 🔥 FIREBASE CONFIG (REPLACE WITH YOURS)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// TELEGRAM USER
const tg = window.Telegram.WebApp;
tg.ready();

const user = {
  id: tg.initDataUnsafe?.user?.id || Date.now(),
  name: tg.initDataUnsafe?.user?.first_name || "Guest"
};

tgName.innerText = user.name;
tgId.innerText = user.id;

let balance = 0;

// TIME
setInterval(() => {
  time.innerText = new Date().toLocaleString();
}, 1000);

// LOAD BALANCE
db.ref("balances/" + user.id).on("value", s => {
  balance = s.val() || 0;
  balanceEl();
});

function balanceEl() {
  document.getElementById("balance").innerText = balance.toFixed(3);
}

// ADS + REWARD
function playForReward() {
  let ads = 4;

  function run() {
    show_10276123("pop").then(() => {
      ads--;
      if (ads > 0) run();
      else {
        balance += 0.025;
        db.ref("balances/" + user.id).set(balance);
        playVideo();
      }
    });
  }
  run();
}

// PLAY VIDEO (NO REPEAT)
function playVideo() {
  db.ref("videos").once("value", snap => {
    const vids = Object.keys(snap.val() || {});
    db.ref("playedGlobal/" + user.id).once("value", p => {
      const played = p.val() || {};
      const available = vids.filter(v => !played[v]);
      if (!available.length) return alert("No new videos");

      const vid = available[Math.floor(Math.random() * available.length)];
      db.ref("playedGlobal/" + user.id + "/" + vid).set(true);

      // VIEWS + CREATOR EARNINGS
      db.ref("videoStats/" + vid + "/views").transaction(v => (v || 0) + 1);
      db.ref("videos/" + vid).once("value", v => {
        const owner = v.val().owner;
        db.ref("balances/" + owner).transaction(b => (b || 0) + 0.01);
        db.ref("videoStats/" + vid + "/earnings").transaction(e => (e || 0) + 0.01);
      });

      ytPlayer.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      setTimeout(() => ytPlayer.src = "", 60000);
    });
  });
}

function nextVideo() {
  playVideo();
}

// SUBMIT VIDEO
function submitVideo() {
  const url = ytLink.value;
  const id = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
  if (!id) return alert("Invalid link");

  db.ref("userVideos/" + user.id).once("value", s => {
    const count = s.numChildren();
    if (count >= 20) return alert("Max reached");
    if (count >= 5 && balance < 5) return alert("Need ₱5");

    if (count >= 5) {
      balance -= 5;
      db.ref("balances/" + user.id).set(balance);
    }

    db.ref("videos/" + id).set({ owner: user.id });
    db.ref("userVideos/" + user.id).push({ vid: id });
    ytLink.value = "";
  });
}

// LOAD USER STATS (5 MIN)
function loadUserStats() {
  db.ref("userVideos/" + user.id).once("value", snap => {
    userLinks.innerHTML = "";
    snap.forEach(s => {
      const vid = s.val().vid;
      db.ref("videoStats/" + vid).once("value", st => {
        const v = st.val() || {};
        userLinks.innerHTML += `<tr><td>${vid}</td><td>${v.views||0}</td><td>₱${(v.earnings||0).toFixed(2)}</td></tr>`;
      });
    });
  });
}
setInterval(loadUserStats, 300000);

// NAV
function hideAll() {
  document.querySelectorAll("main").forEach(m => m.classList.add("hidden"));
}
function goHome() { hideAll(); homePage.classList.remove("hidden"); }
function openSubmit() { hideAll(); submitPage.classList.remove("hidden"); }
function openWithdraw() { hideAll(); withdrawPage.classList.remove("hidden"); }

// WITHDRAW
function requestWithdraw() {
  db.ref("withdraws").push({
    user: user.id,
    amount: wdAmount.value,
    method: wdMethod.value,
    account: wdAccount.value,
    status: "Pending",
    time: Date.now()
  });
  alert("Requested");
}

// ADMIN
function adminLogin() {
  if (localStorage.admin) return;
  if (prompt("Password") === "Propetas6") {
    localStorage.admin = 1;
    hideAll();
    adminPage.classList.remove("hidden");
    loadAdmin();
  }
}

function loadAdmin() {
  db.ref("withdraws").on("value", snap => {
    adminWithdraws.innerHTML = "";
    snap.forEach(s => {
      const d = s.val();
      adminWithdraws.innerHTML += `
      <tr>
        <td>${d.user}</td>
        <td>${d.amount}</td>
        <td>${d.method}</td>
        <td>${d.status}</td>
        <td>
          <button onclick="db.ref('withdraws/${s.key}/status').set('Approved')">✔</button>
          <button onclick="db.ref('withdraws/${s.key}/status').set('Rejected')">✖</button>
        </td>
      </tr>`;
    });
  });
}
