/* ---------- FIREBASE ---------- */
firebase.initializeApp({ /* YOUR CONFIG */ });
const db = firebase.database();

/* ---------- USER ID ---------- */
const telegramId =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id ||
  "guest_" + Math.random().toString(36).slice(2);

/* ---------- STATE ---------- */
let balance = Number(localStorage.getItem(telegramId+"_bal")) || 0;
let progress = Number(localStorage.getItem(telegramId+"_prog")) || 0;
let canClick = true;

/* ---------- CONSTANTS ---------- */
const ADS_MIN = 5, ADS_MAX = 7;
const CLICK_COOLDOWN = 4000;

/* ---------- UI INIT ---------- */
updateUI();

/* ---------- SAFE AD CALL ---------- */
async function showAdSafe(){
  try{ await show_10276123(); }
  catch(e){ console.warn("Ad skipped"); }
}

/* ---------- REWARD LOGIC ---------- */
function randomReward(){
  return [0.025,0.03,0.035,0.04][Math.floor(Math.random()*4)];
}

async function playAds(){
  if(!canClick) return alert("Cooldown…");
  canClick = false;

  const count = ADS_MIN + Math.floor(Math.random()*(ADS_MAX-ADS_MIN+1));
  for(let i=0;i<count;i++){
    await showAdSafe();
    await new Promise(r=>setTimeout(r,800));
  }

  const reward = randomReward();
  balance += reward;
  progress++;

  save();
  popup(reward);

  setTimeout(()=>canClick=true, CLICK_COOLDOWN);
}

document.getElementById("btnAllAds").onclick = playAds;

/* ---------- DAILY ---------- */
const DAILY = 0.04;
document.getElementById("dailyLoginBtn").onclick = async ()=>{
  await showAdSafe();
  balance += DAILY;
  save();
  popup(DAILY);
};

/* ---------- GIFT ---------- */
document.getElementById("giftBtn").onclick = async ()=>{
  await showAdSafe();
  balance += 0.02;
  save();
  popup(0.02);
};

/* ---------- SAVE ---------- */
function save(){
  localStorage.setItem(telegramId+"_bal", balance);
  localStorage.setItem(telegramId+"_prog", progress);
  updateUI();
  db.ref("users/"+telegramId).set({balance,progress});
}

/* ---------- UI ---------- */
function updateUI(){
  document.getElementById("balance").innerText = "₱"+balance.toFixed(3);
  document.getElementById("storyLevel").innerText = "Level "+(Math.floor(progress/5)+1);
  document.getElementById("progressFill").style.width = (progress%5)*20+"%";
}

function popup(val){
  const p=document.getElementById("rewardPopup");
  p.innerText = "+₱"+val.toFixed(3);
  p.style.opacity=1;
  setTimeout(()=>p.style.opacity=0,2200);
}

/* ---------- TIME ---------- */
setInterval(()=>{
  document.getElementById("timeDate").innerText=new Date().toLocaleString();
},1000);
