/* ---------- USER SETUP ---------- */
let username = localStorage.getItem("username");
if (!username) {
  username = "User" + Math.floor(Math.random()*9999);
  localStorage.setItem("username", username);
}

let earnings = parseFloat(localStorage.getItem("earnings")) || 0;
const REWARD = 0.025;

/* ---------- NAV ---------- */
function go(p){ location.href = p; }

/* ---------- FOOTER ---------- */
function updateFooter(){
  setInterval(()=>{
    let f=document.getElementById("footer");
    if(f) f.innerText=new Date().toLocaleString();
  },1000);
}

/* ---------- BALANCE ---------- */
function loadBalance(){
  let e=document.getElementById("earnings");
  if(e) e.innerText=earnings.toFixed(3);
}

/* ---------- ADS SYSTEM (QUEUED) ---------- */
let adBusy=false;

function playAd(){
  if(adBusy) return;
  adBusy=true;

  show_10276123()
  .then(()=>{
    return show_10276123('pop');
  })
  .finally(()=>{
    setTimeout(()=>{
      earnings+=REWARD;
      localStorage.setItem("earnings",earnings);
      loadBalance();
      adBusy=false;
    },10000);
  });
}

/* ---------- WITHDRAW ---------- */
function withdraw(){
  let amt=parseFloat(document.getElementById("amount").value);
  let gcash=document.getElementById("gcash").value;

  if(amt<1||amt>99) return alert("₱1–₱99 only");
  if(amt>earnings) return alert("Not enough balance");

  let w=JSON.parse(localStorage.getItem("withdrawals"))||[];
  w.push({user:username,amount:amt,gcash,approved:false});
  localStorage.setItem("withdrawals",JSON.stringify(w));

  earnings-=amt;
  localStorage.setItem("earnings",earnings);
  loadBalance();
  alert("Request sent");
}

/* ---------- OWNER ---------- */
function loginOwner(){
  if(document.getElementById("ownerPass").value!=="Propetas6")
    return alert("Wrong password");

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panelBox").classList.remove("hidden");
  loadWithdrawals();
}

function loadWithdrawals(){
  let w=JSON.parse(localStorage.getItem("withdrawals"))||[];
  let t=document.getElementById("withdrawTable");
  t.innerHTML="";
  w.forEach((x,i)=>{
    t.innerHTML+=`
    <tr>
      <td>${x.user}</td>
      <td>₱${x.amount}</td>
      <td>${x.gcash}</td>
      <td>${x.approved?"Approved":"Pending"}</td>
      <td>${!x.approved?`<button onclick="approve(${i})">Approve</button>`:""}</td>
    </tr>`;
  });
}

function approve(i){
  let w=JSON.parse(localStorage.getItem("withdrawals"));
  w[i].approved=true;
  localStorage.setItem("withdrawals",JSON.stringify(w));
  loadWithdrawals();
}
