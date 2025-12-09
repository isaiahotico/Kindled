let adLoopActive = false;

// Start the ad loop
function startAdLoop() {
    adLoopActive = true;
    playAd();
}

// Stop the ad loop
function stopAdLoop() {
    adLoopActive = false;
}

// Play a single ad
function playAd() {
    if (!adLoopActive) return;

    // GigaHub / Monetag rewarded ad
    window.showGiga() 
        .then(() => {
            incrementDailyCounter();
        })
        .catch(() => {
            console.log("Ad not completed or skipped");
        })
        .finally(() => {
            // Auto-close after 15 seconds
            setTimeout(() => {
                closeAdUI();
                playAd(); // Open next ad automatically
            }, 15000);
        });
}

// Increment daily counter
function incrementDailyCounter() {
    const today = new Date().toISOString().split("T")[0];
    const storedDate = localStorage.getItem("adsDate");
    let count = parseInt(localStorage.getItem("adsCount") || "0");

    if (storedDate !== today) count = 0; // reset daily
    count += 1;

    localStorage.setItem("adsCount", count);
    localStorage.setItem("adsDate", today);

    updateCounterUI(count);
}

// Update counter UI
function updateCounterUI(count) {
    document.getElementById("adsCounter").innerText = count;
}

// Close ad UI
function closeAdUI() {
    const container = document.getElementById("adContainer");
    container.innerHTML = "";
}

// Event listeners
document.getElementById("startAdsBtn").addEventListener("click", startAdLoop);
document.getElementById("stopAdsBtn").addEventListener("click", stopAdLoop);

// Adsterra Smart Link Button
document.getElementById("adsterraBtn").addEventListener("click", () => {
    const smartLink = "https://go.adsterra.com/28091778";
    window.open(smartLink, "_blank");
    // Optional: count as an ad viewed
    incrementDailyCounter();
});

// Initialize counter
window.onload = () => {
    const today = new Date().toISOString().split("T")[0];
    const storedDate = localStorage.getItem("adsDate");
    let count = parseInt(localStorage.getItem("adsCount") || "0");

    if (storedDate !== today) count = 0;
    updateCounterUI(count);
};
