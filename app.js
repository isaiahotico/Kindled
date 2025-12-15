/* Telegram Init */
const tg = window.Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe.user?.id || "guest";
const userName = tg.initDataUnsafe.user?.first_name || "Guest";

/* Firebase Config (ADD YOUR KEYS) */
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID"
});
const db = firebase.firestore();

/* UI */
function showRoom(id) {
  document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* Balance */
let balance = 0;
function updateBalance() {
  document.getElementById("balance").innerText = `₱${balance.toFixed(3)}`;
}

/* SMART YOUTUBE URL ENGINE */
function parseYouTube(url) {
  let id = null;
  if (url.includes("watch?v=")) id = url.split("watch?v=")[1].split("&")[0];
  if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
  if (url.includes("shorts/")) id = url.split("shorts/")[1].split("?")[0];
  return id;
}

/* LINKS */
let userLinks = [];

function addLink() {
  const raw = document.getElementById("ytLink").value;
  const videoId = parseYouTube(raw);
  if (!videoId) return alert("Invalid YouTube link");

  if (userLinks.length >= 20) return alert("Max 20 links reached");

  userLinks.push(videoId);
  renderLinks();
}

function renderLinks() {
  document.getElementById("linkTable").innerHTML =
    userLinks.map((v, i) =>
      `<tr><td>${i+1}</td><td>${v}</td></tr>`
    ).join("");
}

/* YOUTUBE PLAYER */
let player;
let playedVideos = new Set();

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '240',
    width: '100%',
    playerVars: { controls: 1 }
  });
}

function playForReward() {
  if (userLinks.length === 0) return alert("No videos available");

  let vid;
  do {
    vid = userLinks[Math.floor(Math.random() * userLinks.length)];
  } while (playedVideos.has(vid) && playedVideos.size < userLinks.length);

  playedVideos.add(vid);
  player.loadVideoById(vid);

  setTimeout(() => {
    balance += 0.01;
    updateBalance();
  }, 60000); // 1 minute rule
}

function nextVideo() {
  playForReward();
}

/* ADS */
let adsLeft = 4;
function watchAds() {
  adsLeft = 4;
  document.getElementById("adsLeft").innerText = `Ads left: ${adsLeft}`;

  function playAd() {
    if (adsLeft === 0) {
      balance += 0.025;
      updateBalance();
      return;
    }
    show_10276123('pop').then(() => {
      adsLeft--;
      document.getElementById("adsLeft").innerText = `Ads left: ${adsLeft}`;
      playAd();
    });
  }
  playAd();
}

/* WITHDRAW */
function requestWithdraw() {
  alert("Withdrawal request sent for manual approval");
}

/* ADMIN */
function openAdmin() {
  if (sessionStorage.admin) return showRoom('admin');
  const pass = prompt("Admin Password");
  if (pass === "Propetas6") {
    sessionStorage.admin = true;
    loadAdminTable();
    showRoom('admin');
  }
}

function loadAdminTable() {
  document.getElementById("adminTable").innerHTML =
    `<tr><td>${userId}</td><td>₱${balance.toFixed(2)}</td><td>PENDING</td></tr>`;
}

/* Footer Time */
setInterval(() => {
  document.getElementById("time").innerText = new Date().toLocaleString();
}, 1000);
