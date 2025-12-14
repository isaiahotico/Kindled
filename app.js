/* USER */
let username = localStorage.getItem("username");
if (!username) {
  username = "user" + Math.floor(Math.random() * 9999);
  localStorage.setItem("username", username);
}

let earnings = parseFloat(localStorage.getItem("earnings")) || 0;
const REWARD = 0.025;

/* NAV */
function go(p) { location.href = p; }

/* FOOTER */
function updateFooter() {
  setInterval(() => {
    const f = document.getElementById("footer");
    if (f) f.textContent = new Date().toLocaleString();
  }, 1000);
}

/* BALANCE */
function loadBalance() {
  const e = document.getElementById("earnings");
  if (e) e.textContent = earnings.toFixed(3);
}

/* ADS (MONETAG SAFE) */
let adBusy = false;

function playAdSafe() {
  if (adBusy) return;
  if (typeof show_10276123 !== "function") {
    alert("Ads loading… try again.");
    return;
  }

  adBusy = true;

  show_10276123()
    .then(() => {
      setTimeout(() => {
        earnings += REWARD;
        localStorage.setItem("earnings", earnings);
        loadBalance();
      }, 10000);
    })
    .catch(() => alert("Ad unavailable"))
    .finally(() => setTimeout(() => adBusy = false, 1500));
}

/* WITHDRAW */
function withdraw() {
  const amt = parseFloat(amount.value);
  const gc = gcash.value;

  if (amt < 1 || amt > 99) return alert("₱1 – ₱99 only");
  if (amt > earnings) return alert("Insufficient balance");

  const w = JSON.parse(localStorage.getItem("withdrawals")) || [];
  w.push({ user: username, amount: amt, gcash: gc, approved: false });
  localStorage.setItem("withdrawals", JSON.stringify(w));

  earnings -= amt;
  localStorage.setItem("earnings", earnings);
  loadBalance();
  alert("Request sent");
}

/* OWNER */
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
