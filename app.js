import { 
  collection, addDoc, getDocs, updateDoc, doc, onSnapshot, query, where 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Rainbow Text
const rainbowText = document.getElementById('rainbow-text');
rainbowText.innerHTML = rainbowText.textContent.split('').map(c => `<span class="rainbow-char">${c}</span>`).join('');

// Telegram simulation
const username = 'User123';
const userid = '987654321';
document.getElementById('tg-username').textContent = username;
document.getElementById('tg-id').textContent = userid;

// Firestore collections
const usersCol = collection(window.db, 'users');
const withdrawCol = collection(window.db, 'withdrawals');

let balance = 0;
const balanceDisplay = document.getElementById('balance');

// Save Profile
document.getElementById('save-profile').addEventListener('click', async () => {
  const sex = document.getElementById('sex').value;
  const age = document.getElementById('age').value;
  const birthday = document.getElementById('birthday').value;

  await addDoc(usersCol, { username, userid, sex, age, birthday, balance });
  alert('Profile saved!');
});

// Watch Ad & Reward
document.getElementById('watch-ad').addEventListener('click', () => {
  show_10276123('pop').then(async () => {
    balance += 1;
    balanceDisplay.textContent = balance;
    alert('You earned 1 peso!');
    await addDoc(usersCol, { username, userid, balance });
  }).catch(e => alert('Ad failed to load.'));
});

// Request Withdrawal
document.getElementById('request-withdraw').addEventListener('click', async () => {
  const gcash = document.getElementById('gcash').value;
  if(balance < 1) return alert('Minimum 1 peso required');
  const time = new Date().toLocaleString();
  await addDoc(withdrawCol, { username, userid, gcash, amount: balance, status: 'Pending', time });
  balance = 0;
  balanceDisplay.textContent = balance;
});

// Real-time withdrawal table update
const tbody = document.querySelector('#withdraw-table tbody');
onSnapshot(withdrawCol, snapshot => {
  tbody.innerHTML = '';
  snapshot.forEach(docSnap => {
    const w = docSnap.data();
    tbody.innerHTML += `<tr>
      <td>${w.username}</td>
      <td>${w.gcash}</td>
      <td>${w.amount}</td>
      <td>${w.status}</td>
      <td>${w.time}</td>
    </tr>`;
  });
});

// Admin Login
document.getElementById('admin-login').addEventListener('click', () => {
  const pass = document.getElementById('admin-pass').value;
  if(pass === 'Propetas6'){
    document.getElementById('admin-panel').style.display = 'block';
    alert('Admin access granted');
  } else {
    alert('Wrong password');
  }
});

// Approve All Withdrawals in real-time
document.getElementById('approve-all').addEventListener('click', async () => {
  const snapshot = await getDocs(withdrawCol);
  snapshot.forEach(async docSnap => {
    const wRef = doc(window.db, 'withdrawals', docSnap.id);
    await updateDoc(wRef, { status: 'Approved' });
  });
});
