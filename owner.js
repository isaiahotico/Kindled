import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMGU5X7BBp-C6tIl34Uuu5N9MXAVFTn7c",
  authDomain: "paper-house-inc.firebaseapp.com",
  databaseURL: "https://paper-house-inc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "paper-house-inc",
  storageBucket: "paper-house-inc.appspot.com",
  messagingSenderId: "658389836376",
  appId: "1:658389836376:web:2ab1e2743c593f4ca8e02d"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Password Gate
const OWNER_PASSWORD = "Propetas6";
if (localStorage.getItem('isOwner') !== 'true') {
  const pass = prompt("Enter Owner Password:");
  if(pass === OWNER_PASSWORD) localStorage.setItem('isOwner','true');
  else alert("Access denied!") && window.close();
}

// Load Withdrawals
function loadWithdrawals() {
  onValue(ref(db, 'withdrawals'), snap => {
    const data = snap.val() || {};
    const tbody = document.querySelector("#withdrawalsTable tbody");
    tbody.innerHTML = "";
    Object.keys(data).forEach(id => {
      const w = data[id];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${w.uid}</td>
        <td>₱${w.amount}</td>
        <td>${w.method}</td>
        <td>${w.account}</td>
        <td>${w.status}</td>
        <td><button onclick="approve('${id}')">Approve</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Approve Withdrawal
window.approve = function(id) {
  update(ref(db, `withdrawals/${id}`), { status: "approved" });
}

loadWithdrawals();
