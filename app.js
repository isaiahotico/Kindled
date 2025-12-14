/* ---------- USER ---------- */
let username = localStorage.getItem("username");
if (!username) {
  username = "user" + Math.floor(Math.random() * 9999);
  localStorage.setItem("username", username);
}

let earnings = parseFloat(localStorage.getItem("earnings")) || 0;
const REWARD = 0.025;

/* ---------- NAV ---------- */
function go(p) { location.href = p; }

/* ---------- FOOTER ---------- */
function updateFooter() {
  setInterval(() => {
    const f = document.getElementById("footer");
    if (f) f.textContent = new Date().toLocaleString();
  }, 1000);
}

/* ---------- BALANCE ---------- */
function loadBalance() {
  const e = document.getElementById("earnings");
  if (e) e.textContent = earnings.toFixed(3);
}

/* ---------- ADS STACK (ONE CLICK → 6 ADS) ---------- */
let adLock = false;

function playAllAds() {
  if (adLock) return;
  adLock = true;

  try {
    // Rewarded Interstitial x2
    show_10276123().catch(()=>{});
    show_10276123().catch(()=>{});

    // Rewarded Popup
    show_10276123('pop').catch(()=>{});

    // In-App Interstitial x2
    show_10276123({
      type: 'inApp',
      inAppSettings: {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
      }
    });

    show_10276123({
      type: 'inApp',
      inAppSettings: {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
      }
    });

    // Final Rewarded Popup
    show_10276123('pop').catch(()=>{});

  } catch (e) {
    alert("Ads not available");
  }

  // SINGLE REWARD
  setTimeout(() => {
    earnings += REWARD;
    localStorage.setItem("earnings", earnings);
    loadBalance();
    adLock = false;
  }, 12000);
}

/* ---------- WITHDRAW ---------- */
function withdraw() {
  const amt = parseFloat(amount.value);
  const gc = gcash.value;

  if (amt < 1 || amt > 99) return alert("₱1–₱99 only");
  if (amt > earnings) return alert("Insufficient balance");

  const w = JSON.parse(localStorage.getItem("withdrawals")) || [];
  w.push({ user: username, amount: amt, gcash: gc, approved: false });
  localStorage.setItem("withdrawals", JSON.stringify(w));

  earnings -= amt;
  localStorage.setItem("earnings", earnings);
  loadBalance();
  alert("Withdraw request sent");
}

/* ---------- OWNER ---------- */
function loginOwner() {
  if (ownerPass.value !== "Propetas6") return alert("Wrong password");

  loginBox.classList.add("hidden");
  panelBox.classList.remove("hidden");
  loadWithdrawals();
}

function loadWithdrawals() {
  const w = JSON.parse(localStorage.getItem("withdrawals")) || [];
  withdrawTable.innerHTML = "";
  w.forEach((x, i) => {
    withdrawTable.innerHTML += `
      <tr>
        <td>${x.user}</td>
        <td>₱${x.amount}</td>
        <td>${x.gcash}</td>
        <td>${x.approved ? "Approved" : "Pending"}</td>
        <td>${!x.approved ? `<button onclick="approve(${i})">Approve</button>` : ""}</td>
      </tr>`;
  });
}

function approve(i) {
  const w = JSON.parse(localStorage.getItem("withdrawals"));
  w[i].approved = true;
  localStorage.setItem("withdrawals", JSON.stringify(w));
  loadWithdrawals();
}
