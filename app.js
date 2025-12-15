// 🔥 FIREBASE CONFIG (REPLACE)
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

// CLOCK
setInterval(() => {
  time.innerText = new Date().toLocaleString();
}, 1000);

// BALANCE
let balance = 0;
db.ref("balances/" + user.id).on("value", s => {
  balance = s.val() || 0;
  document.getElementById("balance").innerText = balance.toFixed(3);
});

// 🎬 PLAY VIDEO (NO ADS)
function playVideo() {
  db.ref("videos").once("value", snap => {
    const vids = Object.keys(snap.val() || {});
    if (!vids.length) return alert("No videos yet");

    db.ref("playedGlobal/" + user.id).once("value", p => {
      const played = p.val() || {};
      const available = vids.filter(v => !played[v]);
      if (!available.length) return alert("No new videos");

      const vid = available[Math.floor(Math.random() * available.length)];
      db.ref("playedGlobal/" + user.id + "/" + vid).set(true);

      // views + creator reward
      db.ref("videoStats/" + vid + "/views")
        .transaction(v => (v || 0) + 1);

      db.ref("videos/" + vid).once("value", v => {
        const owner = v.val().owner;
        db.ref("balances/" + owner)
          .transaction(b => (b || 0) + 0.01);
        db.ref("videoStats/" + vid + "/earnings")
          .transaction(e => (e || 0) + 0.01);
      });

      ytPlayer.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      setTimeout(() => ytPlayer.src = "", 60000);
    });
  });
}

// 📺 WATCH ADS → ₱0.03
function watchAds() {
  let adsLeft = 4;
  adsInfo.classList.remove("hidden");

  function updateInfo() {
    adsInfo.innerText = `Ads left: ${adsLeft}`;
  }

  function runAd() {
    updateInfo();

    // mix rewarded popup + interstitial
    const fn = adsLeft % 2 === 0
      ? show_10276123
      : () => show_10276123("pop");

    fn().then(() => {
      adsLeft--;
      if (adsLeft > 0) runAd();
      else {
        adsInfo.innerText = "Reward added!";
        balance += 0.03;
        db.ref("balances/" + user.id).set(balance);
        setTimeout(() => adsInfo.classList.add("hidden"), 2000);
      }
    }).catch(() => {});
  }
  runAd();
}

// 📤 SUBMIT VIDEO (AUTO ACCEPT)
function submitVideo() {
  const url = ytLink.value.trim();
  const id = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
  if (!id) return alert("Invalid YouTube URL");

  db.ref("userVideos/" + user.id).once("value", s => {
    const count = s.numChildren();
    if (count >= 20) return alert("Max 20 reached");

    if (count >= 5) {
      if (balance < 5) return alert("Need ₱5");
      balance -= 5;
      db.ref("balances/" + user.id).set(balance);
    }

    db.ref("videos/" + id).set({ owner: user.id });
    db.ref("userVideos/" + user.id).push({ vid: id });

    ytLink.value = "";
    alert("Video accepted!");
    loadUserStats();
  });
}

// 📊 USER STATS (5 MIN)
function loadUserStats() {
  db.ref("userVideos/" + user.id).once("value", snap => {
    userLinks.innerHTML = "";
    snap.forEach(s => {
      const vid = s.val().vid;
      db.ref("videoStats/" + vid).once("value", st => {
        const d = st.val() || {};
        userLinks.innerHTML += `
          <tr>
            <td>${vid}</td>
            <td>${d.views || 0}</td>
            <td>₱${(d.earnings || 0).toFixed(2)}</td>
          </tr>`;
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
