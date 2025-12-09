const autoShowToggle = document.getElementById('autoShowToggle');
const progress = document.querySelector('.progress');
const countdownEl = document.querySelector('.countdown');
const successSound = document.getElementById('successSound');
const container = document.querySelector('.container');
const adsCountEl = document.getElementById('adsCount');

// Ads list
const ads = [
    {name: "Native Banner", fn: () => show_10276123()},
    {name: "Rewarded Interstitial", fn: () => show_10276123()},
    {name: "Rewarded Popup", fn: () => show_10276123('pop')},
    {name: "In-App Interstitial", fn: () => show_10276123({
        type: 'inApp',
        inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false }
    })}
];

// --- Ads counter with daily reset ---
const todayKey = 'adsCounterDate';
const countKey = 'adsCounterValue';

function loadAdsCounter() {
    const savedDate = localStorage.getItem(todayKey);
    const today = new Date().toDateString();
    if (savedDate !== today) {
        localStorage.setItem(todayKey, today);
        localStorage.setItem(countKey, '0');
    }
    adsCountEl.textContent = localStorage.getItem(countKey) || '0';
}

function incrementAdsCounter() {
    let count = parseInt(localStorage.getItem(countKey) || '0', 10);
    count++;
    localStorage.setItem(countKey, count.toString());
    adsCountEl.textContent = count;
}

// --- Sleep utility ---
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- Countdown timer ---
async function showCountdown(seconds) {
    for (let i = seconds; i > 0; i--) {
        countdownEl.textContent = `Ad ends in: ${i}s`;
        await sleep(1000);
    }
    countdownEl.textContent = '';
}

// --- Full-screen fade transitions ---
async function fadeOutScreen() {
    container.classList.add('fade-out-screen');
    await sleep(800);
}

async function fadeInScreen() {
    container.classList.remove('fade-out-screen');
    await sleep(800);
}

// --- Play single ad with retry ---
async function playAd(ad) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
        try {
            await fadeOutScreen();
            progress.textContent = `Showing ${ad.name}...`;
            await fadeInScreen();

            await showCountdown(5); // Countdown timer
            await ad.fn(); // Show ad

            successSound.play();
            progress.textContent = `${ad.name} completed! 🎉`;
            incrementAdsCounter();

            await sleep(800); // short animation pause
            success = true;
        } catch(e) {
            console.error(`${ad.name} failed, retrying...`, e);
            attempts++;
            await sleep(1000);
        }
    }
}

// --- Auto-run ads loop ---
async function runAdsLoop() {
    while (autoShowToggle.checked) {
        for (let ad of ads) {
            if (!autoShowToggle.checked) break;
            await playAd(ad);
            await sleep(500); // small delay
        }
    }
}

// --- Initialize ---
loadAdsCounter();
if (autoShowToggle.checked) runAdsLoop();

autoShowToggle.addEventListener('change', () => {
    if (autoShowToggle.checked) runAdsLoop();
});
