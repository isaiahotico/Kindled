// List of Guardians
const guardians = [
  { name: "Water Guardian", lore: "Ancient lord of oceans, wounded by darkness.", maxHP: 50000 },
  { name: "Earth Guardian", lore: "Bearer of mountains, cracked but standing.", maxHP: 50000 },
  { name: "Air Guardian", lore: "Watcher of skies and winds.", maxHP: 50000 },
  { name: "Fire Guardian", lore: "Flame-born warrior of rebirth.", maxHP: 50000 },
  { name: "Nature Guardian", lore: "Spirit of forests and life.", maxHP: 50000 },
  { name: "Lightning Guardian", lore: "Swift judge of the heavens.", maxHP: 50000 },
  { name: "Crystal Guardian", lore: "Keeper of ancient knowledge.", maxHP: 50000 },
  { name: "Healer Guardian", lore: "Protector of balance.", maxHP: 50000 },
  { name: "Lava Guardian", lore: "Molten rage beneath worlds.", maxHP: 50000 },
  { name: "Government Guardian", lore: "Guardian of order and law.", maxHP: 50000 },
  { name: "Dark Guardian", lore: "Fallen lord seeking redemption.", maxHP: 50000 }
];

// Load guardian state from localStorage
let gIndex = Number(localStorage.getItem("gIndex") || 0);
let hp = Number(localStorage.getItem("gHP") || 0);
let board = JSON.parse(localStorage.getItem("gBoard") || "{}");

// Function to add HP and record contributor
function heal(uid) {
  hp++;
  board[uid] = (board[uid] || 0) + 1;

  // Update UI
  updateUI();

  // Check if guardian fully healed
  if (hp >= guardians[gIndex].maxHP) {
    alert(`🌟 ${guardians[gIndex].name} fully healed! Top contributors rewarded!`);
    rewardTopUsers();
    rotateGuardian();
  }

  saveState();
}

// Reward top 6 contributors randomly between 2000–3000 coins
function rewardTopUsers() {
  let entries = Object.entries(board).sort((a, b) => b[1] - a[1]).slice(0, 6);
  entries.forEach(([uid, points]) => {
    let reward = Math.floor(Math.random() * 1001) + 2000; // 2000-3000 coins
    let userCoins = Number(localStorage.getItem("coins_" + uid) || 0);
    userCoins += reward;
    localStorage.setItem("coins_" + uid, userCoins);

    // Notify user if currently logged in
    if (uid == localStorage.getItem("uid")) {
      alert(`🎉 You received ${reward} coins for healing the ${guardians[gIndex].name}!`);
      let coins = Number(localStorage.getItem("coins") || 0);
      coins += reward;
      localStorage.setItem("coins", coins);
    }
  });
}

// Rotate to next guardian
function rotateGuardian() {
  gIndex = (gIndex + 1) % guardians.length;
  hp = 0;
  board = {};
  saveState();
  updateUI();
}

// Save guardian state to localStorage
function saveState() {
  localStorage.setItem("gIndex", gIndex);
  localStorage.setItem("gHP", hp);
  localStorage.setItem("gBoard", JSON.stringify(board));
}

// Update UI elements for guardian page
function updateUI() {
  let guardian = guardians[gIndex];
  if (document.getElementById("gname")) document.getElementById("gname").innerText = `${guardian.name} – ${guardian.maxHP} HP`;
  if (document.getElementById("glore")) document.getElementById("glore").innerText = guardian.lore;
  if (document.getElementById("hp")) document.getElementById("hp").value = hp;
  if (document.getElementById("board")) {
    let b = document.getElementById("board");
    b.innerHTML = "";
    Object.entries(board).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .forEach(([uid, points]) => {
        let li = document.createElement("li");
        li.innerText = `${uid}: ${points} HP`;
        b.appendChild(li);
      });
  }
}

// Initialize UI on page load
window.onload = updateUI;
