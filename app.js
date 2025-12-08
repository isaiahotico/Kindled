// --- Adexium Init ---
document.addEventListener('DOMContentLoaded', () => {
    window.adexiumWidget = new AdexiumWidget({ wid: '0f0f814f-d491-4578-9343-531b503ff453', adFormat: 'interstitial' });
    adexiumWidget.autoMode();
});

// --- Cooldowns ---
let adixiumCooldown=180;
let monetagCooldown=120;
let adixiumReady=true;
let monetagReady=true;
const adixiumBtn=document.getElementById('adixiumBtn');
const monetagBtn=document.getElementById('monetagBtn');
const adixiumTimer=document.getElementById('adixiumTimer');
const monetagTimer=document.getElementById('monetagTimer');

function startAdixiumCooldown(){
    adixiumReady=false;
    adixiumBtn.disabled=true;
    const interval=setInterval(()=>{
        adixiumCooldown--;
        adixiumTimer.innerText=`Next Adexium ad in: ${adixiumCooldown}s`;
        if(adixiumCooldown<=0){
            clearInterval(interval);
            adixiumCooldown=180;
            adixiumTimer.innerText='';
            adixiumBtn.disabled=false;
            adixiumReady=true;
        }
    },1000);
}

function startMonetagCooldown(){
    monetagReady=false;
    monetagBtn.disabled=true;
    const interval=setInterval(()=>{
        monetagCooldown--;
        monetagTimer.innerText=`Next Monetag ad in: ${monetagCooldown}s`;
        if(monetagCooldown<=0){
            clearInterval(interval);
            monetagCooldown=120;
            monetagTimer.innerText='';
            monetagBtn.disabled=false;
            monetagReady=true;
        }
    },1000);
}

// --- Buttons ---
adixiumBtn.addEventListener('click',()=>{
    if(!adixiumReady) return;
    adexiumWidget.showAd();
    startAdixiumCooldown();
});

monetagBtn.addEventListener('click',()=>{
    if(!monetagReady) return;
    show_10276123().then(()=>{ alert('Monetag: Reward Added!'); });
    startMonetagCooldown();
});

const gigaBtn=document.getElementById('gigaBtn');
gigaBtn.addEventListener('click',()=>{
    window.showGiga().then(()=>{ alert('Giga Hub Reward!'); }).catch(e=>{ console.warn('Giga error',e); });
});

// --- Color Match Game ---
document.getElementById('colorBtn1').addEventListener('click',()=>reveal(1));
document.getElementById('colorBtn2').addEventListener('click',()=>reveal(2));
document.getElementById('colorBtn3').addEventListener('click',()=>reveal(3));
function reveal(num){ alert('You revealed value: '+num); }

// --- Watch Ad Button ---
document.getElementById('watchAdBtn').addEventListener('click',()=>{ alert('Rewarded ad triggered!'); });