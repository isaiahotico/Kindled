// Telegram Mini App API
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// === GAME SYSTEM ===
const gameBoard = document.getElementById("game-board");
const coinsEl = document.getElementById("coins");

let coins = localStorage.getItem("coins") ? Number(localStorage.getItem("coins")) : 0;
coinsEl.textContent = coins;

// 6 colors
const colors = ["red", "blue", "green", "yellow", "purple", "orange"];

// Build game grid
function createBoard() {
    gameBoard.innerHTML = "";
    for (let i = 0; i < 36; i++) {
        let tile = document.createElement("div");
        tile.className = "tile";
        tile.style.background = colors[Math.floor(Math.random() * colors.length)];
        tile.onclick = () => handleTile(tile);
        gameBoard.appendChild(tile);
    }
}

function handleTile(tile) {
    let earned = 1;
    coins += earned;
    coinsEl.textContent = coins;
    localStorage.setItem("coins", coins);

    tile.style.opacity = "0.5"; 
}

// Initial board
createBoard();

// === Monetag Ads ===

// Watch Ad Button
document.getElementById("watch-ad").addEventListener("click", () => {
    show_10276123().then(() => {
        // Reward
        coins += 3;
        coinsEl.textContent = coins;
        localStorage.setItem("coins", coins);

        alert("You earned +0.03 Pesos!");
    });
});

// Auto interstitial every 6 minutes
show_10276123({
    type: "inApp",
    inAppSettings: {
        frequency: 2,
        capping: 0.1,      // 6 minutes
        interval: 30,
        timeout: 5,
        everyPage: false
    }
});
