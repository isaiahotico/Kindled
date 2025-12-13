// ===== Telegram WebApp User =====
const tgUser = Telegram.WebApp.initDataUnsafe?.user || {id: prompt("Enter Telegram ID"), username: prompt("Enter username")};
const tgStartParam = Telegram.WebApp.initDataUnsafe?.start_param || "";
const tgId = tgUser.id.toString();
let currentUser = null;

// ===== Utility =====
function generateCode(length=6){
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code="";
  for(let i=0;i<length;i++) code+=chars.charAt(Math.floor(Math.random()*chars.length));
  return code;
}

// ===== Firebase Save User =====
function saveUserGlobal(user){
  if(!user||!user.tgId) return;
  db.ref("users/"+user.tgId).set(user);
}

// ===== Load Single User =====
function loadUser(tgId,callback){
  db.ref("users/"+tgId).once("value").then(snapshot=>{
    callback(snapshot.exists()?snapshot.val():null);
  });
}

// ===== Create User if Not Exists =====
function createUserIfNotExists(){
  loadUser(tgId,user=>{
    if(!user){
      currentUser={
        tgId:tgId,
        username: tgUser.username||"User",
        balance:0,
        totalEarned:0,
        referralCode:generateCode(),
        referredBy: tgStartParam || "",
        referralBonus:0,
        lastActive:Date.now()
      };
      saveUserGlobal(currentUser);
    } else currentUser=user;
    updateUI();
  });
}

// ===== Global Leaderboard =====
function loadLeaderboard(){
  db.ref("users").orderByChild("totalEarned").limitToLast(10).on("value",snap=>{
    let users=[];
    snap.forEach(s=>users.push(s.val()));
    users.reverse();
    let html="";
    users.forEach((u,i)=>html+=`${i+1}. ${u.username} — ₱${(u.totalEarned||0).toFixed(2)}<br>`);
    document.getElementById("leaderboard").innerHTML=html;
  });
}

// ===== Ad Reward System =====
let adCooldown=false;
document.getElementById("watchAdsBtn").addEventListener("click",()=>{
  if(adCooldown){ alert("Wait 30 seconds before next ad!"); return; }
  rewardAds(0.03);
  adCooldown=true;
  setTimeout(()=>adCooldown=false,30000);
});

// Reward user and give referral bonus
function rewardAds(amount){
  if(!currentUser) return;
  currentUser.balance+=amount;
  currentUser.totalEarned+=amount;
  saveUserGlobal(currentUser);

  // Referral bonus 10%
  if(currentUser.referredBy){
    db.ref("users").orderByChild("referralCode").equalTo(currentUser.referredBy).once("value").then(snap=>{
      snap.forEach(ref=>{
        const refUser=ref.val();
        refUser.balance+=(amount*0.1);
        refUser.referralBonus+=(amount*0.1);
        saveUserGlobal(refUser);
        showNotification(`Referral bonus ₱${(amount*0.1).toFixed(2)} to ${refUser.username}`);
      });
    });
  }

  document.getElementById("rewardInfo").innerText=`You earned ₱${amount.toFixed(2)}!`;
  showNotification(`${currentUser.username} earned ₱${amount.toFixed(2)}`);
}

// ===== Live Notifications =====
function showNotification(msg){
  const notif=document.getElementById("notification");
  notif.innerText=msg;
  notif.style.right="10px";
  setTimeout(()=>{notif.style.right="-300px";},4000);
}

// ===== Admin Hidden Panel =====
function showAdminPanel(){
  const pass=prompt("Enter Admin Password");
  if(pass!=="Propetas6") return;
  const panel=document.createElement("div");
  panel.style.position="fixed"; panel.style.bottom="10px"; panel.style.left="10px";
  panel.style.background="#222"; panel.style.color="#fff"; panel.style.padding="10px"; panel.style.zIndex=9999;
  panel.innerHTML=`<h3>Admin Panel</h3>
  <button onclick="approveWithdrawals()">Approve Withdrawals</button>`;
  document.body.appendChild(panel);
}

function approveWithdrawals(){
  db.ref("withdrawals").orderByChild("status").equalTo("pending").once("value").then(snap=>{
    snap.forEach(w=>{
      const data=w.val();
      data.status="approved";
      db.ref("withdrawals/"+w.key).set(data);
      showNotification(`Withdrawal ₱${data.amount} approved for ${data.username}`);
    });
  });
}

// ===== Update UI =====
function updateUI(){
  loadLeaderboard();
  showAdminPanel();
}

// ===== Init =====
createUserIfNotExists();
