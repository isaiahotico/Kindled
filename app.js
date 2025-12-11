/* app.js — merged full application (rainbow-per-letter UI) */

/* -------------------------
   Helpers: rainbow coloring
   -------------------------*/
const RAIN_COLORS = ['#FF69B4','#FFFF66','#8A2BE2','#00FFFF','#FFFFFF','#FFB86B','#7CFFB2'];

function colorizeTextPerLetter(el){
  // el: DOM element containing plain text -> replace with spans for each letter
  if(!el) return;
  const text = el.textContent || '';
  const out = [];
  let colorIndex = 0;
  for(let i=0;i<text.length;i++){
    const ch = text[i];
    // keep spaces
    if(ch === ' '){ out.push(' '); continue; }
    const color = RAIN_COLORS[colorIndex % RAIN_COLORS.length];
    out.push(`<span class="rainbow-letter" style="color:${color}">${escapeHtml(ch)}</span>`);
    colorIndex++;
  }
  el.innerHTML = out.join('');
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* colorize existing labels/buttons by wrapping their text after DOM load */
function colorizeAllUI(){
  // title
  const title = document.getElementById('appTitle');
  if(title) colorizeTextPerLetter(title);

  // buttons: wrap innerText
  document.querySelectorAll('.btn').forEach(btn=>{
    colorizeTextPerLetter(btn);
  });

  // labels inside stats-box
  document.querySelectorAll('.stats-box .label').forEach(l=>{
    // only color the label text (left side)
    const parts = l.innerHTML.split(':');
    if(parts.length>1){
      l.innerHTML = `<span class="label-key">${escapeHtml(parts[0])}:</span> ${escapeHtml(parts.slice(1).join(':'))}`;
      // colorize the key
      colorizeTextPerLetter(l.querySelector('.label-key'));
    } else {
      colorizeTextPerLetter(l);
    }
  });
}

/* -------------------------
   Floating stars background
   -------------------------*/
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; initStars(); });

let stars = [];
function initStars(){
  stars = [];
  for(let i=0;i<140;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*1.6 + 0.6,
      dx: (Math.random()-0.5)*0.4,
      dy: (Math.random()-0.5)*0.4,
      c: RAIN_COLORS[Math.floor(Math.random()*RAIN_COLORS.length)]
    });
  }
}
function drawStars(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(5,5,6,0.55)';
  ctx.fillRect(0,0,W,H);
  for(let s of stars){
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle = s.c;
    ctx.fill();
    s.x += s.dx; s.y += s.dy;
    if(s.x < 0) s.x = W;
    if(s.x > W) s.x = 0;
    if(s.y < 0) s.y = H;
    if(s.y > H) s.y = 0;
  }
  requestAnimationFrame(drawStars);
}
initStars();
requestAnimationFrame(drawStars);

/* -------------------------
   Basic app state & storage
   -------------------------*/
function uid(){ let u = localStorage.getItem('uid'); if(!u){ u='u_'+Math.random().toString(36).slice(2,10); localStorage.setItem('uid',u);} return u; }
const USER_ID = uid();
let userData = JSON.parse(localStorage.getItem('user_'+USER_ID) || '{}');
if(!userData || !userData.referralCode){
  userData = {
    points: 0,
    history: [],
    pendingWithdrawals: [],
    approvedWithdrawals: [],
    watchedYT: false,
    referralCode: 'REF'+Math.random().toString(36).slice(2,6).toUpperCase(),
    affiliateBalance: 0,
    referredBy: null
  };
  localStorage.setItem('user_'+USER_ID, JSON.stringify(userData));
}

function saveUser(){ localStorage.setItem('user_'+USER_ID, JSON.stringify(userData)); }

/* -------------------------
   UI wiring & update
   -------------------------*/
function updateUI(){
  document.getElementById('points').textContent = userData.points;
  document.getElementById('phpValue').textContent = (userData.points * 0.0012).toFixed(4);
  document.getElementById('myReferral').textContent = userData.referralCode;
  // colorize dynamic elements (numbers not necessary, but keep rainbow style for keys)
  colorizeAllUI();
}

/* small helper: show floating notification */
function showNotification(msg){
  const d = document.createElement('div');
  d.className = 'notification';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1400);
}

/* floating point bubble */
function showPointBubble(amount, elRect){
  const b = document.createElement('div');
  b.className = 'point-bubble';
  b.style.left = (elRect.left + elRect.width/2) + 'px';
  b.style.top = (elRect.top - 8) + 'px';
  b.textContent = `+${amount}`;
  document.body.appendChild(b);
  b.animate([
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(-70px)', opacity: 0 }
  ], { duration: 1200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  setTimeout(()=>b.remove(),1200);
}

/* -------------------------
   Referral prompt (first-run)
   -------------------------*/
if(!userData.referredBy){
  const code = prompt('If you have a referral code, paste it now (optional):');
  if(code){ userData.referredBy = code.trim().toUpperCase(); saveUser(); }
}

/* -------------------------
   Reward flow & affiliate
   -------------------------*/
function rewardPoint(sourceBtn){
  userData.points += 1;
  userData.history.push({ type:'ad', source:sourceBtn ? sourceBtn.id : 'auto', time: Date.now(), amount:1 });
  saveUser();
  updateUI();
  if(sourceBtn){
    const rect = sourceBtn.getBoundingClientRect();
    showPointBubble(1, rect);
  }
  // contribute to special event (global) when a point is earned
  event_receiveDamage(1, USER_ID);
  showNotification('+1 point');
}

/* Claim affiliate */
document.getElementById('claimAffiliateBtn').addEventListener('click',()=>{
  const a = parseFloat(localStorage.getItem('affiliatePoints_'+USER_ID) || 0);
  if(a > 0){
    userData.points += a;
    localStorage.setItem('affiliatePoints_'+USER_ID, '0');
    saveUser(); updateUI(); showNotification('Affiliate claimed!');
  } else {
    showNotification('No affiliate rewards');
  }
});

/* -------------------------
   Ads integration (3 buttons)
   - adBtn1 triggers autoplay sequence across 3 ad types
   - adBtn2 / adBtn3 manual
   -------------------------*/
const btnAd1 = document.getElementById('adBtn1');
const btnAd2 = document.getElementById('adBtn2');
const btnAd3 = document.getElementById('adBtn3');

async function playMonetag(zone='10276123', mode){ // wrapper using show_10276123
  // Mode: undefined (rewarded), 'pop' (popup)
  try{
    if(mode==='pop') await show_10276123('pop');
    else await show_10276123();
    return true;
  }catch(e){
    console.warn('Ad play error', e);
    return false;
  }
}

async function adSequence(startIndex=0){
  const funcs = [
    async ()=>{ const ok = await playMonetag(); if(ok) rewardPoint(btnAd1); },
    async ()=>{ const ok = await playMonetag(); if(ok) rewardPoint(btnAd2); },
    async ()=>{ const ok = await playMonetag('10276123','pop'); if(ok) rewardPoint(btnAd3); }
  ];
  for(let i=startIndex;i<funcs.length;i++){
    await funcs[i]();
    await new Promise(r=>setTimeout(r,1200));
  }
}

btnAd1.addEventListener('click', ()=>{ btnAd1.disabled=true; adSequence(0).finally(()=>btnAd1.disabled=false); });
btnAd2.addEventListener('click', ()=>{ btnAd2.disabled=true; playMonetag().then(ok=>{ if(ok) rewardPoint(btnAd2); }).finally(()=>btnAd2.disabled=false);});
btnAd3.addEventListener('click', ()=>{ btnAd3.disabled=true; playMonetag('10276123','pop').then(ok=>{ if(ok) rewardPoint(btnAd3); }).finally(()=>btnAd3.disabled=false);});

/* -------------------------
   YouTube player & withdrawal
   -------------------------*/
let ytPlayer; let ytWatched=false;
function onYouTubeIframeAPIReady(){
  ytPlayer = new YT.Player('player', {
    height: '200', width: '100%', videoId: '', events: { 'onStateChange': onYTState }
  });
}
function onYTState(event){
  if(event.data === YT.PlayerState.ENDED){
    ytWatched = true;
    userData.watchedYT = true;
    saveUser();
    document.getElementById('youtubeMsg').textContent = '✅ Video watched — You can withdraw';
    document.getElementById('submitWithdraw').disabled = false;
  }
}

/* Withdraw panel open/close */
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawPanel = document.getElementById('withdrawPanel');
withdrawBtn.addEventListener('click', ()=>{
  withdrawPanel.classList.add('slide-down'); withdrawPanel.classList.remove('hidden');
  const url = localStorage.getItem('ytLink') || '';
  if(url && ytPlayer){
    const id = url.split('v=')[1] || url;
    ytPlayer.loadVideoById(id);
  }
});
withdrawPanel.querySelector('.closePanel').addEventListener('click', ()=>{ withdrawPanel.classList.remove('slide-down'); setTimeout(()=>withdrawPanel.classList.add('hidden'),240); });

document.getElementById('submitWithdraw').addEventListener('click', ()=>{
  const code = document.getElementById('withdrawCode').value.trim();
  const gnum = document.getElementById('gcashNumber').value.trim();
  const setCode = localStorage.getItem('withdrawCode') || '';
  if(!ytWatched) return showNotification('Watch the video first');
  if(!gnum) return showNotification('Enter GCash number');
  if(code !== setCode) return showNotification('Wrong withdrawal code');

  // submit pending
  userData.pendingWithdrawals.push({number:gnum, amount:(userData.points*0.0012).toFixed(4), points:userData.points, time:Date.now(), status:'PENDING'});
  userData.points = 0; userData.watchedYT = false; ytWatched=false;
  saveUser(); updateUI();
  showNotification('Withdrawal requested (pending)');
  withdrawPanel.classList.remove('slide-down'); setTimeout(()=>withdrawPanel.classList.add('hidden'),240);
});

/* -------------------------
   Owner dashboard
   -------------------------*/
const ownerBtn = document.getElementById('ownerControlBtn');
const ownerPanel = document.getElementById('ownerPanel');

ownerBtn.addEventListener('click', ()=>{
  const p = prompt('Owner password:');
  if(p === 'Propetas6'){
    ownerPanel.classList.add('slide-down'); ownerPanel.classList.remove('hidden');
    renderOwnerLists();
  } else showNotification('Wrong password');
});
ownerPanel.querySelector('.closePanel').addEventListener('click', ()=>{ ownerPanel.classList.remove('slide-down'); setTimeout(()=>ownerPanel.classList.add('hidden'),240); });

document.getElementById('saveYTLink').addEventListener('click', ()=>{
  const v = document.getElementById('setYTLink').value.trim();
  if(v){ localStorage.setItem('ytLink', v); if(ytPlayer){ const id = v.split('v=')[1] || v; ytPlayer.loadVideoById(id); } showNotification('YouTube URL saved'); }
});
document.getElementById('saveWithdrawCode').addEventListener('click', ()=>{
  const c = document.getElementById('setWithdrawCode').value.trim();
  if(c){ localStorage.setItem('withdrawCode', c); showNotification('Withdraw code saved'); }
});

/* render owner pending/approved lists (localStorage: use all users keys) */
function renderOwnerLists(){
  const pendingDiv = document.getElementById('pendingList');
  const approvedDiv = document.getElementById('approvedList');
  pendingDiv.innerHTML = ''; approvedDiv.innerHTML = '';
  // find all user_* keys
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && k.startsWith('user_')){
      const ud = JSON.parse(localStorage.getItem(k));
      if(ud && ud.pendingWithdrawals && ud.pendingWithdrawals.length){
        ud.pendingWithdrawals.forEach((wd, idx)=>{
          const el = document.createElement('div');
          el.style.padding='6px';
          el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
          el.innerHTML = `<div><b>${k}</b> → ₱${wd.amount} <br/><small>${new Date(wd.time).toLocaleString()}</small></div>`;
          const approveBtn = document.createElement('button'); approveBtn.className='btn btn-main'; approveBtn.textContent='Approve';
          approveBtn.onclick = ()=>{ ud.pendingWithdrawals.splice(idx,1); wd.status='APPROVED'; wd.approvedTime=Date.now(); ud.approvedWithdrawals = ud.approvedWithdrawals || []; ud.approvedWithdrawals.push(wd); localStorage.setItem(k, JSON.stringify(ud)); renderOwnerLists(); showNotification('Approved'); };
          el.appendChild(approveBtn);
          pendingDiv.appendChild(el);
        });
      }
      if(ud && ud.approvedWithdrawals && ud.approvedWithdrawals.length){
        ud.approvedWithdrawals.forEach(wd=>{
          const el = document.createElement('div');
          el.style.padding='6px';
          el.innerHTML = `<div><b>${k}</b> → ₱${wd.amount} <small>${wd.approvedTime ? new Date(wd.approvedTime).toLocaleString() : ''}</small></div>`;
          approvedDiv.appendChild(el);
        });
      }
    }
  }
}

/* -------------------------
   History panel
   -------------------------*/
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
historyBtn.addEventListener('click', ()=>{ historyPanel.classList.add('slide-down'); historyPanel.classList.remove('hidden'); renderHistory(); });
historyPanel.querySelector('.closePanel').addEventListener('click', ()=>{ historyPanel.classList.remove('slide-down'); setTimeout(()=>historyPanel.classList.add('hidden'),240); });

function renderHistory(){
  const div = document.getElementById('historyLog');
  div.innerHTML = '';
  (userData.history || []).slice().reverse().forEach(h=>{
    const p = document.createElement('p');
    p.innerHTML = `${h.type} — ${h.source || ''} <small>${new Date(h.time).toLocaleString()}</small>`;
    div.appendChild(p);
  });
}

/* -------------------------
   SPECIAL EVENT: White Star Guardian
   stored globally in localStorage under keys:
     event_guardian_hp, event_leaderboard (array), event_next_start
   -------------------------*/
const specialBtn = document.getElementById('specialEventBtn');
const specialPanel = document.getElementById('specialEventPanel');
const gBar = document.getElementById('guardianBar');
const gHPText = document.getElementById('guardianHP');
const leaderboardDiv = document.getElementById('eventLeaderboard');
const nextTimer = document.getElementById('nextEventTimer');

function getEventState(){
  return {
    hp: parseInt(localStorage.getItem('event_guardian_hp') || '50000', 10),
    board: JSON.parse(localStorage.getItem('event_leaderboard') || '[]'),
    nextStart: parseInt(localStorage.getItem('event_next_start') || '0', 10)
  };
}
function saveEventState(state){
  localStorage.setItem('event_guardian_hp', String(state.hp));
  localStorage.setItem('event_leaderboard', JSON.stringify(state.board));
  localStorage.setItem('event_next_start', String(state.nextStart));
}
function updateGuardianUI(){
  const s = getEventState();
  const pct = Math.max(0, Math.min(100, (s.hp / 50000) * 100));
  gBar.style.width = pct + '%';
  gHPText.textContent = `${s.hp} HP`;
  // leaderboard
  leaderboardDiv.innerHTML = '';
  const sorted = (s.board || []).slice().sort((a,b)=>b.damage - a.damage);
  sorted.slice(0,30).forEach((u, idx)=>{
    const el = document.createElement('div');
    el.style.padding='6px';
    el.style.borderBottom='1px solid rgba(255,255,255,0.03)';
    el.innerHTML = `<b>${idx+1}. ${u.id}</b> — ${u.damage} dmg`;
    leaderboardDiv.appendChild(el);
  });
}

/* when points are earned we should damage guardian */
function event_receiveDamage(damage, userId){
  const st = getEventState();
  if(st.nextStart && Date.now() < st.nextStart) return; // event waiting
  if(st.hp <= 0) return;
  st.hp -= damage;
  if(st.hp < 0) st.hp = 0;
  // record user damage
  let entry = st.board.find(x=>x.id === userId);
  if(!entry){ entry = { id: userId, damage: 0 }; st.board.push(entry); }
  entry.damage += damage;
  // keep last hitters queue for final reward
  localStorage.setItem('event_last_hits', JSON.stringify((JSON.parse(localStorage.getItem('event_last_hits')||'[]')).concat({id:userId, time:Date.now()}).slice(-10)));
  saveEventState(st);
  updateGuardianUI();
  if(st.hp === 0) {
    // finish
    finalizeGuardian();
  }
}

function finalizeGuardian(){
  const st = getEventState();
  showNotification('🌟 Guardian defeated! distributing rewards...');
  // determine last 3 unique users who hit the last HP (scan event_last_hits)
  const lastHits = JSON.parse(localStorage.getItem('event_last_hits') || '[]').reverse();
  const winners = [];
  for(const h of lastHits){
    if(!winners.includes(h.id)) winners.push(h.id);
    if(winners.length >= 3) break;
  }
  // reward winners 2500 points (if local user matches, add to their account)
  winners.forEach(wid=>{
    // find local user data if present in storage
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith('user_')){
        const ud = JSON.parse(localStorage.getItem(k));
        if(ud && ud.referralCode === wid){
          ud.points = (ud.points || 0) + 2500;
          ud.history = ud.history || [];
          ud.history.push({type:'event_reward', msg:`+2500 for defeating guardian`, time:Date.now()});
          localStorage.setItem(k, JSON.stringify(ud));
        }
      }
    }
  });
  // reset guardian and set next start in 2 hours
  st.hp = 50000;
  st.board = [];
  st.nextStart = Date.now() + 2 * 60 * 60 * 1000;
  saveEventState(st);
  localStorage.setItem('event_last_hits', JSON.stringify([]));
  updateGuardianUI();
}

/* special event UI wiring */
specialBtn.addEventListener('click', ()=>{ specialPanel.classList.add('slide-down'); specialPanel.classList.remove('hidden'); updateGuardianUI(); });
specialPanel.querySelector('.closePanel').addEventListener('click', ()=>{ specialPanel.classList.remove('slide-down'); setTimeout(()=>specialPanel.classList.add('hidden'),240); });

/* timer for next spawn */
setInterval(()=>{
  const st = getEventState();
  if(st.nextStart && st.nextStart > Date.now()){
    let diff = st.nextStart - Date.now();
    const h = Math.floor(diff / 3600000); diff %= 3600000;
    const m = Math.floor(diff / 60000); diff %= 60000;
    const s = Math.floor(diff / 1000);
    document.getElementById('nextEventTimer').textContent = `Next Guardian: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else {
    document.getElementById('nextEventTimer').textContent = 'Guardian active';
  }
}, 1000);

/* -------------------------
   Global Chat (localStorage simulation)
   -------------------------*/
const chatBtn = document.getElementById('globalChatBtn');
const chatPanel = document.getElementById('globalChatPanel');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');

chatBtn.addEventListener('click', ()=>{ chatPanel.classList.add('slide-down'); chatPanel.classList.remove('hidden'); renderChat(); });

chatPanel.querySelectorAll('.closePanel').forEach(b => b.addEventListener('click', ()=>{ b.closest('.panel').classList.remove('slide-down'); setTimeout(()=>b.closest('.panel').classList.add('hidden'),240); }));

function renderChat(){
  const msgs = JSON.parse(localStorage.getItem('globalChat') || '[]');
  chatLog.innerHTML = '';
  msgs.slice(-200).forEach(m=>{
    const p = document.createElement('p');
    // assign color per user id (hash)
    const u = m.user || 'anon';
    const color = RAIN_COLORS[Math.abs(hashCode(u)) % RAIN_COLORS.length];
    p.innerHTML = `<span class="msg-user" style="color:${color}">${escapeHtml(u)}:</span> ${colorizeMessageInline(m.msg)}`;
    chatLog.appendChild(p);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function colorizeMessageInline(msg){
  // return HTML where each letter is rainbow-colored sequentially
  let res = '';
  let idx=0;
  for(let ch of msg){
    if(ch === ' '){ res += ' '; continue;}
    const color = RAIN_COLORS[idx % RAIN_COLORS.length];
    res += `<span style="color:${color}">${escapeHtml(ch)}</span>`;
    idx++;
  }
  return res;
}

function hashCode(str){
  let h=0;
  for(let i=0;i<str.length;i++) h = ((h<<5)-h)+str.charCodeAt(i)|0;
  return h;
}
sendChatBtn.addEventListener('click', ()=>{
  const txt = chatInput.value.trim();
  if(!txt) return;
  const msgs = JSON.parse(localStorage.getItem('globalChat') || '[]');
  msgs.push({ user: userData.referralCode, msg: txt, time: Date.now() });
  localStorage.setItem('globalChat', JSON.stringify(msgs));
  chatInput.value = '';
  renderChat();
});

/* ENTER key sending */
chatInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendChatBtn.click(); });

/* -------------------------
   colorize UI on load and update loop
   -------------------------*/
window.addEventListener('load', ()=>{ colorizeAllUI(); updateUI(); updateGuardianUI(); renderChat(); });

/* Re-color buttons and title whenever DOM changes (simplified) */
const observer = new MutationObserver(()=>{ colorizeAllUI(); });
observer.observe(document.getElementById('app'), { subtree:true, childList:true, characterData:true });

/* Utility: when user leaves page, persist userData */
window.addEventListener('beforeunload', ()=>{ saveUser(); });

/* ensure UI responsive sizing: small tweak */
(function responsiveButtons(){
  const resize = ()=> {
    const w = window.innerWidth;
    const btns = document.querySelectorAll('.btn');
    btns.forEach(b=>{
      if(w < 420) b.style.fontSize = '12px';
      else if(w < 720) b.style.fontSize = '13px';
      else b.style.fontSize = '14px';
    });
  };
  window.addEventListener('resize', resize);
  resize();
})();
