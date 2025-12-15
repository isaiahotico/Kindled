import { 
collection, addDoc, getDocs, updateDoc, doc, onSnapshot, runTransaction 
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Rainbow Text
const rainbowText = document.getElementById('rainbow-text');
rainbowText.innerHTML = rainbowText.textContent.split('').map(c => `<span class="rainbow-char">${c}</span>`).join('');

// Telegram simulation
const username = 'User123';
const userid = '987654321';
document.getElementById('tg-username').textContent = username;
document.getElementById('tg-id').textContent = userid;

// Firestore
const usersCol = collection(window.db, 'users');
const withdrawCol = collection(window.db, 'withdrawals');

let balance = 0;
const balanceDisplay = document.getElementById('balance');

// Toast notification
function showToast(msg){
  const toast = document.createElement('div');
  toast.className='toast';
  toast.textContent=msg;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(()=>toast.remove(),3500);
}

// Save Profile
document.getElementById('save-profile').addEventListener('click', async () => {
  const sex = document.getElementById('sex').value;
  const age = document.getElementById('age').value;
  const birthday = document.getElementById('birthday').value;
  await addDoc(usersCol, { username, userid, sex, age, birthday, balance });
  showToast('Profile saved!');
});

// Watch Ad & Reward
document.getElementById('watch-ad').addEventListener('click', ()=>{
  show_10276123('pop').then(async()=>{
    balance += 1;
    balanceDisplay.textContent = balance;
    await addDoc(usersCol, { username, userid, balance });
    showToast('You earned 1 peso!');
  }).catch(()=>showToast('Ad failed.'));
});

// Request Withdrawal
document.getElementById('request-withdraw').addEventListener('click', async ()=>{
  const gcash = document.getElementById('gcash').value;
  if(balance<1){ showToast('Minimum 1 peso required'); return; }
  const time = new Date().toLocaleString();
  await addDoc(withdrawCol, { username, userid, gcash, amount: balance, status:'Pending', time, adminId:'' });
  balance=0; balanceDisplay.textContent=balance;
  showToast('Withdrawal requested!');
});

// Table & Tabs
const tbody=document.querySelector('#withdraw-table tbody');
let filterStatus='Pending';
const searchInput=document.getElementById('search-user');

// Render table
function renderTable(snapshot){
  tbody.innerHTML='';
  snapshot.forEach(docSnap=>{
    const w=docSnap.data();
    const match=!searchInput.value||w.username.includes(searchInput.value)||w.userid.includes(searchInput.value);
    if(match && w.status===filterStatus){
      const highClass=w.amount>=50?'high-amount':'';
      tbody.innerHTML+=`<tr class="${highClass}">
        <td>${w.username}</td>
        <td>${w.gcash}</td>
        <td>${w.amount}</td>
        <td>${w.status}</td>
        <td>${w.time}</td>
        <td>${w.adminId||'-'}</td>
        <td>${w.status==='Pending'?`<button class="approve-btn" data-id="${docSnap.id}">✅</button> <button class="reject-btn" data-id="${docSnap.id}">❌</button>`:''}</td>
      </tr>`;
    }
  });
  document.querySelectorAll('.approve-btn').forEach(btn=>{ btn.onclick=()=>approveWithdrawal(btn.dataset.id); });
  document.querySelectorAll('.reject-btn').forEach(btn=>{ btn.onclick=()=>rejectWithdrawal(btn.dataset.id); });
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{ filterStatus=btn.dataset.status; snapshotListener(); });
});

// Search
searchInput.addEventListener('input', snapshotListener);

let unsubscribe;
function snapshotListener(){
  if(unsubscribe) unsubscribe();
  unsubscribe=onSnapshot(withdrawCol, snapshot=>{
    renderTable(snapshot);
    // Notify admin for new pending
    snapshot.forEach(docSnap=>{
      const w=docSnap.data();
      if(w.status==='Pending' && !document.querySelector(`tr[data-id="${docSnap.id}"]`)) showToast(`New withdrawal: ${w.username} ${w.amount} peso`);
    });
  });
}

// Admin Login
document.getElementById('admin-login').addEventListener('click', ()=>{
  const pass=document.getElementById('admin-pass').value;
  if(pass==='Propetas6'){ document.getElementById('admin-panel').style.display='block'; showToast('Admin access granted'); snapshotListener(); }
  else showToast('Wrong password');
});

// Approve / Reject with transaction
async function approveWithdrawal(id){
  const adminId='Admin1';
  const wRef=doc(window.db,'withdrawals',id);
  await runTransaction(window.db, async t=>{
    const wDoc=await t.get(wRef);
    if(wDoc.data().status!=='Pending') throw 'Already processed';
    t.update(wRef,{status:'Approved', adminId});
  });
  showToast('Withdrawal approved!');
}

async function rejectWithdrawal(id){
  const adminId='Admin1';
  const wRef=doc(window.db,'withdrawals',id);
  await runTransaction(window.db, async t=>{
    const wDoc=await t.get(wRef);
    if(wDoc.data().status!=='Pending') throw 'Already processed';
    t.update(wRef,{status:'Rejected', adminId});
  });
  showToast('Withdrawal rejected!');
}

// Approve All
document.getElementById('approve-all').addEventListener('click', async ()=>{
  const snapshot=await getDocs(withdrawCol);
  snapshot.forEach(async docSnap=>{ if(docSnap.data().status==='Pending') await approveWithdrawal(docSnap.id); });
});
