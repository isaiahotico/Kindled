// Telegram WebApp ready
document.addEventListener("DOMContentLoaded", () => {
  if (Telegram?.WebApp) Telegram.WebApp.ready();
});

const SERVER = "https://your-server.com"; // Replace with your backend URL
let player, watched = 0, timer = null;
const USER_ID = Telegram.WebApp.initDataUnsafe?.user?.id || "guest";

/* --- Google Login --- */
function handleCredentialResponse(response) {
  const user = parseJwt(response.credential);
  document.getElementById("user-name").innerText = user.name;
  document.getElementById("user-photo").src = user.picture;
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

/* --- Extract Video ID --- */
function extractVideoID(url) {
  const regex = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/* --- Load video --- */
document.getElementById("load-video").addEventListener("click", () => {
  const url = document.getElementById("youtube-link").value;
  const videoId = extractVideoID(url);
  if (!videoId) return alert("Invalid YouTube link");
  loadVideo(videoId);
});

/* --- Example video list --- */
const videos = [
  { title: "Sample Video 1", videoId: "dQw4w9WgXcQ", channelId: "UCXXXX" },
  { title: "Sample Video 2", videoId: "abcd1234", channelId: "UCYYYY" }
];
const container = document.getElementById("videos-list");
videos.forEach(v => {
  const div = document.createElement("div");
  div.className = "video-card";
  div.innerHTML = `
    <p>${v.title}</p>
    <button onclick="openYoutube('${v.videoId}')">Open Video</button>
    <button onclick="subscribeYoutube('${v.channelId}')">Subscribe</button>
    <button onclick="likeYoutube('${v.videoId}')">Like</button>
  `;
  container.appendChild(div);
});

/* --- Video Button Functions --- */
function openYoutube(videoId){window.open(`https://www.youtube.com/watch?v=${videoId}`,"_blank")}
function subscribeYoutube(channelId){window.open(`https://www.youtube.com/channel/${channelId}?sub_confirmation=1`,"_blank")}
function likeYoutube(videoId){window.open(`https://www.youtube.com/watch?v=${videoId}`,"_blank")}

/* --- Load Video with Stats --- */
function loadVideo(videoId){
  fetch(`${SERVER}/video-stats/${videoId}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.error) return alert(d.error);
      document.getElementById("views").innerHTML = `
        <strong>${d.title}</strong><br>
        Channel: ${d.channelTitle}<br>
        Published: ${new Date(d.publishedAt).toLocaleDateString()}<br>
        👁 Views: ${Number(d.viewCount).toLocaleString()}<br>
        👍 Likes: ${Number(d.likeCount).toLocaleString()}<br>
        💬 Comments: ${Number(d.commentCount).toLocaleString()}<br>
        <img src="${d.thumbnail}" width="320">
      `;
    });

  if(player) player.destroy();
  player = new YT.Player("player", { videoId, width:"100%", height:"360", playerVars:{playsinline:1}, events:{onStateChange} });
  watched=0;
  document.getElementById("status").innerText="Tap play to start watching";
}

/* --- 60s Watch Validation --- */
function onStateChange(e){
  if(e.data===YT.PlayerState.PLAYING){startTimer();fetch(`${SERVER}/watch/start`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:USER_ID,videoId:player.getVideoData().video_id})});}
  if(e.data===YT.PlayerState.PAUSED||e.data===YT.PlayerState.ENDED) stopTimer();
}
function startTimer(){
  if(timer) return;
  timer=setInterval(()=>{
    watched++;
    document.getElementById("status").innerText=`⏱ Watched ${watched}s / 60s`;
    if(watched>=60){validateWatch();stopTimer();}
  },1000);
}
function stopTimer(){clearInterval(timer);timer=null;}
function validateWatch(){
  fetch(`${SERVER}/watch/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:USER_ID,videoId:player.getVideoData().video_id,watchedSeconds:watched})})
  .then(r=>r.json()).then(d=>{if(d.validated){document.getElementById("status").innerText="✅ 60s completed (validated)";Telegram.WebApp.HapticFeedback.notificationOccurred("success");}});
}
