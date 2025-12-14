// Firebase config (replace with your own)
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID"
});

const db = firebase.database();
const OWNER_ID = 123456789;

// Telegram identity
const tg = window.Telegram?.WebApp;
const userId = tg?.initDataUnsafe?.user?.id || "demo";
let userName = tg?.initDataUnsafe?.user?.first_name || "Guest";

// Profile display
document.getElementById("username").innerText = userName;

// Auto-update Firebase user profile
db.ref("users/"+userId+"/profileName").set(userName);

// --- ONLINE USERS ---
db.ref("onlineUsers/"+userId).set(true);
db.ref("onlineUsers/"+userId).onDisconnect().remove();
db.ref("onlineUsers").on("value", s=>{
  document.getElementById("onlineCount").innerText = "Online: " + s.numChildren();
});

// --- BALANCE ---
const balanceRef = db.ref("users/"+userId+"/balance");
balanceRef.on("value", snap => {
  document.getElementById("balance").innerText = (snap.val()||0).toFixed(3);
});

function addBalance(v){
  balanceRef.transaction(b => (b||0) + v);
}

// --- WATCH ADS / GIFTS ---
let giftCooldown = false;

function watchAds(){
  play4Ads(0.025);
}

function watchGifts(){
  if(giftCooldown) return;
  play4Ads(0.03);
  giftCooldown = true;
  let sec = 300; // 5 min
  const interval = setInterval(()=>{
    document.getElementById("giftCooldown").innerText = "Cooldown: " + sec + "s";
    sec--;
    if(sec<0){ clearInterval(interval); giftCooldown=false; document.getElementById("giftCooldown").innerText=""; }
  },1000);
}

function play4Ads(reward){
  let count = 0;
  function nextAd(){
    if(count>=4){ addBalance(reward); alert("Reward added: ₱"+reward.toFixed(2)); return; }
    show_10276123('pop').then(()=>{ count++; nextAd(); }).catch(()=>{ alert("Ad failed"); });
  }
  nextAd();
}

// --- AFFILIATE ---
function showAffiliate(){
  const link = "https://t.me/SENTINEL_DARK_bot?start=ref_"+userId;
  const div = document.getElementById("affiliateLinks");
  div.innerHTML = `<input readonly value="${link}" onclick="this.select();document.execCommand('copy');alert('Copied!')">`;
}

// --- PROFILE NAME CHANGE ---
function changeName(){
  const newName = prompt("Enter new name", userName);
  if(newName){ userName=newName; document.getElementById("username").innerText=userName; db.ref("users/"+userId+"/profileName").set(newName);}
}

// --- WORLD CHAT ---
const chatRef = db.ref("worldChat");
chatRef.limitToLast(500).on("value", snap=>{
  const box = document.getElementById("chatBox");
  box.innerHTML = "";
  snap.forEach(c=>{
    const m = c.val();
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.name}</b>: ${m.text}`;
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
});

let lock=false;
let dailyCountRef = db.ref("users/"+userId+"/dailyChatCount");

function sendChat(){
  if(lock) return alert("Wait...");
  const text = document.getElementById("chatInput").value.trim();
  if(!text) return;
  lock=true;

  // 2 ads per message
  show_10276123('pop').then(()=>{
    show_10276123().then(()=>{
      addBalance(0.015);
      chatRef.push({uid:userId,name:userName,text:text,time:Date.now(),reactions:{}});
      alert("Message sent and rewards added");
      document.getElementById("chatInput").value="";
      lock=false;

      // daily chat task
      dailyCountRef.transaction(c => (c||0)+1, (err,snap)=>{
        if(snap?.snapshot?.val()===1000){ addBalance(2); alert("Daily task complete! +₱2.00"); }
      });
    }).catch(()=>{ lock=false; alert("Ad failed"); });
  }).catch(()=>{ lock=false; alert("Ad failed"); });
}

// --- OWNER DASHBOARD ---
function loadWithdrawals(){
  if(userId!==OWNER_ID){ alert("Unauthorized"); return; }
  const tableDiv = document.getElementById("withdrawalTable");
  db.ref("withdrawals").once("value").then(snap=>{
    let html = "<table border=1><tr><th>User</th><th>Amount</th><th>Status</th></tr>";
    snap.forEach(c=>{
      const w=c.val();
      html+=`<tr><td>${w.userName}</td><td>₱${w.amount}</td><td>${w.status}</td></tr>`;
    });
    html+="</table>";
    tableDiv.innerHTML=html;
    // send all withdrawal records to Gmail via backend or serverless function (implementation needed)
  });
}
