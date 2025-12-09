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

// =================== BUTTONS ===================
const buttons = [
    document.getElementById("btn1"),
    document.getElementById("btn2"),
    document.getElementById("btn3"),
    document.getElementById("btn4")
];

// =================== DAILY AD COUNTER ===================
const counterDisplay = document.getElementById("counterDisplay");

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

// =================== DUAL PRELOAD BUFFER ===================
let adBuffer = [null, null];
let bufferIndex = 0;
let preloadInProgress = [false, false];
let currentIndex = 0;

// AUTO CLOSE AD (FORCE FINISH AFTER 10 SECONDS)
async function autoCloseAd(adInstance, mode = "reward") {
    return new Promise(resolve => {

        const forcedFinish = setTimeout(() => {
            console.log("FORCED AUTO CLOSE after 10 seconds");

            try {
                if (adInstance && typeof adInstance.close === "function") {
                    adInstance.close();
                }
            } catch (e) {
                console.log("Auto-close fallback", e);
            }

            resolve();
        }, 10000);

        if (adInstance && typeof adInstance.onFinish === "function") {
            adInstance.onFinish(() => {
                clearTimeout(forcedFinish);
                try {
                    adInstance.close();
                } catch {}
                resolve();
            });
        }
    });
}

// PRELOAD AD SLOT
async function preloadSlot(slot = 0, mode = "reward") {
    if (preloadInProgress[slot]) return;

    preloadInProgress[slot] = true;

    try {
        adBuffer[slot] = show_10276123(mode)
            .then(adInstance => {
                console.log("Preloaded slot", slot);
                return adInstance;
            })
            .catch(() => { adBuffer[slot] = null; });
    } catch {
        adBuffer[slot] = null;
    }

    preloadInProgress[slot] = false;
}

// PRELOAD ON LOAD
window.addEventListener("load", () => {
    preloadSlot(0);
    preloadSlot(1);
});

// RELOAD ANY EMPTY BUFFER EVERY 20 SECONDS
setInterval(() => {
    adBuffer.forEach((item, i) => {
        if (!item) preloadSlot(i);
    });
}, 20000);

// PLAY AD (AUTO-FINISHES IN 10 SECONDS)
async function playAd(mode = "reward") {
    const slot = bufferIndex;
    bufferIndex = (bufferIndex + 1) % 2;

    let adInstance;

    if (adBuffer[slot]) {
        try {
            adInstance = await adBuffer[slot];
        } catch {}
        adBuffer[slot] = null;
        preloadSlot(slot, mode);
    }

    if (!adInstance) {
        try {
            adInstance = await (mode === "popup" ? show_10276123("pop") : show_10276123());
        } catch {}
        preloadSlot(slot, mode);
    }

    await autoCloseAd(adInstance, mode);
    incrementCounter();
}

// =================== AUTO LOOP ===================
function startAutoLoop() {
    function clickNext() {
        const btn = buttons[currentIndex];
        btn.disabled = true;
        btn.innerText = "Loading...";

        playAd("reward").then(() => {
            btn.innerText = btn.dataset.original;
            btn.disabled = false;

            currentIndex = (currentIndex + 1) % buttons.length;
            setTimeout(clickNext, 200);
        });
    }

    buttons.forEach(btn => btn.dataset.original = btn.innerText);
    clickNext();
}

window.addEventListener("load", startAutoLoop);
