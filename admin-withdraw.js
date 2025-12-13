import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const ADMIN_PASSWORD = "Propetas6";

document.getElementById('admin-login-btn').addEventListener('click', async () => {
  const password = document.getElementById('admin-password').value;
  if(password !== ADMIN_PASSWORD){ alert('Incorrect password!'); return; }
  document.querySelector('.admin-login').style.display='none';
  document.getElementById('withdrawals-panel').style.display='block';
  await loadWithdrawals();
});

async function loadWithdrawals(){
  const db=getDatabase(); const usersRef=ref(db,"users"); const snapshot=await get(usersRef);
  if(!snapshot.exists()) return;
  const tbody=document.querySelector('#withdrawals-table tbody'); tbody.innerHTML='';
  snapshot.forEach(userSnap=>{
    const user=userSnap.val(); const tgId=userSnap.key;
    if(user.withdrawals && user.withdrawals.length>0){
      user.withdrawals.forEach((w,idx)=>{
        const row=document.createElement('tr');
        row.innerHTML=`
          <td>${user.username}</td>
          <td>${tgId}</td>
          <td>${w.amount}</td>
          <td>${w.peso.toFixed(2)}</td>
          <td>${w.usdt.toFixed(5)}</td>
          <td>${w.method}</td>
          <td>${new Date(w.timestamp).toLocaleString()}</td>
          <td>${w.status}</td>
          <td>${w.status==='pending'?`<button data-tgid="${tgId}" data-index="${idx}" class="approve-btn">Approve</button> <button data-tgid="${tgId}" data-index="${idx}" class="reject-btn">Reject</button>`:''}</td>`;
        tbody.appendChild(row);
      });
    }
  });
  document.querySelectorAll('.approve-btn').forEach(btn=>btn.addEventListener('click',e=>updateWithdrawalStatus(e.target.dataset.tgid,e.target.dataset.index,'approved')));
  document.querySelectorAll('.reject-btn').forEach(btn=>btn.addEventListener('click',e=>updateWithdrawalStatus(e.target.dataset.tgid,e.target.dataset.index,'rejected')));
}

async function updateWithdrawalStatus(tgId,index,status){
  const db=getDatabase(); const wRef=ref(db,`users/${tgId}/withdrawals`);
  const snap=await get(wRef); if(!snap.exists()) return;
  const withdrawals=snap.val(); withdrawals[index].status=status;
  await set(wRef,withdrawals); alert(`Withdrawal ${status.toUpperCase()}`); await loadWithdrawals();
}
