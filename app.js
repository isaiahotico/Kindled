/* app.js — Final merged implementation
   - Monetag primary + Adsterra fallback
   - 3 Ad buttons, autoplay, auto-close 15s
   - Rainbow per-letter UI
   - Global Chat (localStorage)
   - Special Event (global stored in localStorage)
   - Withdrawal (YouTube iframe verification), owner panel
   - Performance-minded: async, non-blocking, small improvements
*/

/* ===========================
   Configuration & constants
   =========================== */
const CONFIG = {
  ADSTERra1: "https://www.effectivegatecpm.com/ai7csj41?key=7e287f34b34183342aa072ceeccb42cf",
  ADSTERra2: "https://www.effectivegatecpm.com/hebhpc3tcm?key=e18e0c3b11bce2e7a0d722f6ac554232",
  MONETAG_ZONE: "10276123",
  AUTO_CLOSE_MS: 15000,       // auto-close or forced-finish after 15s
  AD_REWARD_POINTS: 1,
  EVENT_GUARDIAN_HP: 50000,
  EVENT_REWARD_POINTS: 2500,
  OWNER_PASSWORD: "Propetas6"
};

const RAIN_COLORS = ['#FF69B4','#FFFF66','#8A2BE2','#00FFFF','#FFFFFF','#FFB86B','#7CFFB2'];

/* ===========================
   Utility functions
   =========================== */
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function uid(){ let u = localStorage.getItem('uid'); if(!u){ u='u_'+Math.random().toString(36).slice(2,10); localStorage.setItem('uid',u);} return u; }
const USER_ID = uid();

/* wrap text with per-letter rainbow spans */
function colorizeTextPerLetter(el){
  if(!el) return;
  const text = (el.textContent || el.innerText || "").trim();
  let out = '';
  let idx = 0;
  for(const ch of text){
    if(ch === ' '){ out += ' '; continue; }
    const c = RAIN_COLORS[idx % RAIN_COLORS.length];
    out += `<span class="rainbow-letter" style="color:${c}">${escapeHtml(ch)}</span>`;
    idx++;
  }
  el.innerHTML = out;
}

/* colorize many UI elements */
function colorizeAllUI(){
  // title
  const title = $('appTitle');
  if(title) colorizeTextPerLetter(title);

  // buttons
  document.querySelectorAll('.btn').forEach(btn=>{
    // only colorize if not already spans
    colorizeTextPerLetter(btn);
  });

  // keys in stats
  document.querySelectorAll('.stats-box .label').forEach(l=>{
    // split key: value
    const text = (l.textContent || '').trim();
    const parts = text.split(':');
    if(parts.length > 1){
      const key = parts[0];
      const rest = parts.slice(1).join(':');
      l.innerHTML = `<span class="label-key">${escapeHtml(key)}</span>: ${escapeHtml(rest)}`;
      colorizeTextPerLetter(l.querySelector('.label-key'));
    } else {
      colorizeTextPerLetter(l);
    }
  });
}

/* quick notification */
function showNotification(msg){
  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 1400);
}

/* floating point bubble */
function showPointBubble(amount, rect){
  const b = document.createElement('div');
  b.className = 'point-bubble';
  b.style.left = (rect.left + rect.width/2) + 'px';
  b.style.top = (rect.top - 8) + 'px';
  b.textContent = `+${amount}`;
  document.body.appendChild(b);
  b.animate([{transform:'translateY(0)', opacity:1},{transform:'translateY(-70px)', opacity:0}], {duration:1200, easing: 'cubic-bezier(.2,.8,.2,1)'});
  setTimeout(()=>b.remove(), 1200);
}

/* small hash for color per username */
function hashCode(s){ let h=0; for(let i=0;i<s.length;i++) h = ((h<<5)-h)+s.charCodeAt(i)|0; return h; }

/* ===========================
   Local user & persistence
   =========================== */
let userData = JSON.parse(localStorage.getItem('user_'+USER_ID) || 'null');
if(!userData){
  userData = {
    points: 0,
    history: [],
    pendingWithdrawals: [],
    approvedWithdrawals: [],
    watchedYT: false,
    referralCode: 'REF' + Math.random().toString(36).slice(2,6).toUpperCase(),
    affiliateBalance: 0,
    referredBy: null
  };
  localStorage.setItem('user_'+USER_ID, JSON.stringify(userData));
}

function saveUser(){ localStorage.setItem('user_'+USER_ID, JSON.stringify(userData)); }

/* UI update */
function updateUI(){
  $('points').textContent = userData.points;
  $('phpValue').textContent = (userData.points * 0.0012).toFixed(4);
  $('myReferral').textContent = userData.referralCode;
  colorizeAllUI();
}

/* prompt referral code on first run */
if(!userData.referredBy){
  const code = prompt('Have a referral code? (optional)');
  if(code) { userData.referredBy = code.trim().toUpperCase(); saveUser(); }
}

/* ===========================
   Monetag + Fallback Ad Engine
   ===========================
   Flow per click:
     tryMonetag(mode)
       -> success: resolve(true)
       -> fail: fallbackToAdsterraSequence([link1, link2]) which opens link in new tab and grants reward after approx time
   We also force-finish ads after AUTO_CLOSE_MS (15s)
*/
function tryMonetag(mode, timeoutMs = CONFIG.AUTO_CLOSE_MS){
  // show_10276123 may be defined by SDK. It returns a promise.
  return new Promise(async (resolve) => {
    if(typeof window.show_10276123 === 'function'){
      try{
        let finished = false;
        const p = (mode === 'pop') ? show_10276123('pop') : show_10276123();
        // Race between p and timeout
        const timer = setTimeout(()=>{ if(!finished){ finished = true; resolve(false); } }, timeoutMs);
        // If returned promise resolves, treat as success
        Promise.resolve(p).then(res=>{
          if(!finished){
            finished = true; clearTimeout(timer); resolve(true);
          }
        }).catch(err=>{
          if(!finished){ finished = true; clearTimeout(timer); resolve(false); }
        });
      }catch(e){
        resolve(false);
      }
    } else {
      // Monetag SDK not loaded
      resolve(false);
    }
  });
}

/* Fallback to Adsterra smartlink - open in new tab and approximate completion */
function openAdsterraSmartlink(url, expectedMs = CONFIG.AUTO_CLOSE_MS){
  return new Promise((resolve)=>{
    try{
      // open in new tab / window
      const w = window.open(url, '_blank');
      // best-effort: reward after expectedMs and try to focus back
      const t = setTimeout(()=>{
        try{ if(w && !w.closed) w.close(); }catch(e){}
        resolve(true);
      }, expectedMs + 1000);
      // If the popup closed earlier, treat as success
      const poll = setInterval(()=>{
        try{
          if(!w || w.closed){ clearTimeout(t); clearInterval(poll); resolve(true); }
        }catch(e){}
      }, 800);
    }catch(e){
      resolve(false);
    }
  });
}

/* Robust ad play: tries Monetag, then fallback to Adsterra links in order */
async function playAdWithFallback(primaryMode, adsterraOrder = [CONFIG.ADSTERra1, CONFIG.ADSTERra2]){
  // 1) Try Monetag
  const monoOk = await tryMonetag(primaryMode, CONFIG.AUTO_CLOSE_MS);
  if(monoOk) return true;

  // 2) Try Adsterra links sequentially
  for(const link of adsterraOrder){
    const ok = await openAdsterraSmartlink(link, CONFIG.AUTO_CLOSE_MS);
    if(ok) return true;
  }

  // 3) final attempt: try Monetag again (short timeout)
  const monoRetry = await tryMonetag(primaryMode, 7000);
  return monoRetry;
}

/* ===========================
   Rewarding users
   =========================== */
function rewardUser(amount=CONFIG.AD_REWARD_POINTS, sourceButton=null){
  userData.points = (userData.points || 0) + amount;
  userData.history = userData.history || [];
  userData.history.push({ type:'reward', amount, source: sourceButton ? sourceButton.id : 'auto', time: Date.now() });
  saveUser();
  updateUI();

  // bubble
  if(sourceButton){
    const rect = sourceButton.getBoundingClientRect();
    showPointBubble(amount, rect);
  }

  // feed into special event
  event_receiveDamage(amount, userData.referralCode);
}

/* ===========================
   Hook up ad buttons
   =========================== */
const btn1 = $('adBtn1'), btn2 = $('adBtn2'), btn3 = $('adBtn3');

/* Auto-play sequence for btn1: rotate through (btn1 rewarded, btn2 popup, btn3 inApp)
   We run the sequence once per click on btn1; button disabled while running.
*/
async function autoplaySequence(){
  const sequence = [
    { mode: undefined, adsterraOrder: [CONFIG.ADSTERra1, CONFIG.ADSTERra2], btn: btn1 }, // Monetag rewarded
    { mode: 'pop', adsterraOrder: [CONFIG.ADSTERra2, CONFIG.ADSTERra1], btn: btn2 },     // Monetag popup
    { mode: { inApp: true }, adsterraOrder: [CONFIG.ADSTERra1, CONFIG.ADSTERra2], btn: btn3 } // Monetag inApp
  ];

  for(let step of sequence){
    // run step
    if(step.mode && typeof step.mode === 'object' && step.mode.inApp){
      // call Monetag inApp signature
      const monoOk = await tryMonetag({type:'inApp', inAppSettings:{
        frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false
      }}, CONFIG.AUTO_CLOSE_MS);
      if(monoOk){
        rewardUser(1, step.btn);
      } else {
        // fallback chain
        const ok = await playAdWithFallback(undefined, step.adsterraOrder);
        if(ok) rewardUser(1, step.btn);
      }
    } else {
      const primaryMode = (step.mode === 'pop') ? 'pop' : undefined;
      const ok = await playAdWithFallback(primaryMode, step.adsterraOrder);
      if(ok) rewardUser(1, step.btn);
    }
    // small pause between ads
    await new Promise(r=>setTimeout(r, 900));
  }
}

/* bind buttons */
btn1.addEventListener('click', async ()=>{
  btn1.disabled = true;
  try{ await autoplaySequence(); showNotification('Auto-play complete!'); }catch(e){ console.error(e); }
  btn1.disabled = false;
});

btn2.addEventListener('click', async ()=>{
  btn2.disabled = true;
  const ok = await playAdWithFallback('pop',[CONFIG.ADSTERra2, CONFIG.ADSTERra1]);
  if(ok) rewardUser(1, btn2);
  btn2.disabled = false;
});

btn3.addEventListener('click', async ()=>{
  btn3.disabled = true;
  const monoOk = await tryMonetag({type:'inApp', inAppSettings: {
    frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false
  }});
  if(monoOk) rewardUser(1, btn3);
  else {
    const ok = await playAdWithFallback(undefined, [CONFIG.ADSTERra1, CONFIG.ADSTERra2]);
    if(ok) rewardUser(1, btn3);
  }
  btn3.disabled = false;
});

/* ===========================
   YouTube IFrame & Withdrawal
   =========================== */
let ytPlayer = null;
let ytWatched = false;

function onYouTubeIframeAPIReady(){
  ytPlayer = new YT.Player('player', {
    height: '200',
    width: '100%',
    videoId: '',
    events: { 'onStateChange': (e)=>{ if(e.data === YT.PlayerState.ENDED){ ytWatched = true; userData.watchedYT = true; saveUser(); $('youtubeMsg').textContent = '✅ Video watched'; $('submitWithdraw').disabled = false; } } }
  });
}

/* withdraw UI binding */
$('withdrawBtn').addEventListener('click', ()=> {
  const panel = $('withdrawPanel');
  panel.classList.add('slide-down'); panel.classList.remove('hidden');
  const url = localStorage.getItem('ytLink') || '';
  if(url && ytPlayer){
    const id = (url.includes('v=')) ? url.split('v=')[1] : url;
    ytPlayer.loadVideoById(id);
  }
});
$('withdrawPanel').querySelectorAll('.closePanel').forEach(b => b.addEventListener('click', ()=>{ const p = $('withdrawPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));

$('submitWithdraw').addEventListener('click', ()=>{
  const code = $('withdrawCode').value.trim();
  const num = $('gcashNumber').value.trim();
  const savedCode = localStorage.getItem('withdrawCode') || '';
  if(!userData.watchedYT) return showNotification('Watch video first');
  if(!num) return showNotification('Enter GCash number');
  if(code !== savedCode) return showNotification('Wrong code');

  // push to pending of this user
  userData.pendingWithdrawals = userData.pendingWithdrawals || [];
  userData.pendingWithdrawals.push({ number: num, amount: (userData.points*0.0012).toFixed(4), points: userData.points, time: Date.now(), status: 'PENDING' });
  userData.points = 0; userData.watchedYT = false; ytWatched = false;
  saveUser(); updateUI(); showNotification('Withdrawal submitted (pending)');
  $('withdrawPanel').classList.remove('slide-down'); setTimeout(()=>$('withdrawPanel').classList.add('hidden'),240);
});

/* ===========================
   Owner dashboard logic
   =========================== */
$('ownerControlBtn').addEventListener('click', ()=>{
  const p = prompt('Owner password:');
  if(p === CONFIG.OWNER_PASSWORD){
    const panel = $('ownerPanel');
    panel.classList.add('slide-down'); panel.classList.remove('hidden');
    renderOwnerLists();
  } else showNotification('Incorrect password');
});
$('ownerPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p = $('ownerPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));

$('saveYTLink').addEventListener('click', ()=>{
  const v = $('setYTLink').value.trim();
  if(v){ localStorage.setItem('ytLink', v); showNotification('YouTube URL saved'); if(ytPlayer){ const id = v.includes('v=') ? v.split('v=')[1] : v; ytPlayer.loadVideoById(id); } }
});
$('saveWithdrawCode').addEventListener('click', ()=>{
  const c = $('setWithdrawCode').value.trim();
  if(c){ localStorage.setItem('withdrawCode', c); showNotification('Withdraw code saved'); }
});

/* Render owner lists by scanning localStorage user_* keys */
function renderOwnerLists(){
  const pendingDiv = $('pendingList'); const approvedDiv = $('approvedList');
  pendingDiv.innerHTML = ''; approvedDiv.innerHTML = '';
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(!k || !k.startsWith('user_')) continue;
    try{
      const ud = JSON.parse(localStorage.getItem(k));
      if(ud && ud.pendingWithdrawals && ud.pendingWithdrawals.length){
        ud.pendingWithdrawals.forEach((wd, idx)=>{
          const el = document.createElement('div'); el.style.padding='8px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
          el.innerHTML = `<div><b>${k}</b> → ₱${wd.amount}<br/><small>${new Date(wd.time).toLocaleString()}</small></div>`;
          const approve = document.createElement('button'); approve.className='btn btn-main'; approve.textContent='Approve';
          approve.onclick = ()=>{
            // move to approved
            ud.pendingWithdrawals.splice(idx,1); wd.status='APPROVED'; wd.approvedTime = Date.now();
            ud.approvedWithdrawals = ud.approvedWithdrawals||[]; ud.approvedWithdrawals.push(wd);
            localStorage.setItem(k, JSON.stringify(ud));
            renderOwnerLists(); showNotification('Approved!');
          };
          el.appendChild(approve); pendingDiv.appendChild(el);
        });
      }
      if(ud && ud.approvedWithdrawals && ud.approvedWithdrawals.length){
        ud.approvedWithdrawals.forEach(wd=>{
          const el = document.createElement('div'); el.style.padding='6px'; el.innerHTML = `<div><b>${k}</b> → ₱${wd.amount} <small>${wd.approvedTime ? new Date(wd.approvedTime).toLocaleString() : ''}</small></div>`;
          approvedDiv.appendChild(el);
        });
      }
    }catch(e){}
  }
}

/* ===========================
   History Panel
   =========================== */
$('historyBtn').addEventListener('click', ()=>{
  const panel = $('historyPanel'); panel.classList.add('slide-down'); panel.classList.remove('hidden'); renderHistory();
});
$('historyPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p = $('historyPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
function renderHistory(){
  const div = $('historyLog'); div.innerHTML = '';
  (userData.history || []).slice().reverse().forEach(h=>{
    const p = document.createElement('p');
    p.innerHTML = `${escapeHtml(h.type)} — ${escapeHtml(h.source || '')} <small>${new Date(h.time).toLocaleString()}</small>`;
    div.appendChild(p);
  });
}

/* ===========================
   Special Event (White Star Guardian)
   - stored globally in localStorage keys:
     event_guardian_hp, event_leaderboard (array), event_next_start, event_last_hits
   =========================== */
function getEventState(){
  return {
    hp: parseInt(localStorage.getItem('event_guardian_hp') || String(CONFIG.EVENT_GUARDIAN_HP), 10),
    board: JSON.parse(localStorage.getItem('event_leaderboard') || '[]'),
    nextStart: parseInt(localStorage.getItem('event_next_start') || '0', 10)
  };
}
function saveEventState(s){
  localStorage.setItem('event_guardian_hp', String(s.hp));
  localStorage.setItem('event_leaderboard', JSON.stringify(s.board));
  localStorage.setItem('event_next_start', String(s.nextStart));
}
function updateGuardianUI(){
  const s = getEventState();
  const pct = Math.max(0, Math.min(100, (s.hp/CONFIG.EVENT_GUARDIAN_HP)*100));
  $('guardianBar').style.width = pct + '%';
  $('guardianHP').textContent = s.hp + ' HP';
  const lb = $('eventLeaderboard'); lb.innerHTML = '';
  const sorted = (s.board || []).slice().sort((a,b)=>b.damage - a.damage);
  sorted.slice(0,50).forEach((u,i)=>{
    const el = document.createElement('div'); el.style.padding='6px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
    el.innerHTML = `<b>${i+1}. ${escapeHtml(u.id)}</b> — ${u.damage} dmg`;
    lb.appendChild(el);
  });
}
function event_receiveDamage(damage, userId){
  const s = getEventState();
  if(s.nextStart && Date.now() < s.nextStart) return; // idle state
  if(s.hp <= 0) return;
  s.hp -= damage; if(s.hp < 0) s.hp = 0;
  // record damage
  let entry = s.board.find(x=>x.id === userId);
  if(!entry){ entry = { id: userId, damage: 0 }; s.board.push(entry); }
  entry.damage += damage;
  // record last hits queue
  const last = JSON.parse(localStorage.getItem('event_last_hits') || '[]'); last.push({ id: userId, time: Date.now() }); localStorage.setItem('event_last_hits', JSON.stringify(last.slice(-50)));
  saveEventState(s);
  updateGuardianUI();
  if(s.hp === 0) finalizeGuardian();
}
function finalizeGuardian(){
  const s = getEventState();
  showNotification('🌟 Guardian defeated! Distributing rewards...');
  // determine last unique 3 winners
  const hits = JSON.parse(localStorage.getItem('event_last_hits') || '[]').reverse();
  const winners = [];
  for(const h of hits){
    if(!winners.includes(h.id)) winners.push(h.id);
    if(winners.length >= 3) break;
  }
  // reward winners: find stored users with matching referralCode
  winners.forEach(wid=>{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith('user_')){
        try{
          const ud = JSON.parse(localStorage.getItem(k));
          if(ud && ud.referralCode === wid){
            ud.points = (ud.points || 0) + CONFIG.EVENT_REWARD_POINTS;
            ud.history = ud.history || []; ud.history.push({ type:'event_win', msg:`+${CONFIG.EVENT_REWARD_POINTS} event reward`, time: Date.now() });
            localStorage.setItem(k, JSON.stringify(ud));
          }
        }catch(e){}
      }
    }
  });
  // reset event and set next start
  s.hp = CONFIG.EVENT_GUARDIAN_HP; s.board = []; s.nextStart = Date.now() + 2*60*60*1000;
  saveEventState(s);
  localStorage.setItem('event_last_hits', JSON.stringify([]));
  updateGuardianUI();
}

/* wire special event panel */
$('specialEventBtn').addEventListener('click', ()=>{ const panel = $('specialEventPanel'); panel.classList.add('slide-down'); panel.classList.remove('hidden'); updateGuardianUI(); });
$('specialEventPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p = $('specialEventPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));

/* update event timer every second */
setInterval(()=>{
  const s = getEventState();
  if(s.nextStart && s.nextStart > Date.now()){
    let diff = s.nextStart - Date.now();
    const h = Math.floor(diff / 3600000); diff %= 3600000;
    const m = Math.floor(diff / 60000); diff %= 60000;
    const sec = Math.floor(diff/1000);
    $('nextEventTimer').textContent = `Next Guardian: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  } else {
    $('nextEventTimer').textContent = 'Guardian active';
  }
}, 1000);

/* ===========================
   Global Chat (localStorage simulation)
   - message contents are colored per-letter (rainbow)
   =========================== */
const chatBtn = $('globalChatBtn'), chatPanel = $('globalChatPanel'), chatLog = $('chatLog'), chatInput = $('chatInput'), sendChatBtn = $('sendChat');

chatBtn.addEventListener('click', ()=>{ chatPanel.classList.add('slide-down'); chatPanel.classList.remove('hidden'); renderChat(); });
chatPanel.querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p = chatPanel; p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
sendChatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendChat(); });

function sendChat(){
  const txt = (chatInput.value || '').trim();
  if(!txt) return;
  const msgs = JSON.parse(localStorage.getItem('globalChat') || '[]');
  msgs.push({ user: userData.referralCode, msg: txt, time: Date.now() });
  localStorage.setItem('globalChat', JSON.stringify(msgs));
  chatInput.value = '';
  renderChat();
}

function renderChat(){
  const msgs = JSON.parse(localStorage.getItem('globalChat') || '[]');
  chatLog.innerHTML = '';
  msgs.slice(-200).forEach(m=>{
    const p = document.createElement('p');
    const color = RAIN_COLORS[Math.abs(hashCode(m.user)) % RAIN_COLORS.length];
    p.innerHTML = `<span class="msg-user" style="color:${color}">${escapeHtml(m.user)}:</span> ${colorizeMessageInline(m.msg)}`;
    chatLog.appendChild(p);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

/* colorize message inline per-letter */
function colorizeMessageInline(msg){
  let out = '';
  let idx = 0;
  for(const ch of msg){
    if(ch === ' '){ out += ' '; continue; }
    const c = RAIN_COLORS[idx % RAIN_COLORS.length];
    out += `<span style="color:${c}">${escapeHtml(ch)}</span>`;
    idx++;
  }
  return out;
}

/* ===========================
   Boot / initialization
   =========================== */
window.addEventListener('load', ()=>{
  // colorize UI (title, buttons)
  colorizeAllUI();
  updateUI();
  updateGuardianUI();
  renderChat();
  // small perf: prefetch adsterra links in background using <link rel=prefetch>
  prefetchURL(CONFIG.ADSTERra1);
  prefetchURL(CONFIG.ADSTERra2);
});

/* create prefetch tag to speed fallback */
function prefetchURL(u){
  try{
    const l = document.createElement('link'); l.rel='prefetch'; l.href = u; document.head.appendChild(l);
  }catch(e){}
}

/* persist before unload */
window.addEventListener('beforeunload', ()=>{ saveUser(); });

/* small responsive font tweak */
(function responsiveBtnFont(){
  const resize = ()=> {
    const w = window.innerWidth;
    document.querySelectorAll('.btn').forEach(b=>{
      if(w < 420) b.style.fontSize = '12px';
      else if(w < 720) b.style.fontSize = '13px';
      else b.style.fontSize = '14px';
    });
  };
  window.addEventListener('resize', resize);
  resize();
})();

