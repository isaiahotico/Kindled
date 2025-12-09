// =================== PWA INSTALL ===================
let deferredPrompt;
const installBtn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "block";
});
installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});

// =================== DUAL-BUFFER PRELOAD + AUTO-CLICK ===================
const buttons = [
    document.getElementById("btn1"),
    document.getElementById("btn2"),
    document.getElementById("btn3"),
    document.getElementById("btn4")
];

let adBuffer = [null, null];
let bufferIndex = 0;
let preloadInProgress = [false, false];
let currentIndex = 0;

// Preload a slot
async function preloadSlot(slot = 0, mode = "reward") {
    if (preloadInProgress[slot]) return;
    preloadInProgress[slot] = true;
    try {
        adBuffer[slot] = show_10276123(mode)
            .then(() => { console.log(`Ad preloaded slot ${slot}`); return "ready"; })
            .catch(err => { console.log(`Error preload slot ${slot}`, err); adBuffer[slot]=null; });
    } catch(e) { console.log(`Crash slot ${slot}`, e); adBuffer[slot]=null; }
    preloadInProgress[slot] = false;
}

// Preload both slots on load (instant-fire)
window.addEventListener("load", () => {
    preloadSlot(0);
    preloadSlot(1);
});

// Background preload
setInterval(() => { adBuffer.forEach((a,i)=>{ if(!a) preloadSlot(i); }); }, 20000);

// Play ad from buffer
async function playAd(mode="reward") {
    const slot = bufferIndex;
    bufferIndex = (bufferIndex + 1) % 2;

    if (adBuffer[slot]) {
        try { await adBuffer[slot]; } catch(e){ console.log("Preload failed", e); }
        adBuffer[slot] = null;
        preloadSlot(slot, mode);
        return;
    }

    try { await (mode==="popup"? show_10276123("pop"): show_10276123()); } 
    catch(e){ console.log("Live ad failed",e); }
    finally{ preloadSlot(slot, mode); }
}

// =================== AUTO CLICK SEQUENCE ===================
function startAutoLoop(){
    function clickNext(){
        const btn = buttons[currentIndex];
        btn.disabled = true;
        btn.innerText = "Loading...";
        playAd("reward").then(()=>{
            btn.innerText = btn.dataset.original || btn.innerText.replace("Loading...","");
            btn.disabled = false;
            currentIndex = (currentIndex+1)%buttons.length;
            setTimeout(clickNext, 1000); // small delay before next click
        });
    }

    // initialize button text data
    buttons.forEach(b=>b.dataset.original = b.innerText);
    clickNext();
}

// Start auto-click on load
window.addEventListener("load", startAutoLoop);
