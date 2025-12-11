// PAGE NAVIGATION
function goToPage2() {
    flashGreen();
    document.getElementById("page1").classList.remove("active");
    document.getElementById("page2").classList.add("active");
}
function goBack() {
    flashPink();
    document.getElementById("page2").classList.remove("active");
    document.getElementById("page1").classList.add("active");
}

// BACKGROUND FLASH EFFECTS
function flashGreen() {
    document.body.classList.add("clicked-green");
    setTimeout(() => document.body.classList.remove("clicked-green"), 250);
}
function flashPink() {
    document.body.classList.add("clicked-pink");
    setTimeout(() => document.body.classList.remove("clicked-pink"), 250);
}

// INSTALL APP (TWA / PWA)
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});
installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    deferredPrompt = null;
});

// ------------------------------
// MONETAG PRELOAD & AUTO-ADS
// ------------------------------
let adQueue = [
    {type: "rewarded", func: () => show_10276123()},
    {type: "rewarded", func: () => show_10276123()},
    {type: "popup", func: () => show_10276123("pop")},
    {type: "inApp", func: () => show_10276123({type:"inApp", inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}})}
];

let currentAd = 0;

// Preload ads
function preloadAds() { adQueue.forEach(ad => { ad.func().catch(()=>{}); }); }

// Auto-next ad
function playNextAd() {
    if(currentAd >= adQueue.length) currentAd = 0;
    let ad = adQueue[currentAd];
    currentAd++;
    flashGreen();
    ad.func().then(()=>{ setTimeout(playNextAd,1000); }).catch(()=>{ setTimeout(playNextAd,1000); });
}

// Manual triggers
function playAd1(){ currentAd=0; playNextAd(); }
function playAd2(){ currentAd=1; playNextAd(); }
function playAdPopup(){ currentAd=2; playNextAd(); }
function playAdInApp(){ currentAd=3; playNextAd(); }

// Initialize preloads
preloadAds();
