function nav(page){window.location.href=page;}
function coins(){return parseInt(localStorage.getItem('coins')||'0');}
function setCoins(n){localStorage.setItem('coins',n);updateCoinUI();}
function addCoin(n=1){setCoins(coins()+n);}
function updateCoinUI(){document.querySelectorAll('#coinCount').forEach(el=>el.innerText=coins());}
window.addEventListener('load',updateCoinUI);

// Monetag Rewarded Ad
function playRewardedAd(){
  show_10276123().then(()=>{
    setTimeout(()=>{addCoin(1);alert('🎉 You earned 1 coin!');},10000);
  }).catch(e=>console.error(e));
}

// Happy Face Explosion
document.addEventListener('click',(e)=>{
  if(e.target.tagName==='BUTTON'){spawnHappyFaces(e.pageX,e.pageY,4);}
});
function spawnHappyFaces(x,y,count=6){
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className='happy';
    el.style.left=(x+(Math.random()*80-40))+'px';
    el.style.top=y+'px';
    el.innerText='😊';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),700);
  }
}

// Music Player
const MUSIC=[/* 15 Mixkit URLs */];
function initMusic(){
  const player=document.getElementById('bgm');
  if(!player)return;
  let idx=Math.floor(Math.random()*MUSIC.length);
  player.src=MUSIC[idx];
  player.volume=.45;
  player.play().catch(()=>{});
  player.addEventListener('ended',()=>{
    idx=(idx+1)%MUSIC.length;
    player.src=MUSIC[idx];
    player.play().catch(()=>{});
  });
}
window.addEventListener('load',initMusic);
