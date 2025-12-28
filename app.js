// Telegram Mini App login
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  const user = tg.initDataUnsafe?.user;
  document.getElementById('user').innerText =
    user ? '@' + (user.username || user.first_name) : '@unknown';
} else document.getElementById('user').innerText = '@guest';

// Persistent balance
let balance = parseFloat(localStorage.getItem('balance')) || 0;
function saveBalance() {
  localStorage.setItem('balance', balance);
  document.getElementById('balance').innerText = balance.toFixed(2);
}
saveBalance();

const COOLDOWN = 120;
const toast = document.getElementById('toast');
const cpmEls = {
  v1: document.getElementById('cpm-v1'),
  v2: document.getElementById('cpm-v2'),
  v3: document.getElementById('cpm-v3'),
};

function openPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(m) {
  toast.innerText = m;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2000);
}

const adPool = [
  { name:'v1', fn: ()=>show_10276123(), w:3 },
  { name:'v2', fn: ()=>show_10337795(), w:2 },
  { name:'v3', fn: ()=>show_10337853(), w:1 }
];

function pickAd() {
  const bag=[];
  adPool.forEach(a=>{for(let i=0;i<a.w;i++) bag.push(a)});
  return bag[Math.floor(Math.random()*bag.length)];
}

async function rewardAd(key, amt) {
  if (lock(key)) return;
  const ad = adPool.find(a=>a.name===key) || pickAd();
  try {
    const res = await ad.fn();
    finalizeReward(key, amt, res);
  } catch(e){}
}

async function rewardPop(key, amt) {
  if (lock(key)) return;
  const ad = adPool.find(a=>a.name===key) || pickAd();
  try {
    const res = await ad.fn('pop');
    finalizeReward(key, amt, res);
  } catch(e){}
}

async function countAd(key) {
  if (lock(key)) return;
  const ad = adPool.find(a=>a.name===key) || pickAd();
  try {
    const res = await ad.fn();
    recordCPM(key, res);
    showToast('Ad Viewed');
  } catch(e){}
}

function finalizeReward(key, amt, res) {
  let earned = amt;
  if (res && res.estimated_price) earned = res.estimated_price;
  balance += earned;
  saveBalance();
  recordCPM(key, { estimated_price: earned });
  showToast(`+₱${earned.toFixed(2)}`);
}

function recordCPM(key, res) {
  const val = res && res.estimated_price ? res.estimated_price.toFixed(2) : '-';
  if (cpmEls[key]) cpmEls[key].innerText = `₱${val}`;
}

function lock(k) {
  const t = localStorage.getItem('cd-'+k);
  if (t && Date.now()<t) return true;
  localStorage.setItem('cd-'+k, Date.now()+COOLDOWN*1000);
  runCooldown(k);
  return false;
}

function runCooldown(k) {
  const el = document.getElementById('cd-'+k);
  if (!el) return;
  const intervalId = setInterval(()=>{
    const remaining = localStorage.getItem('cd-'+k) - Date.now();
    if (remaining <= 0) {
      el.innerText = 'Ready';
      clearInterval(intervalId);
    } else el.innerText = `Cooldown ${Math.ceil(remaining/1000)}s`;
  },1000);
}
