/* app.js - balanced merged implementation */
const CONFIG = {
  ADSTER1: "https://www.effectivegatecpm.com/ai7csj41?key=7e287f34b34183342aa072ceeccb42cf",
  ADSTER2: "https://www.effectivegatecpm.com/hebhpc3tcm?key=e18e0c3b11bce2e7a0d722f6ac554232",
  MONETAG_ZONE: "10276123",
  AUTO_CLOSE_MS: 15000,
  POINT_VALUE: 0.0012,
  EVENT_HP: 50000,
  EVENT_REWARD: 2500,
  OWNER_PWD: "Propetas6",
  WITHDRAW_CODE_DEFAULT: "TKGAH"
};

/* small helpers */
const $ = id => document.getElementById(id);
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function uid(){ let u = localStorage.getItem('uid'); if(!u){ u='u_'+Math.random().toString(36).slice(2,10); localStorage.setItem('uid',u); } return u; }
const USER = uid();
const RAIN = ['#FF69B4','#FFFF66','#8A2BE2','#00FFFF','#FFFFFF','#FFB86B','#7CFFB2'];

function colorizePerLetter(el){
  if(!el) return;
  const txt = (el.textContent||el.innerText||'').trim();
  let out=''; let i=0;
  for(const ch of txt){
    if(ch===' '){ out+=' '; continue; }
    const c = RAIN[i % RAIN.length];
    out += `<span class="rainbow-letter" style="color:${c}">${escapeHtml(ch)}</span>`;
    i++;
  }
  el.innerHTML = out;
}

/* stars background */
const canvas = $('starsCanvas'); const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; initStars(); });
let stars = [];
function initStars(){ stars = []; for(let i=0;i<140;i++){ stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+0.6,dx:(Math.random()-0.5)*0.4,dy:(Math.random()-0.5)*0.4,c:RAIN[Math.floor(Math.random()*RAIN.length)]}); } }
function drawStars(){ ctx.clearRect(0,0,W,H); ctx.fillStyle='rgba(5,5,6,0.5)'; ctx.fillRect(0,0,W,H); for(const s of stars){ ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle = s.c; ctx.fill(); s.x+=s.dx; s.y+=s.dy; if(s.x<0) s.x=W; if(s.x>W) s.x=0; if(s.y<0) s.y=H; if(s.y>H) s.y=0; } requestAnimationFrame(drawStars); }
initStars(); requestAnimationFrame(drawStars);

/* user data */
let userData = JSON.parse(localStorage.getItem('user_'+USER) || 'null');
if(!userData){
  userData = { points:0, history:[], pendingWithdrawals:[], approvedWithdrawals:[], watchedYT:false, referralCode:'REF'+Math.random().toString(36).slice(2,6).toUpperCase(), affiliate:0, referredBy:null };
  localStorage.setItem('user_'+USER, JSON.stringify(userData));
}
function saveUser(){ localStorage.setItem('user_'+USER, JSON.stringify(userData)); }

/* UI */
function updateUI(){
  $('points').textContent = userData.points;
  $('phpValue').textContent = '₱'+(userData.points * CONFIG.POINT_VALUE).toFixed(4);
  $('myReferral').textContent = userData.referralCode;
  // colorize keys
  colorizePerLetter($('appTitle'));
  document.querySelectorAll('.btn').forEach(b=>colorizePerLetter(b));
  document.querySelectorAll('.meta-key').forEach(k=>colorizePerLetter(k));
}

/* small notifications & bubbles */
function notify(msg){
  const n = document.createElement('div'); n.className = 'notification'; n.textContent = msg; document.body.appendChild(n);
  setTimeout(()=>n.remove(),1400);
}
function bubble(amount, rect){
  const b = document.createElement('div'); b.className = 'point-bubble'; b.style.left = (rect.left + rect.width/2) + 'px'; b.style.top = (rect.top - 8) + 'px'; b.textContent = '+'+amount; document.body.appendChild(b);
  b.animate([{transform:'translateY(0)', opacity:1},{transform:'translateY(-70px)', opacity:0}], {duration:1200});
  setTimeout(()=>b.remove(),1200);
}

/* reward */
function rewardUser(amount, btn){
  userData.points = (userData.points||0) + amount;
  userData.history = userData.history || [];
  userData.history.push({type:'reward',amount,time:Date.now()});
  saveUser(); updateUI();
  if(btn) bubble(amount, btn.getBoundingClientRect());
  // damage guardian
  event_receiveDamage(amount, userData.referralCode);
}

/* Monetag + fallback */
function tryMonetag(mode, timeout = CONFIG.AUTO_CLOSE_MS){
  return new Promise(async resolve=>{
    if(typeof window.show_10276123 === 'function'){
      try{
        let finished=false;
        const p = (mode==='pop')? show_10276123('pop') : (typeof mode === 'object' ? show_10276123(mode) : show_10276123());
        const timer = setTimeout(()=>{ if(!finished){ finished=true; resolve(false); } }, timeout);
        Promise.resolve(p).then(()=>{ if(!finished){ finished=true; clearTimeout(timer); resolve(true); } }).catch(()=>{ if(!finished){ finished=true; clearTimeout(timer); resolve(false); } });
      }catch(e){ resolve(false); }
    } else resolve(false);
  });
}
function openAdsterra(url, expected = CONFIG.AUTO_CLOSE_MS){
  return new Promise(resolve=>{
    try{
      const w = window.open(url, '_blank');
      const t = setTimeout(()=>{ try{ if(w && !w.closed) w.close(); }catch(e){} resolve(true); }, expected + 800);
      const poll = setInterval(()=>{ try{ if(!w || w.closed){ clearTimeout(t); clearInterval(poll); resolve(true); } }catch(e){} }, 700);
    }catch(e){ resolve(false); }
  });
}
async function playWithFallback(primaryMode, adsterOrder=[CONFIG.ADSTER1, CONFIG.ADSTER2]){
  const monoOk = await tryMonetag(primaryMode, CONFIG.AUTO_CLOSE_MS);
  if(monoOk) return true;
  for(const link of adsterOrder){
    const ok = await openAdsterra(link, CONFIG.AUTO_CLOSE_MS);
    if(ok) return true;
  }
  const retry = await tryMonetag(primaryMode, 7000);
  return retry;
}

/* ad button wiring */
const adBtn1 = $('adBtn1'), adBtn2 = $('adBtn2'), adBtn3 = $('adBtn3');
async function autoplaySeq(){
  const seq = [
    { mode: undefined, btn: adBtn1, order: [CONFIG.ADSTER1, CONFIG.ADSTER2] },
    { mode: 'pop', btn: adBtn2, order: [CONFIG.ADSTER2, CONFIG.ADSTER1] },
    { mode: { type:'inApp', inAppSettings:{ frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false } }, btn: adBtn3, order: [CONFIG.ADSTER1, CONFIG.ADSTER2] }
  ];
  for(const step of seq){
    step.btn.disabled = true;
    let ok = false;
    if(step.mode && typeof step.mode === 'object' && step.mode.type === 'inApp'){
      ok = await tryMonetag(step.mode, CONFIG.AUTO_CLOSE_MS);
      if(ok) rewardUser(1, step.btn);
      else { const fb = await playWithFallback(undefined, step.order); if(fb) rewardUser(1, step.btn); }
    } else {
      const res = await playWithFallback(step.mode, step.order);
      if(res) rewardUser(1, step.btn);
    }
    step.btn.disabled = false;
    await new Promise(r=>setTimeout(r, 900));
  }
  notify('Auto-play complete');
}
adBtn1.addEventListener('click', ()=>{ adBtn1.disabled = true; autoplaySeq().finally(()=>adBtn1.disabled = false); });
adBtn2.addEventListener('click', async ()=>{ adBtn2.disabled = true; const ok = await playWithFallback('pop',[CONFIG.ADSTER2, CONFIG.ADSTER1]); if(ok) rewardUser(1,adBtn2); adBtn2.disabled = false; });
adBtn3.addEventListener('click', async ()=>{ adBtn3.disabled = true; const ok = await tryMonetag({ type:'inApp', inAppSettings:{ frequency:2,capping:0.1, interval:30, timeout:5, everyPage:false } }, CONFIG.AUTO_CLOSE_MS); if(ok) rewardUser(1,adBtn3); else { const fb = await playWithFallback(undefined,[CONFIG.ADSTER1, CONFIG.ADSTER2]); if(fb) rewardUser(1,adBtn3); } adBtn3.disabled = false; });

/* YouTube & withdraw */
let ytPlayer = null;
function onYouTubeIframeAPIReady(){ ytPlayer = new YT.Player('player',{height:'200',width:'100%',videoId:'',events:{'onStateChange': onYTState}}); }
function onYTState(e){ if(e.data === YT.PlayerState.ENDED){ userData.watchedYT = true; saveUser(); $('youtubeMsg').textContent = '✅ Video watched'; $('submitWithdraw').disabled = false; } }

$('withdrawBtn').addEventListener('click', ()=>{ const p=$('withdrawPanel'); p.classList.add('slide-down'); p.classList.remove('hidden'); const url = localStorage.getItem('ytLink') || ''; if(url && ytPlayer){ const id = url.includes('v=')? url.split('v=')[1] : url; ytPlayer.loadVideoById(id); } });
$('withdrawPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p=$('withdrawPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
$('submitWithdraw').addEventListener('click', ()=>{ const code = $('withdrawCode').value.trim(); const number = $('gcashNumber').value.trim(); const setCode = localStorage.getItem('withdrawCode') || CONFIG.WITHDRAW_CODE_DEFAULT; if(!userData.watchedYT) return notify('Watch video first'); if(!number) return notify('Enter GCash number'); if(code !== setCode) return notify('Wrong code'); userData.pendingWithdrawals = userData.pendingWithdrawals || []; userData.pendingWithdrawals.push({number, amount: (userData.points*CONFIG.POINT_VALUE).toFixed(4), points:userData.points, time:Date.now(), status:'PENDING'}); userData.points = 0; userData.watchedYT=false; saveUser(); updateUI(); notify('Withdrawal requested (pending)'); $('withdrawPanel').classList.remove('slide-down'); setTimeout(()=>$('withdrawPanel').classList.add('hidden'),240); });

/* Owner panel */
$('ownerControlBtn').addEventListener('click', ()=>{ const p = prompt('Owner password:'); if(p === CONFIG.OWNER_PWD){ const panel = $('ownerPanel'); panel.classList.add('slide-down'); panel.classList.remove('hidden'); panel.classList.add('owner-open'); renderOwnerLists(); } else notify('Wrong password'); });
$('ownerPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p=$('ownerPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
$('saveYTLink').addEventListener('click', ()=>{ const v=$('setYTLink').value.trim(); if(v){ localStorage.setItem('ytLink', v); notify('YouTube URL saved'); if(ytPlayer){ const id = v.includes('v=')? v.split('v=')[1] : v; ytPlayer.loadVideoById(id); } }});
$('saveWithdrawCode').addEventListener('click', ()=>{ const c = $('setWithdrawCode').value.trim(); if(c){ localStorage.setItem('withdrawCode', c); notify('Withdraw code saved'); }});

function renderOwnerLists(){ const pending=$('pendingList'), approved=$('approvedList'); pending.innerHTML=''; approved.innerHTML=''; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k||!k.startsWith('user_')) continue; try{ const ud = JSON.parse(localStorage.getItem(k)); if(ud.pendingWithdrawals && ud.pendingWithdrawals.length){ ud.pendingWithdrawals.forEach((wd, idx)=>{ const el=document.createElement('div'); el.style.padding='8px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)'; el.innerHTML=`<div><b>${k}</b> → ₱${wd.amount}<br/><small>${new Date(wd.time).toLocaleString()}</small></div>`; const approve=document.createElement('button'); approve.className='btn btn-main'; approve.textContent='Approve'; approve.onclick=()=>{ ud.pendingWithdrawals.splice(idx,1); wd.status='APPROVED'; wd.approvedTime=Date.now(); ud.approvedWithdrawals = ud.approvedWithdrawals||[]; ud.approvedWithdrawals.push(wd); localStorage.setItem(k, JSON.stringify(ud)); renderOwnerLists(); notify('Approved'); }; el.appendChild(approve); pending.appendChild(el); }); } if(ud.approvedWithdrawals && ud.approvedWithdrawals.length){ ud.approvedWithdrawals.forEach(wd=>{ const el=document.createElement('div'); el.style.padding='6px'; el.innerHTML=`<div><b>${k}</b> → ₱${wd.amount} <small>${wd.approvedTime?new Date(wd.approvedTime).toLocaleString():''}</small></div>`; approved.appendChild(el); }); } }catch(e){} } }

/* History */
$('historyBtn').addEventListener('click', ()=>{ const p=$('historyPanel'); p.classList.add('slide-down'); p.classList.remove('hidden'); renderHistory(); });
$('historyPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p=$('historyPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
function renderHistory(){ const div = $('historyLog'); div.innerHTML=''; (userData.history||[]).slice().reverse().forEach(h=>{ const p=document.createElement('p'); p.innerHTML = `${escapeHtml(h.type)} — ${escapeHtml(h.source||'')} <small>${new Date(h.time).toLocaleString()}</small>`; div.appendChild(p); }); }

/* Special Event helpers */
function getEvent(){ return { hp: parseInt(localStorage.getItem('event_hp')||String(CONFIG.EVENT_HP),10), board: JSON.parse(localStorage.getItem('event_board')||'[]'), nextStart: parseInt(localStorage.getItem('event_next')||'0',10) }; }
function saveEvent(s){ localStorage.setItem('event_hp', String(s.hp)); localStorage.setItem('event_board', JSON.stringify(s.board)); localStorage.setItem('event_next', String(s.nextStart)); }
function updateGuardianUI(){ const s=getEvent(); const pct = Math.max(0,Math.min(100,(s.hp/CONFIG.EVENT_HP)*100)); $('guardianBar').style.width = pct+'%'; $('guardianHP').textContent = s.hp + ' HP'; const lb=$('eventLeaderboard'); lb.innerHTML=''; const sorted=(s.board||[]).slice().sort((a,b)=>b.damage-a.damage); sorted.slice(0,50).forEach((u,i)=>{ const el=document.createElement('div'); el.style.padding='6px'; el.style.borderBottom='1px solid rgba(255,255,255,0.03)'; el.innerHTML=`<b>${i+1}. ${escapeHtml(u.id)}</b> — ${u.damage} dmg`; lb.appendChild(el); }); }
function event_receiveDamage(damage, uid){ const s=getEvent(); if(s.nextStart && Date.now() < s.nextStart) return; if(s.hp <= 0) return; s.hp -= damage; if(s.hp < 0) s.hp = 0; let entry = s.board.find(x=>x.id === uid); if(!entry){ entry = { id: uid, damage:0 }; s.board.push(entry); } entry.damage += damage; const last = JSON.parse(localStorage.getItem('event_last')||'[]'); last.push({ id: uid, time: Date.now() }); localStorage.setItem('event_last', JSON.stringify(last.slice(-100))); saveEvent(s); updateGuardianUI(); if(s.hp === 0) finalizeGuardian(); }
function finalizeGuardian(){ const s=getEvent(); notify('Guardian defeated — distributing rewards'); const hits = JSON.parse(localStorage.getItem('event_last')||'[]').reverse(); const winners = []; for(const h of hits){ if(!winners.includes(h.id)) winners.push(h.id); if(winners.length >= 3) break; } winners.forEach(wid=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith('user_')){ try{ const ud = JSON.parse(localStorage.getItem(k)); if(ud && ud.referralCode === wid){ ud.points = (ud.points||0) + CONFIG.EVENT_REWARD; ud.history = ud.history||[]; ud.history.push({ type:'event_reward', msg: '+'+CONFIG.EVENT_REWARD, time: Date.now() }); localStorage.setItem(k, JSON.stringify(ud)); } }catch(e){} } } }); s.hp = CONFIG.EVENT_HP; s.board = []; s.nextStart = Date.now() + 2*60*60*1000; saveEvent(s); localStorage.setItem('event_last', JSON.stringify([])); updateGuardianUI(); }

/* Global chat */
$('globalChatBtn').addEventListener('click', ()=>{ const p=$('globalChatPanel'); p.classList.add('slide-down'); p.classList.remove('hidden'); renderChat(); });
$('globalChatPanel').querySelectorAll('.closePanel').forEach(b=>b.addEventListener('click', ()=>{ const p=$('globalChatPanel'); p.classList.remove('slide-down'); setTimeout(()=>p.classList.add('hidden'),240); }));
$('sendChat').addEventListener('click', ()=>{ const t=$('chatInput').value.trim(); if(!t) return; const msgs = JSON.parse(localStorage.getItem('globalChat')||'[]'); msgs.push({ user: userData.referralCode, msg: t, time: Date.now() }); localStorage.setItem('globalChat', JSON.stringify(msgs)); $('chatInput').value=''; renderChat(); });
function renderChat(){ const msgs = JSON.parse(localStorage.getItem('globalChat')||'[]'); const log = $('chatLog'); log.innerHTML=''; msgs.slice(-200).forEach(m=>{ const p=document.createElement('p'); const color = RAIN[Math.abs(hashCode(m.user)) % RAIN.length]; p.innerHTML = `<span class="msg-user" style="color:${color}">${escapeHtml(m.user)}:</span> ${colorizeInline(m.msg)}`; log.appendChild(p); }); log.scrollTop = log.scrollHeight; }
function colorizeInline(msg){ let out=''; let i=0; for(const ch of msg){ if(ch===' '){ out += ' '; continue; } const c = RAIN[i % RAIN.length]; out += `<span style="color:${c}">${escapeHtml(ch)}</span>`; i++; } return out; }
function hashCode(s){ let h=0; for(let i=0;i<s.length;i++) h = ((h<<5)-h)+s.charCodeAt(i)|0; return h; }

/* Affiliate claim */
$('claimAffiliateBtn').addEventListener('click', ()=>{ const key = 'affiliate_'+USER; const v = parseFloat(localStorage.getItem(key) || '0'); if(v>0){ userData.points += v; localStorage.setItem(key, '0'); saveUser(); updateUI(); notify('Affiliate claimed'); } else notify('No affiliate rewards'); });

/* small startup */
window.addEventListener('load', ()=>{ colorizePerLetter($('appTitle')); document.querySelectorAll('.btn').forEach(b=>colorizePerLetter(b)); updateUI(); updateGuardianUI(); renderChat(); prefetchFallbacks(); });
function prefetchFallbacks(){ try{ const l1=document.createElement('link'); l1.rel='prefetch'; l1.href=CONFIG.ADSTER1; document.head.appendChild(l1); const l2=document.createElement('link'); l2.rel='prefetch'; l2.href=CONFIG.ADSTER2; document.head.appendChild(l2); }catch(e){} }
window.addEventListener('beforeunload', ()=>{ saveUser(); });
(function responsiveButtons(){ const resize = ()=>{ const w=window.innerWidth; document.querySelectorAll('.btn').forEach(b=>{ if(w<420) b.style.fontSize='12px'; else if(w<720) b.style.fontSize='13px'; else b.style.fontSize='14px'; }); }; window.addEventListener('resize', resize); resize(); })();
