/* ---------- BASIC SETUP ---------- */
let username = localStorage.getItem("username");
if (!username) {
  username = prompt("Enter username");
  localStorage.setItem("username", username);
}

let earnings = parseFloat(localStorage.getItem("earnings")) || 0;
const REWARD = 0.025;

/* ---------- FOOTER ---------- */
function updateFooter() {
  setInterval(() => {
    const f = document.getElementById("footer");
    if (f) f.innerText = new Date().toLocaleString();
  }, 1000);
}

/* ---------- ADS QUEUE SYSTEM ---------- */
let adBusy = false;

function playAd() {
  if (adBusy) return;
  adBusy = true;

  show_10276123() // Rewarded Interstitial
  .then(() => {
    rewardUser();
    return show_10276123('pop'); // Rewarded Popup
  })
  .catch(()=>{})
  .finally(() => {
    adBusy = false;
  });
}

function rewardUser() {
  setTimeout(() => {
    earnings += REWARD;
    localStorage.setItem("earnings", earnings);
    document.getElementById("earnings").innerText = earnings.toFixed(3);
    updateLeaderboard();
  }, 10000);
}

/* ---------- LEADERBOARD ---------- */
function updateLeaderboard() {
  let lb = JSON.parse(localStorage.getItem("leaderboard")) || [];
  let u = lb.find(x => x.name === username);
  if (u) u.earnings = earnings;
  else lb.push({ name: username, earnings });
  localStorage.setItem("leaderboard", JSON.stringify(lb));
}

/* ---------- WITHDRAW ---------- */
function requestWithdraw(amount, gcash) {
  amount = parseFloat(amount);
  if (amount < 1 || amount > 99) return alert("1–99 PHP only");

  let w = JSON.parse(localStorage.getItem("withdrawals")) || [];
  w.push({ user: username, amount, gcash, approved: false });
  localStorage.setItem("withdrawals", JSON.stringify(w));
  alert("Request sent");
}

/* ---------- OWNER LOGIN ---------- */
function loginOwner() {
  if (document.getElementById("ownerPass").value !== "Propetas6")
    return alert("Wrong password");

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panelBox").classList.remove("hidden");
  loadWithdrawals();
}

/* ---------- OWNER MANUAL APPROVAL ---------- */
function loadWithdrawals() {
  let w = JSON.parse(localStorage.getItem("withdrawals")) || [];
  let t = document.getElementById("withdrawTable");
  t.innerHTML = "";

  w.forEach((x, i) => {
    t.innerHTML += `
      <tr>
        <td>${x.user}</td>
        <td>${x.amount}</td>
        <td>${x.gcash}</td>
        <td>${x.approved ? "Approved" : "Pending"}</td>
        <td>
          ${!x.approved ? `<button onclick="approve(${i})">Approve</button>` : ""}
        </td>
      </tr>`;
  });
}

function approve(i) {
  let w = JSON.parse(localStorage.getItem("withdrawals"));
  w[i].approved = true;
  localStorage.setItem("withdrawals", JSON.stringify(w));
  loadWithdrawals();
}

/* ---------- NAV ---------- */
function goHome() {
  location.href = "index.html";
}
