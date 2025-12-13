import { db, ref, onValue, update } from './firebase.js';
import { checkOwnerAccess } from './utils.js';

if(!checkOwnerAccess()){
  document.body.innerHTML = "<h2>Access Denied</h2>";
  throw new Error("Owner access required");
}

const tableBody = document.querySelector('#withdrawalsTable tbody');
const withdrawalsRef = ref(db, 'withdrawals');

function renderTable(data){
  tableBody.innerHTML = '';
  if(!data) return;

  Object.keys(data).forEach(id=>{
    const w = data[id];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${id}</td>
      <td>${w.uid}</td>
      <td>₱${w.amount.toFixed(2)}</td>
      <td>${w.method}</td>
      <td id="status_${id}">${w.status}</td>
      <td><button data-id="${id}" class="approve-btn">Approve</button></td>
    `;
    tableBody.appendChild(tr);
  });

  attachApproveButtons();
}

function attachApproveButtons(){
  document.querySelectorAll('.approve-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      update(ref(db, `withdrawals/${id}`), {status:'approved'});
      document.getElementById(`status_${id}`).innerText = 'approved';
    });
  });
}

// Auto-approve pending withdrawals & render table
onValue(withdrawalsRef, snap=>{
  const data = snap.val();
  if(!data) return;

  Object.keys(data).forEach(id=>{
    if(data[id].status==='pending'){
      update(ref(db, `withdrawals/${id}`), {status:'approved'});
    }
  });

  renderTable(data);
});
