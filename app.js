const SERVER = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  if (Telegram?.WebApp) Telegram.WebApp.ready();
});

const USER = Telegram.WebApp.initDataUnsafe?.user || { id: "guest", first_name: "Guest" };
const USER_ID = USER.id;
document.getElementById("user-name").innerText = USER.first_name;
document.getElementById("user-id").innerText = USER_ID;

let player, watched = 0, timer = null;
const MAX_VIDEOS = 5;
let userVideos = [];
let currentIndex = 0;

const ownerPassword = prompt("Owner Password? (Leave empty to continue as normal user)");
let isOwner = false;
if (ownerPassword === "Propetas6") {
  isOwner = true;
  showOwnerDashboard();
} else {
  document.getElementById("owner-dashboard").style.display = "none";
}

async function showOwnerDashboard() {
  document.getElementById("owner-dashboard").style.display = "block";
  document.getElementById("owner-content").innerHTML = "<p>Loading withdrawals...</p>";

  const res = await fetch(`${SERVER}/owner/withdrawals`);
  const data = await res.json();

  if (data.length === 0) {
    document.getElementById("owner-content").innerHTML = "<p>No withdrawal requests.</p>";
    return;
  }

  const container = document.getElementById("owner-content");
  container.innerHTML = "";
  data.forEach(w => {
    const div = document.createElement("div");
    div.className = "withdraw-card";
    div.style.border = "1px solid #ccc";
    div.style.padding = "8px";
    div.style.margin = "6px 0";
    div.style.borderRadius = "6px";
    div.innerHTML = `
      <p><strong>User ID:</strong> ${w.userId}</p>
      <p><strong>Amount:</strong> ${w.amount} PHP</p>
      <p><strong>Gcash:</strong> ${w.gcashNumber}</p>
      <p><strong>Date:</strong> ${new Date(w.date).toLocaleString()}</p>
      <p><strong>Status:</strong> <span id="status-${w.id}">${w.status}</span></p>
      <button onclick="processWithdrawal(${w.id}, 'Approved')">Approve</button>
      <button onclick="processWithdrawal(${w.id}, 'Rejected')">Reject</button>
    `;
    container.appendChild(div);
  });
}

async function processWithdrawal(id, status) {
  const res = await fetch(`${SERVER}/owner/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status })
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById(`status-${id}`).innerText = status;
    alert(`Withdrawal ${status}`);
  }
}

document.getElementById("owner-logout").addEventListener("click", () => {
  document.getElementById("owner-dashboard").style.display = "none";
});

function extractVideoID(url) {
  const regex = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function loadUserVideos() {
  const res = await fetch(`${SERVER}/user-videos/${USER_ID}`);
  const data = await res.json();
  userVideos = Object.entries(data).map(([videoId, info]) => ({ videoId, title: info.title }));
  renderVideos();
}
loadUserVideos();

document.getElementById("add-video").addEventListener("click", async () => {
  const url = document.getElementById("youtube-link").value.trim();
  if (!url) return alert("Enter a valid YouTube link");
  if (userVideos.length >= MAX_VIDEOS) {
    document.getElementById("limit-msg").innerText = "⚠️ Max 5 videos reached";
    return;
  }
  const videoId = extractVideoID(url);
  if (!videoId) return alert("Invalid YouTube link");
  const title = `Video ${userVideos.length + 1}`;

  const res = await fetch(`${SERVER}/add-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, videoId, title })
  });
  const data = await res.json();
  if (!data.success) return alert(data.message);
  userVideos = Object.entries(data.videos).map(([videoId, info]) => ({ videoId, title: info.title }));
  renderVideos();
  document.getElementById("youtube-link").value = "";
});

function renderVideos() {
  const container = document.getElementById("videos-list");
  container.innerHTML = "";
  userVideos.forEach(v => {
    const div = document.createElement("div");
    div.className = "video-card";
    div.innerHTML = `<p>${v.title}</p>`;
    container.appendChild(div);
  });
}

async function loadRandomVideo() {
  const res = await fetch(`${SERVER}/all-videos`);
  const allVideos = await res.json();
  if (allVideos.length === 0) return alert("No videos available");

  currentIndex = Math.floor(Math.random() * allVideos.length);
  const video = allVideos[currentIndex];
  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: video.videoId,
    width: "100%",
    height: "360",
    playerVars: { playsinline: 1 },
    events: { onStateChange }
  });
  watched = 0;
  document.getElementById("status").innerText = `Selected: ${video.title} | Press Play`;
}

document.getElementById("next-video").addEventListener("click", loadRandomVideo);

document.getElementById("play-video").addEventListener("click", async () => {
  if (!player) return alert("No video selected");
  for (let i = 0; i < 3; i++) {
    try { await show_3136495(); } catch(e) { console.log("Ad skipped/error", e); }
  }
  player.playVideo();
});

function onStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) startTimer();
  if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) stopTimer();
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    watched++;
    document.getElementById("status").innerText = `⏱ Watched ${watched}s / 60s`;
    if (watched >= 60) validateWatch();
  }, 1000);
}

function stopTimer() { clearInterval(timer); timer = null; }

async function validateWatch() {
  if (!userVideos[currentIndex]) return;
  const videoId = userVideos[currentIndex].videoId;
  stopTimer();
  const res = await fetch(`${SERVER}/watch/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, videoId, watchedSeconds: watched })
  });
  const data = await res.json();
  if (data.validated) document.getElementById("wallet-display").innerText = `Wallet: ${data.wallet.toFixed(2)} PHP`;
  document.getElementById("status").innerText = `✅ 60s completed! Reward: 1.50 PHP`;
}

document.getElementById("withdraw-btn").addEventListener("click", async () => {
  const gcash = document.getElementById("gcash-number").value;
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const res = await fetch(`${SERVER}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, gcashNumber: gcash, amount })
  });
  const data = await res.json();
  if (data.success) alert("Withdrawal requested!");
  loadWithdrawHistory();
});

async function loadWithdrawHistory() {
  const res = await fetch(`${SERVER}/withdrawals/${USER_ID}`);
  const data = await res.json();
  const container = document.getElementById("withdraw-history");
  container.innerHTML = "<h4>History</h4>";
  data.forEach(w => {
    const div = document.createElement("div");
    div.innerText = `${w.date} | ${w.amount} PHP | ${w.status}`;
    container.appendChild(div);
  });
}
loadWithdrawHistory();
