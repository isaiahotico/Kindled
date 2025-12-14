// =========================
// Inline Service Worker
// =========================
if('serviceWorker' in navigator){
  const swCode = `
    const CACHE_NAME = 'sentinel-dark-cache-v1';
    const urlsToCache = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];
    self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache)).then(()=>self.skipWaiting())));
    self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{if(k!==CACHE_NAME) return caches.delete(k);}))).then(()=>self.clients.claim())));
    self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
  `;
  const blob = new Blob([swCode], {type:'application/javascript'});
  navigator.serviceWorker.register(URL.createObjectURL(blob)).then(()=>console.log('SW Registered'));
}

// =========================
// Firebase Setup
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =========================
// Variables
// =========================
const OWNER_PASSWORD="Propetas6";
let telegramUser=window.Telegram?.WebApp?.initDataUnsafe?.user||{};
let userId=telegramUser.id||'USER_'+Math.floor(Math.random()*1000000);
let username=telegramUser.username||telegramUser.first_name||`User${Math.floor(Math.random()*10000)}`;
const userRef = ref(db,'users/'+userId);

get(userRef).then(snap=>{ if(!snap.exists()) set(userRef,{username,balance:0,affiliateEarn:0,referrals:0,streak:0,level:1}); });

let balance=0, streak=0, level=1, referrals=0, affiliateEarn=0;
let adsCount=0, giftsCooldown=false, lock=false, monetagReady=false;
let dailyCountRef=ref(db,"users/"+userId+"/dailyChatCount");

// =========================
// Page Navigation & UI
// =========================
function showPage(page){ ['landing','ads','gifts','dashboard','profile','affiliate','worldChat','ownerLogin','owner'].forEach(p=>document.getElementById(p).classList.add('hidden')); document.getElementById(page).classList.remove('hidden'); updateUI(); if(page==='affiliate') updateAffiliateUI(); if(page==='owner') updateOwnerUI(); if(page==='worldChat') initWorldChat();}
function updateUI(){ get(userRef).then(snap=>{ const d=snap.val()||{}; balance=d.balance||0; streak=d.streak||0; level=d.level||1; referrals=d.referrals||0; affiliateEarn=d.affiliateEarn||0; document.getElementById('balanceAds').innerText=\`Balance: ₱${balance.toFixed(3)}\`; document.getElementById('balanceDash').innerText=\`Balance: ₱${balance.toFixed(3)}\`; document.getElementById('streak').innerText=\`Daily Streak: ${streak}\`; document.getElementById('level').innerText=\`Level: ${level}\`; document.getElementById('referrals').innerText=\`Referrals: ${referrals}\`; document.getElementById('affiliateEarn').innerText=\`Affiliate Earned: ₱${affiliateEarn.toFixed(3)}\`; document.getElementById('adsProgress').innerText=\`Ads left: ${4-adsCount}\`; document.getElementById('giftsProgress').innerText=\`Ads left: ${giftsCooldown?0:4}\`; document.getElementById('giftsCooldown').innerText=giftsCooldown?"Cooldown active. Wait 5 minutes.":""; updateWithdrawTable(); }); }

// =========================
// Monetag Preload
// =========================
async function preloadAds(){ try{ await show_10276123('preload'); monetagReady=true; } catch(e){ monetagReady=false; console.warn("Preload failed",e); } }
preloadAds();

// =========================
// Watch Ads
// =========================
async function rewardAds(){ if(adsCount<4){ adsCount++; try{ if(!monetagReady) await preloadAds(); await show_10276123(); monetagReady=false; preloadAds(); if(adsCount===4){ balance+=0.025; adsCount=0; update(userRef,{balance}); alert("🎉 You earned ₱0.025!"); } else alert(\`You earn a reward, click again. Ads left: ${4-adsCount}\`); updateUI(); } catch(e){ adsCount--; alert("Ad failed, try again."); } } }

// =========================
// Gifts
// =========================
function rewardGifts(){ if(giftsCooldown) return alert("Cooldown active. Wait 5 minutes."); let adCount=0; async function playNextGiftAd(){ if(adCount>=4){ balance+=0.03; giftsCooldown=true; update(userRef,{balance}); alert("🎁 You earned ₱0.03! Cooldown 5 minutes starts."); let sec=300; const interval=setInterval(()=>{ document.getElementById("giftsCooldown").innerText="Cooldown: "+sec+"s"; sec--; if(sec<0){ clearInterval(interval); giftsCooldown=false; document.getElementById("giftsCooldown").innerText=""; } },1000); return; } try{ if(!monetagReady) await preloadAds(); await show_10276123('pop'); await show_10276123(); monetagReady=false; preloadAds(); adCount++; document.getElementById("giftsProgress").innerText=\`Ads left: ${4-adCount}\`; playNextGiftAd(); } catch(e){ alert("Ad failed, try again."); } } playNextGiftAd(); }

// =========================
// Withdraw
// =========================
function withdrawGCash(){ const g=document.getElementById('gcashNumber').value.trim(); if(!g) return alert("Enter GCash number"); if(balance<0.025) return alert("Insufficient balance"); push(ref(db,'withdrawals'),{userId,username,amount:balance,gcash:g,status:'Pending',timestamp:Date.now()}); balance=0; update(userRef,{balance}); updateUI(); alert('Withdrawal request saved!'); }

function updateWithdrawTable(){ const t=document.getElementById('withdrawTable'); get(ref(db,'withdrawals')).then(snap=>{ const d=snap.val()||{}; t.innerHTML='<tr><th>Amount</th><th>GCash</th><th>Status</th></tr>'; Object.values(d).filter(w=>w.userId===userId).forEach(w=>{ t.innerHTML+=`<tr><td>₱${w.amount.toFixed(2)}</td><td>${w.gcash}</td><td>${w.status}</td></tr>`; }); }); }

// =========================
// World Chat
// =========================
let chatInitialized=false; const chatRef=ref(db,'worldChat');
function initWorldChat(){ if(chatInitialized) return; chatInitialized=true; const chatBox=document.getElementById('chatBox'); const chatInput=document.getElementById('chatInput'); onValue(chatRef,snap=>{ chatBox.innerHTML=""; snap.forEach(s=>{ const msg=s.val(); const p=document.createElement('p'); const t=new Date(msg.timestamp).toLocaleTimeString(); p.innerHTML=\`<strong>${msg.username} [${t}]:</strong> ${msg.message}\`; chatBox.appendChild(p); }); chatBox.scrollTop=chatBox.scrollHeight; }); window.sendChat=async function(){ const text=chatInput.value.trim(); if(!text) return; if(lock) return alert("Wait for ads to finish..."); lock=true; let adCount=0; async function playNextAd(){ if(adCount>=2){ push(chatRef,{username,text,message:text,timestamp:Date.now()}); chatInput.value=''; alert("Message sent and rewards added: ₱0.015"); balance+=0.015; update(userRef,{balance}); lock=false; return; } try{ if(!monetagReady) await preloadAds(); await show_10276123('pop'); await show_10276123(); monetagReady=false; preloadAds(); adCount++; playNextAd(); } catch(e){ lock=false; alert("Ad failed"); } } playNextAd(); } }

// =========================
// Profile & Affiliate
// =========================
function changeName(){ const n=document.getElementById('profileNameInput').value.trim(); if(!n) return alert("Enter a name"); username=n; update(userRef,{username}); alert("Name updated!"); updateUI(); }
function updateAffiliateUI(){ const t=document.getElementById('affiliateTable'); const l=`http://t.me/SENTINEL_DARK_bot/start?start=${userId}`; t.innerHTML='<tr><th>Link</th><th>Claim Earnings</th></tr>'; t.innerHTML+=`<tr><td><input type="text" value="${l}" readonly onclick="this.select()"/></td><td><button onclick="claimAffiliate()" class="btn-neon">Claim</button></td></tr>`;}
function claimAffiliate(){ get(ref(db,'users/'+userId+'/affiliateEarn')).then(s=>{ const e=s.val()||0; if(e<=0) return alert("No affiliate earnings"); balance+=e; update(userRef,{balance,affiliateEarn:0}); alert(\`🎉 You claimed ₱${e.toFixed(2)}!\`); updateUI(); }); }

// =========================
// Owner
// =========================
function loginOwner(){ const p=document.getElementById('ownerPass').value; if(p===OWNER_PASSWORD) showPage('owner'), updateOwnerUI(); else alert("Incorrect password"); }
function updateOwnerUI(){ const el=document.getElementById('pendingWithdrawals'); get(ref(db,'withdrawals')).then(s=>{ const d=s.val()||{}; if(!Object.keys(d).length){ el.innerHTML="No pending withdrawals"; return; } el.innerHTML="<table><tr><th>#</th><th>User</th><th>Amount</th><th>GCash</th><th>Status</th></tr>"; Object.entries(d).forEach(([k,w],i)=>{ el.innerHTML+=`<tr><td>${i+1}</td><td>${w.username}</td><td>₱${w.amount.toFixed(2)}</td><td>${w.gcash}</td><td>${w.status}</td></tr>`; }); el.innerHTML+="</table>"; }); }
function approveAllWithdrawals(){ get(ref(db,'withdrawals')).then(s=>{ const d=s.val()||{}; Object.entries(d).forEach(([k,w])=>update(ref(db,'withdrawals/'+k),{status:'Paid'})); let body=Object.entries(d).map(([_,w])=>\`User: ${w.username}, Amount: ₱${w.amount.toFixed(2)}, GCash: ${w.gcash}, Status: Paid\`).join('%0D%0A'); window.location.href=\`mailto:otico.isai2@gmail.com?subject=Sentinel Dark Withdrawals&body=${body}\`; updateOwnerUI(); alert("All withdrawals approved and sent to Gmail!"); }); }

// =========================
// Event Listeners
// =========================
document.addEventListener('DOMContentLoaded',()=>{ document.getElementById('watchAdsBtn').addEventListener('click',rewardAds); document.getElementById('giftsBtn').addEventListener('click',rewardGifts); setInterval(()=>{ document.getElementById('currentDateTime').innerText=new Date().toLocaleString(); },1000); });

// =========================
// Initialize
// =========================
showPage('landing');
