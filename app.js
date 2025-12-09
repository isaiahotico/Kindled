let adLoopActive = false;

// Start the ad loop
async function startAdLoop() {
  adLoopActive = true;
  await playAd();
}

// Stop the ad loop
function stopAdLoop() {
  adLoopActive = false;
}

// Play a single ad
async function playAd() {
  if (!adLoopActive) return;

  const container = document.getElementById("adContainer");
  container.innerHTML = '<p id="adPlaceholder">Loading ad...</p>';

  try {
    // Preload next ad
    preloadAd();

    await window.showGiga(); // current ad
    incrementDailyCounter();
  } catch (e) {
    console.log("Ad error:", e);
  } finally {
    // Auto-close after 15 seconds
    setTimeout(() => {
      closeAdUI();
      playAd(); // next ad
    }, 15000);
  }
}

// Preload next ad
async function preloadAd() {
  try {
    await window.showGiga({ preload: true });
  } catch (e) {
    console.log("Ad preload failed");
  }
}

// Increment daily counter
function incrementDailyCounter() {
  const today = new Date().toISOString().split("T")[0];
  const storedDate = localStorage.getItem("adsDate");
  let count = parseInt(localStorage.getItem("adsCount") || "0");

  if (storedDate !== today) count = 0;
  count += 1;

  localStorage.setItem("adsCount", count);
  localStorage.setItem("adsDate", today);

  updateCounterUI(count);
}

// Update counter UI
function updateCounterUI(count) {
  const counter = document.getElementById("adsCounter");
  if (counter.innerText != count) counter.innerText = count;
}

// Close ad UI
function closeAdUI() {
  const container = document.getElementById("adContainer");
  while (container.firstChild) container.removeChild(container.firstChild);
}

// Event listeners
document.getElementById("startAdsBtn").addEventListener("click", startAdLoop);
document.getElementById("stopAdsBtn").addEventListener("click", stopAdLoop);

// Placeholder buttons for future features
document.getElementById("btn3").addEventListener("click", () => {
  alert("Feature 3 clicked!");
});

document.getElementById("btn4").addEventListener("click", () => {
  alert("Feature 4 clicked!");
});

// Initialize daily counter
window.onload = () => {
  const today = new Date().toISOString().split("T")[0];
  const storedDate = localStorage.getItem("adsDate");
  let count = parseInt(localStorage.getItem("adsCount") || "0");
  if (storedDate !== today) count = 0;
  updateCounterUI(count);
};
