
// app.js

const AD_REWARD_PER_SEQUENCE = 0.007; // Peso per full 8-ad sequence
const ADS_PER_SEQUENCE = 8;
const AD_DISPLAY_SIMULATION_TIME_MS = 3000; // Simulated time for non-rewarded ads to "finish"
const MONETAG_ZONE_1 = '10337795';
const MONETAG_ZONE_2 = '10337853';
const MONETAG_ZONE_3 = '10276123'; // Updated with the correct zone ID for Room 3

let currentPeso = parseFloat(localStorage.getItem('pesoBalance')) || 0.000;
let adsLeftInSequence = 0;
let currentAdZone = ''; // To track which Monetag zone is active
let currentCountdownInterval = null; // To manage the popup timer

// Get DOM elements
const pesoBalanceSpan = document.getElementById('pesoBalance');
const homePage = document.getElementById('homePage');
const adWatchingPage = document.getElementById('adWatchingPage');
const adsStatusDiv = document.getElementById('adsStatus');
const adsLeftCounterPopup = document.getElementById('adsLeftCounter');
const currentAdsLeftSpan = document.getElementById('currentAdsLeft');
const countdownTimerSpan = document.getElementById('countdownTimer');
const returnHomeButton = document.getElementById('returnHomeBtn');
const watchAdsRoom1Button = document.getElementById('watchAdsRoom1');
const watchAdsRoom2Button = document.getElementById('watchAdsRoom2');
const watchAdsRoom3Button = document.getElementById('watchAdsRoom3'); // New button element for Room 3

const currentDateTimeSpan = document.getElementById('currentDateTime'); // Footer date/time span

// --- UI Functions ---
function updateCoinDisplay() {
    pesoBalanceSpan.textContent = currentPeso.toFixed(3); // Display with 3 decimal places
    localStorage.setItem('pesoBalance', currentPeso.toFixed(3)); // Store for persistence
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showAdsLeftPopup(count, total) {
    if (currentCountdownInterval) clearInterval(currentCountdownInterval); // Clear any existing timer
    currentAdsLeftSpan.textContent = `${count}/${total}`;
    adsLeftCounterPopup.style.display = 'block';

    let timer = AD_DISPLAY_SIMULATION_TIME_MS / 1000;
    countdownTimerSpan.textContent = `(${timer}s)`;

    currentCountdownInterval = setInterval(() => {
        timer--;
        if (timer >= 0) {
            countdownTimerSpan.textContent = `(${timer}s)`;
        } else {
            clearInterval(currentCountdownInterval);
            currentCountdownInterval = null;
        }
    }, 1000);
}

function hideAdsLeftPopup() {
    if (currentCountdownInterval) {
        clearInterval(currentCountdownInterval);
        currentCountdownInterval = null;
    }
    adsLeftCounterPopup.style.display = 'none';
}

function setAdsStatusText(text) {
    adsStatusDiv.querySelector('p').textContent = text;
}

// Function to update current date and time in the footer
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true 
    };
    currentDateTimeSpan.textContent = now.toLocaleDateString('en-US', options);
}


// --- Monetag SDK Helper ---
// Ensures the Monetag SDK for a given zone is loaded and its show function is available.
function ensureMonetagSDKLoaded(zoneId) {
    return new Promise(resolve => {
        if (window[`show_${zoneId}`]) {
            resolve();
            return;
        }
        // Fallback for dynamic script loading if for some reason it's not ready
        const script = document.createElement('script');
        script.src = '//libtl.com/sdk.js';
        script.setAttribute('data-zone', zoneId);
        script.setAttribute('data-sdk', `show_${zoneId}`);
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.error(`Failed to load Monetag SDK for zone ${zoneId}`);
            resolve(); // Resolve anyway to not block the app
        };
        document.head.appendChild(script);
    });
}

// --- Monetag Ad Call Wrappers ---
async function callMonetagRewardedInterstitial(zoneId) {
    await ensureMonetagSDKLoaded(zoneId);
    setAdsStatusText(`Displaying Exclusive Reward Ad (Stream ${ADS_PER_SEQUENCE - adsLeftInSequence + 1} of ${ADS_PER_SEQUENCE})`);
    try {
        await window[`show_${zoneId}`]();
        console.log(`Rewarded interstitial from zone ${zoneId} watched!`);
        return true;
    } catch (e) {
        console.error(`Error showing rewarded interstitial from zone ${zoneId}:`, e);
        return false;
    }
}

async function callMonetagRewardedPopup(zoneId) {
    await ensureMonetagSDKLoaded(zoneId);
    setAdsStatusText(`Presenting Premium Reward Popup (Stream ${ADS_PER_SEQUENCE - adsLeftInSequence + 1} of ${ADS_PER_SEQUENCE})`);
    try {
        await window[`show_${zoneId}`]('pop');
        console.log(`Rewarded popup from zone ${zoneId} watched!`);
        return true;
    } catch (e) {
        console.error(`Error showing rewarded popup from zone ${zoneId}:`, e);
        return false;
    }
}

async function callMonetagInAppInterstitial(zoneId) {
    await ensureMonetagSDKLoaded(zoneId);
    setAdsStatusText(`Showcasing Global Interstitial (Stream ${ADS_PER_SEQUENCE - adsLeftInSequence + 1} of ${ADS_PER_SEQUENCE})`);
    
    window[`show_${zoneId}`]({
        type: 'inApp',
        inAppSettings: {
            frequency: 1, // Attempt to show one ad per call for sequential
            capping: 0.1, // Reset capping every 6 minutes
            interval: 10,
            timeout: 2,
            everyPage: false
        }
    });
    console.log(`In-App Interstitial call for zone ${zoneId} initiated. Simulating display...`);
    return new Promise(resolve => setTimeout(() => resolve(true), AD_DISPLAY_SIMULATION_TIME_MS));
}

async function callMonetagOpenInterstitial(zoneId) {
    await ensureMonetagSDKLoaded(zoneId);
    setAdsStatusText(`Delivering Global Ad Experience (Stream ${ADS_PER_SEQUENCE - adsLeftInSequence + 1} of ${ADS_PER_SEQUENCE})`);
    
    // As 'Open Interstitial' is not a distinct method from rewarded in Monetag's docs,
    // we'll use the generic show_ZONE_ID() and simulate its display time.
    window[`show_${zoneId}`](); 
    console.log(`Open Interstitial call for zone ${zoneId} initiated. Simulating display...`);
    return new Promise(resolve => setTimeout(() => resolve(true), AD_DISPLAY_SIMULATION_TIME_MS));
}


// --- Main Ad Sequence Logic ---
async function watchAdsSequence(zoneId) {
    showPage('adWatchingPage');
    currentAdZone = zoneId;
    adsLeftInSequence = ADS_PER_SEQUENCE;
    let successfulAdViews = 0;

    setAdsStatusText('Initiating Ad Stream: Please standby for premium content.');

    // Define the sequence of ad calls
    const adSequence = [
        async () => callMonetagRewardedInterstitial(zoneId),
        async () => callMonetagRewardedPopup(zoneId),
        async () => callMonetagRewardedInterstitial(zoneId),
        async () => callMonetagInAppInterstitial(zoneId),
        async () => callMonetagInAppInterstitial(zoneId),
        async () => callMonetagInAppInterstitial(zoneId),
        async () => callMonetagOpenInterstitial(zoneId),
        async () => callMonetagOpenInterstitial(zoneId)
    ];

    for (let i = 0; i < adSequence.length; i++) {
        showAdsLeftPopup(ADS_PER_SEQUENCE - i, ADS_PER_SEQUENCE);
        
        console.log(`Attempting ad ${i + 1} of ${ADS_PER_SEQUENCE}`);
        
        const adFunction = adSequence[i];
        let adResult = await adFunction(); 
        
        if (adResult) {
            successfulAdViews++;
        } else {
            console.warn(`Ad ${i + 1} did not resolve successfully or was skipped. Sequence continues.`);
        }
        
        if (i < adSequence.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second break between ads
        }
    }
    
    hideAdsLeftPopup();

    if (successfulAdViews === ADS_PER_SEQUENCE) {
        currentPeso += AD_REWARD_PER_SEQUENCE;
        updateCoinDisplay();
        setAdsStatusText(`✨ Mission Accomplished! You've successfully earned ${AD_REWARD_PER_SEQUENCE.toFixed(3)} PHP for completing your Elite Ad Stream!`);
    } else {
        setAdsStatusText(`Ad stream concluded. For full rewards, ensure all engagements are completed. No earnings for incomplete streams.`);
        console.warn(`Only ${successfulAdViews} out of ${ADS_PER_SEQUENCE} ads were successfully processed.`);
    }

    setTimeout(() => {
        showPage('homePage');
        setAdsStatusText('Ready for your next earnings opportunity.'); // Reset status for next time
    }, 5000); // Wait 5 seconds before returning home
}


// --- Event Listeners ---
watchAdsRoom1Button.addEventListener('click', () => {
    watchAdsSequence(MONETAG_ZONE_1);
});

watchAdsRoom2Button.addEventListener('click', () => {
    watchAdsSequence(MONETAG_ZONE_2);
});

watchAdsRoom3Button.addEventListener('click', () => { // New event listener for Room 3
    watchAdsSequence(MONETAG_ZONE_3);
});

returnHomeButton.addEventListener('click', () => {
    showPage('homePage');
    hideAdsLeftPopup();
    setAdsStatusText('Ready for your next earnings opportunity.'); // Reset status for next time
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateCoinDisplay();
    updateDateTime(); // Set initial date/time
    setInterval(updateDateTime, 1000); // Update date/time every second
    showPage('homePage'); // Start on the home page
});
