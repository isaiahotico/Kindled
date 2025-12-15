// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let player;
let rewardClaimed = false;
let playlist = [];
let currentIndex = 0;

// Parse YouTube Video ID
function parseYouTubeID(url) {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([^\?&\/]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Render Playlist
function renderPlaylist() {
  const container = document.getElementById('playlistContainer');
  container.innerHTML = '<h3>Playlist:</h3>';
  playlist.forEach((id, index) => {
    const videoDiv = document.createElement('div');
    videoDiv.innerText = `${index + 1}. https://youtu.be/${id}`;
    videoDiv.className = index === currentIndex ? 'current' : '';
    container.appendChild(videoDiv);
  });
}

// Load YouTube Video by index
function loadVideo(index) {
  if (index >= playlist.length) return;
  currentIndex = index;
  const videoId = playlist[index];
  const container = document.getElementById('videoContainer');
  container.innerHTML = '';

  player = new YT.Player(container, {
    videoId: videoId,
    events: { 'onStateChange': onPlayerStateChange },
    playerVars: { autoplay: 1, rel: 0, modestbranding: 1 }
  });

  rewardClaimed = false;
  document.getElementById('claimReward').classList.add('hidden');
  renderPlaylist();
  document.getElementById('status').innerText = 'Playing video ' + (index + 1);
}

// Handle Video End
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED && !rewardClaimed) {
    document.getElementById('status').innerText = 'Video finished! Claim your reward.';
    document.getElementById('claimReward').classList.remove('hidden');
  }
}

// Add Video to Playlist
function addVideo() {
  const url = document.getElementById('videoUrl').value;
  const videoId = parseYouTubeID(url);
  if (!videoId) {
    document.getElementById('status').innerText = 'Invalid YouTube URL!';
    return;
  }
  playlist.push(videoId);

  // Save playlist to Firebase per user
  const userId = Telegram.WebApp.initDataUnsafe.user.id;
  db.ref(`users/${userId}/playlist`).set(playlist);

  renderPlaylist();
  if (playlist.length === 1) loadVideo(0);
  document.getElementById('videoUrl').value = '';
}

// Claim Reward
function claimReward() {
  rewardClaimed = true;
  document.getElementById('status').innerText = 'Reward claimed! 🎉';
  document.getElementById('claimReward').classList.add('hidden');

  const userId = Telegram.WebApp.initDataUnsafe.user.id;
  const rewardRef = db.ref(`users/${userId}/rewards`);
  rewardRef.transaction(current => (current || 0) + 1);

  if (currentIndex + 1 < playlist.length) loadVideo(currentIndex + 1);
  else document.getElementById('status').innerText = 'Playlist finished!';
}

document.getElementById('addVideo').addEventListener('click', addVideo);
document.getElementById('claimReward').addEventListener('click', claimReward);

// Auto-detect URL pasted
document.getElementById('videoUrl').addEventListener('paste', (e) => {
  setTimeout(() => {
    const url = e.target.value;
    const videoId = parseYouTubeID(url);
    if (videoId) addVideo();
  }, 100);
});
