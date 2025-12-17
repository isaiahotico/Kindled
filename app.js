// Firebase Initialization
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const userId = "user123";
const displayNameEl = document.getElementById('displayName');
const balanceEl = document.getElementById('userBalance');
const updateNameBtn = document.getElementById('updateNameBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const gcashInput = document.getElementById('gcashNumber');
const amountInput = document.getElementById('withdrawAmount');
const userTbody = document.querySelector('#userWithdrawalTable tbody');
const adminTbody = document.querySelector('#adminTable tbody');
const adminSearch = document.getElementById('adminSearch');

// ---------------- Update Telegram Name ----------------
async function updateTelegramName() {
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if(!telegramUser) return alert('Cannot fetch Telegram user');
  const telegramName = telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '');
  const telegramUsername = telegramUser.username || '';
  const telegramId = telegramUser.id;

  displayNameEl.textContent = `User: ${telegramName}`;

  await db.collection('users').doc(userId).set({
    telegramId,
    telegramUsername,
    telegramName,
    balance: firebase.firestore.FieldValue.increment(0)
  }, { merge:true });

  const snapshot = await db.collection('withdrawals').where('userId','==',userId).get();
  snapshot.forEach(doc => doc.ref.update({ userName: telegramName, telegramUsername }));
  alert(`Telegram name updated: ${telegramName}`);
}
updateNameBtn.addEventListener('click', updateTelegramName);

// ---------------- Load User Data ----------------
db.collection('users').doc(userId).onSnapshot(doc => {
  if(doc.exists){
    const data = doc.data();
    displayNameEl.textContent = `User: ${data.telegramName || 'Unknown'}`;
    balanceEl.textContent = `₱${data.balance || 50000}`;
  }
});

// ---------------- Submit Withdrawal ----------------
withdrawBtn.addEventListener('click', async () => {
  const amount = parseFloat(amountInput.value);
  const gcash = gcashInput.value.trim();
  if(!gcash || amount <= 0) return alert("Enter valid GCash and amount");

  const userDoc = await db.collection('users').doc(userId).get();
  const balance = userDoc.data().balance || 50000;
  if(amount > balance) return alert("Insufficient balance");

  await db.collection('withdrawals').add({
    userId,
    userName: userDoc.data().telegramName,
    telegramUsername: userDoc.data().telegramUsername || '',
    gcash,
    amount,
    status: 'pending',
    requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
    approvedAt: null
  });
  await db.collection('users').doc(userId).update({ balance: balance - amount });
  amountInput.value=''; gcashInput.value='';
});

// ---------------- Render User Table ----------------
db.collection('withdrawals').where('userId','==',userId)
.onSnapshot(snapshot => {
  userTbody.innerHTML='';
  snapshot.forEach(doc => {
    const w = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>₱${w.amount}</td><td class="status-${w.status}">${w.status}</td><td>${w.requestedAt?.toDate().toLocaleString() || ''}</td>`;
    userTbody.appendChild(tr);
  });
});

// ---------------- Render Admin Table ----------------
db.collection('withdrawals').orderBy('requestedAt','desc')
.onSnapshot(snapshot => {
  const search = adminSearch.value.toLowerCase();
  adminTbody.innerHTML='';
  snapshot.forEach(doc => {
    const w = doc.data();
    if(search && !w.userName.toLowerCase().includes(search) && !w.gcash.includes(search)) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${w.telegramUsername ? `<a href="https://t.me/${w.telegramUsername}" target="_blank">${w.userName}</a>` : w.userName}</td>
      <td>${w.gcash}</td>
      <td>₱${w.amount}</td>
      <td class="status-${w.status}">${w.status}</td>
      <td>${w.requestedAt?.toDate().toLocaleString() || ''}</td>
      <td>${w.status === 'pending' ? `<button onclick="approve('${doc.id}')">Approve</button> <button onclick="deny('${doc.id}')">Deny</button>` : ''}</td>
    `;
    adminTbody.appendChild(tr);
  });
});
adminSearch.addEventListener('input', ()=>{}); // reactive

// ---------------- Admin Approve/Deny ----------------
window.approve = async (id) => {
  const docRef = db.collection('withdrawals').doc(id);
  const doc = await docRef.get();
  const w = doc.data();
  await docRef.update({ status:'approved', approvedAt:firebase.firestore.FieldValue.serverTimestamp() });
};
window.deny = async (id) => {
  const docRef = db.collection('withdrawals').doc(id);
  const doc = await docRef.get();
  const w = doc.data();
  const userRef = db.collection('users').doc(w.userId);
  const userDoc = await userRef.get();
  await userRef.update({ balance: (userDoc.data().balance||0) + w.amount });
  await docRef.update({ status:'denied', approvedAt:firebase.firestore.FieldValue.serverTimestamp() });
};
