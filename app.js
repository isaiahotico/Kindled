// --- Initialization ---
let echoOrbs = JSON.parse(localStorage.getItem('echoOrbs')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUserId = localStorage.getItem('currentUserId') || `user${Date.now()}`;
let currentUser = users.find(u=>u.id===currentUserId) || createNewUser();
let guardianHP = parseInt(localStorage.getItem('guardianHP')) || 50000;
const maxGuardianHP = 50000;

const echoContainer = document.getElementById('echoContainer');
const leaderboard = document.getElementById('leaderboard');
const guardianBar = document.getElementById('guardianHP');
const guardianText = document.getElementById('guardianText');
const profileModal = document.getElementById('profileModal');
const profileContent = document.getElementById('profileContent');
const rewardPopup = document.getElementById('rewardPopup');
const rewardContent = document.getElementById('rewardContent');
const missionsModal = document.getElementById('missionsModal');

// --- User Functions ---
function createNewUser(){
  const newUser={id:currentUserId,username:`Player${Math.floor(Math.random()*1000)}`,badges:[],EP:0,tracksUploaded:0,tracksPlayed:0,likesGiven:0,totalContribution:0,rareRewards:[]};
  users.push(newUser); saveUsers(); localStorage.setItem('currentUserId',currentUserId); return newUser;
}
function saveUsers(){ localStorage.setItem('users',JSON.stringify(users)); localStorage.setItem('currentUserId',currentUserId);}
function addBadge(user,badge){if(!user.badges.includes(badge)) user.badges.push(badge);}

// --- Echo Orb Functions ---
function getRandomColor(){ const colors=['#ff00ff','#00ffff','#ff5500','#55ff00','#ffaa00']; return colors[Math.floor(Math.random()*colors.length)]; }
function renderOrbs(){
  echoContainer.innerHTML='';
  echoOrbs.forEach((orb,index)=>{
    const orbDiv=document.createElement('div');
    orbDiv.className='echo-orb'; orbDiv.style.background=orb.color||getRandomColor();
    orbDiv.innerHTML=`${orb.thumbnail?`<img src="${orb.thumbnail}" class="orb-thumb">`:''}
      <div class="orb-title">${orb.title}</div>
      <div class="orb-user">@${orb.user}</div>
      <div class="orb-controls">
        <button onclick="playMusic(${index})">▶</button>
        <button onclick="likeOrb(${index})">♥ ${orb.likes}</button>
      </div>`;
    echoContainer.appendChild(orbDiv);
  });
  renderLeaderboard(); renderGuardian();
}

// --- Leaderboard & Guardian ---
function renderLeaderboard(){ const sorted=[...users].sort((a,b)=>b.totalContribution-a.totalContribution);
  leaderboard.innerHTML=''; sorted.slice(0,10).forEach(u=>{ const li=document.createElement('li'); li.textContent=`${u.username} – ${u.totalContribution} damage`; leaderboard.appendChild(li); });
}
function renderGuardian(){
  const percent=Math.max((guardianHP/maxGuardianHP)*100,0);
  guardianBar.style.width=percent+'%';
  guardianText.textContent=`White Star Guardian HP: ${guardianHP}/${maxGuardianHP}`;
  if(guardianHP<=0) handleGuardianDefeat();
}

// --- Music Actions ---
function playMusic(index){
  const orb=echoOrbs[index]; orb.plays+=1; currentUser.tracksPlayed+=1; currentUser.totalContribution+=1; guardianHP-=1;
  saveUsers(); saveOrbs(); renderOrbs();
  if(orb.link.includes('youtube.com')||orb.link.includes('soundcloud.com')) window.open(orb.link,'_blank');
  else{const audio=new Audio(orb.link); audio.play();}
}
function likeOrb(index){
  const orb=echoOrbs[index]; orb.likes+=1; currentUser.likesGiven+=1; currentUser.totalContribution+=5; guardianHP-=5;
  saveUsers(); saveOrbs(); renderOrbs();
}
function saveOrbs(){ localStorage.setItem('echoOrbs',JSON.stringify(echoOrbs)); }

// --- Upload ---
document.getElementById('generateBtn').addEventListener('click',()=>{
  const link=document.getElementById('musicLink').value.trim();
  if(!link) return alert('Please enter a music link!');
  let title='Unknown Track', thumbnail=''; const color=getRandomColor();
  if(link.includes('youtube.com')){ const videoId=new URLSearchParams(link.split('?')[1]).get('v'); title=`YouTube Video: ${videoId}`; thumbnail=`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }
  else if(link.includes('soundcloud.com')){ title=`SoundCloud Track`; thumbnail='https://a-v2.sndcdn.com/assets/images/sc-icons/ios-audio-bb.png'; }
  else title=link.split('/').pop().split('?')[0];

  echoOrbs.push({link,title,user:currentUser.username,color,thumbnail,plays:0,likes:0});
  currentUser.tracksUploaded+=1; currentUser.totalContribution+=10;
  if(currentUser.tracksUploaded>=5) addBadge(currentUser,"Echo Caster"); guardianHP-=10;
  saveUsers(); saveOrbs(); renderOrbs(); document.getElementById('musicLink').value='';
});

// --- Profile & Missions ---
document.getElementById('profileBtn').addEventListener('click',()=>{
  profileContent.innerHTML=`<p>Username: ${currentUser.username}</p><p>EP: ${currentUser.EP}</p><p>Tracks Uploaded: ${currentUser.tracksUploaded}</p><p>Tracks Played: ${currentUser.tracksPlayed}</p><p>Likes Given: ${currentUser.likesGiven}</p><p>Total Contribution: ${currentUser.totalContribution}</p><p>Badges: ${currentUser.badges.join(', ') || 'None'}</p><p>Rare Rewards: ${currentUser.rareRewards.join(', ') || 'None'}</p>`;
  profileModal.style.display='block';
});
document.getElementById('closeProfile').addEventListener('click',()=>profileModal.style.display='none');
document.getElementById('missionsBtn').addEventListener('click',()=>missionsModal.style.display='block');
document.getElementById('closeMissions').addEventListener('click',()=>missionsModal.style.display='none');

// --- Guardian Defeat & Rewards ---
function handleGuardianDefeat(){
  rewardContent.innerHTML='';
  users.forEach(u=>{
    let rewardEP=u.totalContribution; u.EP+=rewardEP;
    if(u.totalContribution>=50) addBadge(u,"Guardian Slayer");
    if(Math.random()<0.1) u.rareRewards.push("Legendary Orb Skin");
    rewardContent.innerHTML+=`<p>${u.username}: +${rewardEP} EP, Badges: ${u.badges.join(', ')}, Rare: ${u.rareRewards.join(', ')}</p>`;
  });
  saveUsers(); rewardPopup.style.display='block'; guardianHP=maxGuardianHP; saveOrbs(); renderOrbs();
}
document.getElementById('closeReward').addEventListener('click',()=>rewardPopup.style.display='none');

// --- Guardian Info ---
document.getElementById('guardianInfo').addEventListener('click',()=>alert(`Guardian HP: ${guardianHP}/${maxGuardianHP}`));

// Initial render
renderOrbs();
