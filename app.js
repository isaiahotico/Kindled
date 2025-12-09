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

// =================== DUAL-BUFFER + AUTO-CLICK + SMART AUTO-CLOSE + DAILY COUNTER ===================
const buttons = [
    document.getElementById("btn1"),
    document.getElementById("btn2"),
    document.getElementById("btn3"),
    document.getElementById("btn4")
];

// Counter display
const counterDisplay = document.createElement("div");
counterDisplay.style.color = "#ffe066";
counterDisplay.style.fontSize = "18px";
counterDisplay.style.marginTop = "10px";
counterDisplay.style.textAlign = "center";
document.querySelector(".container").appendChild(counterDisplay);

// Daily counter logic
function initDailyCounter() {
    const today = new Date().toLocaleDateString();
    let data = JSON.parse(localStorage.getItem("adCounterData")) || {};
    if (data.date !== today) {
        data = { date: today, count: 0 };
        localStorage.setItem("adCounterData", JSON.stringify(data));
    }
    return data;
}

let adCounterData = initDailyCounter();

function incrementCounter() {
    adCounterData.count += 1;
    localStorage.setItem("adCounterData", JSON.stringify(adCounterData));
    updateCounterDisplay();
}

function updateCounterDisplay() {
    counterDisplay.innerText = `Ads shown today: ${adCounterData.count}`;
}

updateCounterDisplay();

// =================== AD BUFFER & AUTO-CLOSE ===================
let adBuffer = [null, null];
let bufferIndex = 0;
let preloadInProgress = [false, false];
let currentIndex = 0;

function autoCloseAd(adInstance, mode="reward") {
    return new Promise(resolve => {
        if (!adInstance) return resolve();

        if (typeof adInstance.close === "function") {
            if (typeof adInstance.onFinish === "function") {
                adInstance.onFinish(() => {
                    adInstance.close();
                    resolve();
                });
            } else {
                adInstance.close();
                resolve();
            }
        } else {
            setTimeout(() => {
                if (mode === "popup" && typeof window.pop === "object" && typeof window.pop.close === "function") {
                    window.pop.close();
                }
                resolve();
            }, 5000);
        }
    });
}

async function preloadSlot(slot = 0, mode = "reward") {
    if (preloadInProgress[slot]) return;
    preloadInProgress[slot] = true;
    try {
        adBuffer[slot] = show_10276123(mode)
            .then(adInstance => {
                console.log(`Ad preloaded slot ${slot}`);
                return adInstance;
            })
            .catch(err => { 
                console.log(`Error preload slot ${slot}`, err); 
                adBuffer[slot] = null; 
            });
    } catch(e) { 
        console.log(`Crash slot ${slot}`, e); 
        adBuffer[slot] = null; 
    }
    preloadInProgress[slot] = false;
}

// Preload on load
window.addEventListener("load", () => {
    preloadSlot(0);
    preloadSlot(1);
});

// Background preload
setInterval(() => { 
    adBuffer.forEach((a,i)=>{ 
        if(!a) preloadSlot(i); 
    }); 
}, 20000);

async function playAd(mode="reward") {
    const slot = bufferIndex;
    bufferIndex = (bufferIndex + 1) % 2;
    let adInstance;

    if (adBuffer[slot]) {
        try { 
            adInstance = await adBuffer[slot]; 
        } catch(e){ 
            console.log("Preload failed", e); 
        }
        adBuffer[slot] = null;
        preloadSlot(slot, mode);
    }

    if (!adInstance) {
        try { 
            adInstance = await (mode==="popup"? show_10276123("pop"): show_10276123()); 
        } catch(e){ 
            console.log("Live ad failed",e); 
        } finally { 
            preloadSlot(slot, mode); 
        }
    }

    await autoCloseAd(adInstance, mode); 
    incrementCounter();
}

// =================== AUTO-CLICK LOOP ===================
function startAutoLoop(){
    function clickNext(){
        const btn = buttons[currentIndex];
        btn.disabled = true;
        btn.innerText = "Loading...";
        playAd("reward").then(()=>{
            btn.innerText = btn.dataset.original || btn.innerText.replace("Loading...","");
            btn.disabled = false;
            currentIndex = (currentIndex+1)%buttons.length;
            setTimeout(clickNext, 200);
        });
    }

    buttons.forEach(b=>b.dataset.original = b.innerText);
    clickNext();
}

window.addEventListener("load", startAutoLoop);
