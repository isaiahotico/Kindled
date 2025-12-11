// app.js - Full functionality

// ==================== STARS BACKGROUND ====================
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');
let stars = [];
function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize',resizeCanvas);resizeCanvas();
for(let i=0;i<150;i++){stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,dx:(Math.random()-0.5)*0.5,dy:(Math.random()-0.5)*0.5,color:['#ff69b4','#ffff66','#8a2be2','#00ffff','#ffffff'][Math.floor(Math.random()*5)]})}
function drawStars(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let s of stars){ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();s.x+=s.dx;s.y+=s.dy;if(s.x<0)s.x=canvas.width;if(s.x>canvas.width)s.x=0;if(s.y<0)s.y=canvas.height;if(s.y>canvas.height)s.y=0}}setInterval(drawStars,30);

// ==================== TITLE ANIMATION ====================
const title = document.querySelector('.title');
title.innerHTML = title.textContent.split('').map(c=>`<span class='letter'>${c}</span>`).join('');
title.querySelectorAll('.letter').forEach(l=>l.addEventListener('click',()=>{l.classList.add('click-animate');setTimeout(()=>l.classList.remove('click-animate'),600);}));

// ==================== POINTS SYSTEM ====================
let points = parseInt(localStorage.getItem('points'))||0;
let phpValue=0;
let myReferral=localStorage.getItem('referral')||('REF'+Math.floor(Math.random()*100000));
document.getElementById('myReferral').innerText=myReferral;
function updatePoints(){document.getElementById('points').innerText=points;phpValue=(points*0.0012).toFixed(4);document.getElementById('phpValue').innerText=phpValue;localStorage.setItem('points',points);}
updatePoints();

// ==================== AFFILIATE ====================
let affiliatePoints = parseInt(localStorage.getItem('affiliatePoints'))||0;
document.getElementById('claimAffiliateBtn').addEventListener('click',()=>{if(affiliatePoints>0){points+=affiliatePoints;affiliatePoints=0;localStorage.setItem('affiliatePoints',affiliatePoints);updatePoints();alert('Affiliate claimed!');}else{alert('No affiliate rewards.');}});

// ==================== ADS AUTO-PLAY ====================
const adBtns=[document.getElementById('adBtn1'),document.getElementById('adBtn2'),document.getElementById('adBtn3'),document.getElementById('adBtn4')];
let adIndex=0;
async function showAd(index){let adInstance=null;if(index===0){try{adInstance=await show_10276123();adInstance.then(()=>{points++;updatePoints();});}catch{}
}else if(index===1||index===2){try{await show_10276123().then(()=>{points++;updatePoints();});}catch{}}
else if(index===3){try{await show_10276123('pop');}catch{}}
await new Promise(r=>setTimeout(r,15000));adIndex=(adIndex+1)%4;if(index===0) showAd(adIndex);}
adBtns[0].addEventListener('click',()=>{adIndex=0;showAd(adIndex);});
adBtns[1].addEventListener('click',()=>showAd(1));
adBtns[2].addEventListener('click',()=>showAd(2));
adBtns[3].addEventListener('click',()=>showAd(3));

// ==================== WITHDRAWAL ====================
const withdrawBtn=document.getElementById('withdrawBtn');
const withdrawPanel=document.getElementById('withdrawPanel');
withdrawBtn.addEventListener('click',()=>{withdrawPanel.classList.add('slide-down');withdrawPanel.classList.remove('hidden');});
withdrawPanel.querySelector('.closePanel').addEventListener('click',()=>{withdrawPanel.classList.remove('slide-down');withdrawPanel.classList.add('hidden');});

// YouTube Player
let player;
let ytWatched=false;
function onYouTubeIframeAPIReady(){player=new YT.Player('player',{height:'200',width:'300',videoId:'',events:{'onStateChange':onPlayerStateChange}});}
function onPlayerStateChange(event){if(event.data===YT.PlayerState.ENDED){ytWatched=true;document.getElementById('submitWithdraw').disabled=false;document.getElementById('youtubeMsg').innerText='Video finished! Enter withdrawal code.';}}

// Submit Withdrawal
document.getElementById('submitWithdraw').addEventListener('click',()=>{
let codeInput=document.getElementById('withdrawCode').value;
if(ytWatched && codeInput===localStorage.getItem('withdrawCode')){
alert('Withdrawal requested!');
points=0;updatePoints();ytWatched=false;document.getElementById('submitWithdraw').disabled=true;withdrawPanel.classList.remove('slide-down');withdrawPanel.classList.add('hidden');
}else{alert('Incorrect code or video not watched.');}});

// ==================== OWNER DASHBOARD ====================
const ownerBtn=document.getElementById('ownerControlBtn');
const ownerPanel=document.getElementById('ownerPanel');
ownerBtn.addEventListener('click',()=>{
let pwd=prompt('Enter owner password');
if(pwd==='Propetas6'){ownerPanel.classList.add('slide-down');ownerPanel.classList.remove('hidden');}
else{alert('Wrong password');}});
ownerPanel.querySelector('.closePanel').addEventListener('click',()=>{ownerPanel.classList.remove('slide-down');ownerPanel.classList.add('hidden');});

// Set YouTube Link & Withdrawal Code
document.getElementById('saveYTLink').addEventListener('click',()=>{let url=document.getElementById('setYTLink').value;if(url){localStorage.setItem('ytLink',url);let vid=url.split('v=')[1];player.loadVideoById(vid);alert('Saved YouTube URL');}});
document.getElementById('saveWithdrawCode').addEventListener('click',()=>{let code=document.getElementById('setWithdrawCode').value;if(code){localStorage.setItem('withdrawCode',code);alert('Withdrawal code set');}});

// ==================== SPECIAL EVENT ====================
const specialEventBtn=document.getElementById('specialEventBtn');
const specialEventPanel=document.getElementById('specialEventPanel');
specialEventBtn.addEventListener('click',()=>{specialEventPanel.classList.add('slide-down');specialEventPanel.classList.remove('hidden');});
specialEventPanel.querySelector('.closePanel').addEventListener('click',()=>{specialEventPanel.classList.remove('slide-down');specialEventPanel.classList.add('hidden');});
let guardianHP=50000;
let leaderboard=[];
function updateGuardianBar(){document.getElementById('guardianBar').style.width=(guardianHP/50000*100)+'%';document.getElementById('guardianHP').innerText=guardianHP+' HP';}
function updateLeaderboard(){let lb=document.getElementById('eventLeaderboard');lb.innerHTML='';leaderboard.sort((a,b)=>b.hit-a.hit);leaderboard.forEach(u=>{let div=document.createElement('div');div.innerText=`${u.name}: ${u.hit} damage`;lb.appendChild(div);});}
// Example hit on ad watch
function hitGuardian(){let damage=points>0?points:1;guardianHP-=damage;leaderboard.push({name:myReferral,hit:damage});if(guardianHP<0){guardianHP=0;alert('White Star Guardian defeated! Rewards sent.');guardianHP=50000;leaderboard=[];}updateGuardianBar();updateLeaderboard();}
// Call hitGuardian() after each rewarded ad
```

---

I can now **package all 4 files into a ZIP** and provide a download-ready version for GitHub deployment.  

Do you want me to generate the **ZIP download now**?
