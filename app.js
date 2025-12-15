Telegram.WebApp.ready();

const SERVER = "https://your-server.onrender.com"; // CHANGE
const USER_ID = Telegram.WebApp.initDataUnsafe?.user?.id || "guest";

let player;
let watched = 0;
let timer = null;
let VIDEO_ID = null;

/* Extract YouTube video ID from link */
function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

window.loadVideo = () => {
  const input = document.getElementById("ytInput").value.trim();
  const id = extractVideoId(input);

  if (!id) {
    alert("Invalid YouTube link");
    return;
  }

  VIDEO_ID = id;
  watched = 0;
  document.getElementById("status").innerText = "Ready to play";
  document.getElementById("views").innerText = "Loading views…";

  /* Fetch viewCount from server */
  fetch(`${SERVER}/views/${VIDEO_ID}`)
    .then(r => r.json())
    .then(d => {
      document.getElementById("views").innerText =
        `👁 ${Number(d.views).toLocaleString()} views`;
    });

  if (player) {
    player.loadVideoById(VIDEO_ID);
  } else {
    createPlayer();
  }
};

/* Create YouTube Player */
function createPlayer() {
  player = new YT.Player("player", {
    width: "100%",
    height: "360",
    videoId: VIDEO_ID,
    playerVars: { playsinline: 1 },
    events: { onStateChange }
  });
}

function onStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    startTimer();

    fetch(`${SERVER}/watch/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, videoId: VIDEO_ID })
    });
  }

  if (
    e.data === YT.PlayerState.PAUSED ||
    e.data === YT.PlayerState.ENDED
  ) {
    stopTimer();
  }
}

/* Watch-time timer */
function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    watched++;
    document.getElementById("status").innerText =
      `⏱ Watched ${watched}s / 60s`;

    if (watched >= 60) {
      validateWatch();
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function validateWatch() {
  fetch(`${SERVER}/watch/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      videoId: VIDEO_ID,
      watchedSeconds: watched
    })
  })
    .then(r => r.json())
    .then(d => {
      if (d.validated) {
        document.getElementById("status").innerText =
          "✅ 60 seconds completed (validated)";
        Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    });
}
