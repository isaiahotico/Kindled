/* app.js — Flexible CPM (Option 2)
   - USA => High CPM banner
   - PH => Normal CPM banner
   - Others => Low CPM banner (still allowed)
   - Anti-VPN/datacenter blocking (strict)
   - Dual-buffer Monetag preloads (show_10276123)
   - Forced auto-close 15s + auto-next between buttons
   - No service worker
*/

const AUTO_CLOSE_MS = 15000; // 15 seconds
const BUFFER_SLOTS = 2;
const PROVIDER_BLACKLIST = [
  'amazon','aws','google','google cloud','microsoft','azure','digitalocean',
  'linode','vultr','ovh','hetzner','rackspace','softlayer','oracle','alibaba',
  'cloudflare','heroku','ibm','backblaze','hosting','hostinger','contabo',
  'leaseweb','choopa','tencent','server','datacenter','coloc','colo','hosted',
  'expressvpn','nordvpn','surfshark','purevpn','protonvpn','hide.me','hidemyass','ipvanish'
];

// UI elements
const appRoot = document.getElementById('appRoot');
const lockOverlay = document.getElementById('lockOverlay');
const lockReasonEl = document.getElementById('lockReason');
const retryBtn = document.getElementById('retryBtn');
const installBtn = document.getElementById('installBtn');

const cpmBanner = document.getElementById('cpmBanner');
const counterValueEl = document.getElementById('counterValue');
const simStatus = document.getElementById('simStatus');
const simProgressWrap = document.getElementById('simProgressWrap');
const simProgressBar = document.getElementById('simProgressBar');

const buttons = [
  document.getElementById('btn1'),
  document.getElementById('btn2'),
  document.getElementById('btn3'),
  document.getElementById('btn4')
].filter(Boolean);

// ---------- PWA install UX ----------
let deferredPrompt = null;
if (installBtn) installBtn.style.display = 'none';
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-flex';
});
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// ---------- Local daily counter ----------
function initDailyCounter() {
  const today = new Date().toLocaleDateString();
  let data = JSON.parse(localStorage.getItem('adCounterData')) || {};
  if (data.date !== today) {
    data = { date: today, count: 0 };
    localStorage.setItem('adCounterData', JSON.stringify(data));
  }
  return data;
}
let adCounterData = initDailyCounter();
function incrementCounter() {
  adCounterData.count += 1;
  localStorage.setItem('adCounterData', JSON.stringify(adCounterData));
  updateCounterDisplay();
}
function updateCounterDisplay() {
  if (!counterValueEl) return;
  counterValueEl.innerText = adCounterData.count;
}
updateCounterDisplay();

// ---------- Helper: small fetch with timeout ----------
async function callJson(url, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    clearTimeout(id);
    return null;
  }
}
function containsBlacklisted(str='') {
  if (!str) return false;
  const s = String(str).toLowerCase();
  return PROVIDER_BLACKLIST.some(k => s.includes(k));
}

// ---------- Geo + Anti-VPN logic (Flexible Mode) ----------
async function geoAndVpnCheckFlexible() {
  // try ipapi
  const a = await callJson('https://ipapi.co/json/');
  let country = a?.country || a?.country_code || a?.country_name || null;
  const org = a?.org || a?.organization || a?.hostname || '';
  const proxyFlag = a?.proxy || a?.is_proxy || false;

  // if ipapi not decisive, try ipwhois
  if (!country) {
    const b = await callJson('https://ipwhois.app/json/');
    country = b?.country || b?.country_code || null;
  }

  // if still not found, try ipinfo
  if (!country) {
    const c = await callJson('https://ipinfo.io/json');
    country = c?.country || null;
  }

  // Decide VPN/datacenter
  const suspected = proxyFlag || containsBlacklisted(org);

  return { country: country ? country.toUpperCase() : null, org, suspected, raw: { ipapi: a } };
}

// ---------- UI: show flexible CPM banner ----------
function showCpmBanner(mode, details='') {
  if (!cpmBanner) return;
  cpmBanner.classList.remove('hidden');
  if (mode === 'high') {
    cpmBanner.innerText = '🇺🇸 High CPM mode (USA) — Best earnings';
    cpmBanner.classList.add('high');
    cpmBanner.classList.remove('normal','low');
  } else if (mode === 'normal') {
    cpmBanner.innerText = '🇵🇭 Normal CPM mode (Philippines)';
    cpmBanner.classList.add('normal');
    cpmBanner.classList.remove('high','low');
  } else {
    cpmBanner.innerText = `🌍 Low CPM mode (Other) — ${details || 'Earnings may be lower'}`;
    cpmBanner.classList.add('low');
    cpmBanner.classList.remove('high','normal');
  }
}

// ---------- Initialize geo + gating ----------
async function initGeoFlex() {
  // show loading state
  if (lockReasonEl) lockReasonEl.innerText = 'Checking location & connection...';
  const res = await geoAndVpnCheckFlexible();

  // If suspected VPN/datacenter => block (strict)
  if (res.suspected) {
    if (lockReasonEl) lockReasonEl.innerText = `Blocked: detected datacenter/VPN (${res.org || 'unknown'})`;
    if (lockOverlay) lockOverlay.classList.remove('hidden');
    if (appRoot) appRoot.style.display = 'none';
    return;
  }

  // Decide banner
  const country = res.country;
  if (country === 'US') {
    showCpmBanner('high');
  } else if (country === 'PH' || country === 'PHL') {
    showCpmBanner('normal');
  } else {
    showCpmBanner('low', `Detected ${country || 'unknown'}`);
  }

  // show app
  if (appRoot) { appRoot.style.display = ''; appRoot.setAttribute('aria-hidden','false'); }
  if (lockOverlay) lockOverlay.classList.add('hidden');
}

retryBtn && retryBtn.addEventListener('click', () => {
  lockOverlay.classList.add('hidden');
  initGeoFlex();
});

// run at startup
initGeoFlex();

// ---------- AD BUFFER + PLAY LOGIC (Monetag) ----------
let adBuffer = [null, null];
let bufferIndex = 0;
let preloadInProgress = [false, false];
let currentIndex = 0;

// preload helper
async function preloadSlot(slot = 0, mode = 'reward') {
  if (preloadInProgress[slot]) return;
  preloadInProgress[slot] = true;
  try {
    const call = () => {
      adBuffer[slot] = show_10276123(mode).then(ai => ai).catch(()=> adBuffer[slot] = null);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(call, { timeout: 3000 });
    else setTimeout(call, 200);
  } catch(e) {
    adBuffer[slot] = null;
  }
  preloadInProgress[slot] = false;
}

// preload on load
window.addEventListener('load', () => {
  preloadSlot(0); preloadSlot(1);
});

// refill periodically
setInterval(()=> { adBuffer.forEach((a,i)=>{ if(!a) preloadSlot(i); }); }, 20000);

// UI simulator helpers
function showSimProgress() {
  if (!simProgressWrap || !simProgressBar) return;
  simProgressWrap.classList.add('show');
  simProgressBar.style.width = '0%';
  simProgressBar.style.transition = 'width 14s linear';
  requestAnimationFrame(()=> simProgressBar.style.width = '93%');
  if (simStatus) simStatus.innerText = 'Loading ad...';
}
function finishSimProgress() {
  if (!simProgressWrap || !simProgressBar) return;
  simProgressBar.style.transition = 'width 1s linear';
  simProgressBar.style.width = '100%';
  if (simStatus) simStatus.innerText = 'Finishing...';
  setTimeout(()=> {
    simProgressWrap.classList.remove('show');
    simProgressBar.style.transition = '';
    simProgressBar.style.width = '0%';
    if (simStatus) simStatus.innerText = 'Ready';
  }, 900);
}

// auto-close helper
async function autoCloseAd(adInstance, mode='reward') {
  return new Promise(resolve => {
    const forced = setTimeout(()=> {
      try { if (adInstance && typeof adInstance.close === 'function') adInstance.close(); } catch(e) {}
      resolve();
    }, AUTO_CLOSE_MS);
    if (adInstance && typeof adInstance.onFinish === 'function') {
      try {
        adInstance.onFinish(()=> {
          clearTimeout(forced);
          try { if (adInstance && typeof adInstance.close === 'function') adInstance.close(); } catch(e){}
          resolve();
        });
      } catch(e){}
    }
  });
}

// autoNext rotates index (programmatic advance — safe)
function autoNext() {
  currentIndex = (currentIndex + 1) % buttons.length;
}

// playAd
async function playAd(mode='reward') {
  const slot = bufferIndex;
  bufferIndex = (bufferIndex + 1) % BUFFER_SLOTS;
  let adInstance = null;

  if (adBuffer[slot]) {
    try { adInstance = await adBuffer[slot]; } catch(e){ adInstance = null; }
    adBuffer[slot] = null;
    preloadSlot(slot, mode);
  }

  if (!adInstance) {
    try { adInstance = await (mode === 'popup' ? show_10276123('pop') : show_10276123()); } catch(e){ adInstance = null; }
    preloadSlot(slot, mode);
  }

  // UI: show progress on current button & global bar
  const btn = buttons[currentIndex];
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  showSimProgress();

  // wait until ad finishes or forced close
  await autoCloseAd(adInstance, mode);

  // cleanup UI
  if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  finishSimProgress();

  // increment counter & advance
  incrementCounter();
  autoNext();
}

// wire manual clicks (keeps compatibility)
buttons.forEach((b, idx) => {
  if (!b) return;
  b.addEventListener('click', () => {
    currentIndex = idx;
    playAd('reward');
  });
});

// auto-loop start
function startAutoLoop() {
  function tick() {
    playAd('reward').then(()=> setTimeout(tick, 250));
  }
  tick();
}
window.addEventListener('load', startAutoLoop);

// ---------- Canvas particle background (kept light) ----------
(function particleCanvas(){
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize); resize();
  class P{ constructor(){ this.reset(); }
    reset(){ this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.vx=(Math.random()-0.5)*0.6; this.vy=(Math.random()-0.5)*0.6; this.s=1+Math.random()*3; this.h=Math.random()*360; this.a=0.25+Math.random()*0.55; }
    update(){ this.x+=this.vx; this.y+=this.vy; if(this.x<-10||this.x>canvas.width+10||this.y<-10||this.y>canvas.height+10) this.reset(); }
    draw(){ ctx.beginPath(); ctx.fillStyle=`hsla(${this.h},80%,65%,${this.a})`; ctx.arc(this.x,this.y,this.s,0,Math.PI*2); ctx.fill(); }
  }
  const parts = new Array(120).fill().map(()=>new P());
  (function frame(){ ctx.clearRect(0,0,canvas.width,canvas.height); const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height); g.addColorStop(0,'rgba(255,120,140,0.03)'); g.addColorStop(0.5,'rgba(120,215,255,0.03)'); g.addColorStop(1,'rgba(255,210,120,0.03)'); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height); parts.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(frame); })();
})();
