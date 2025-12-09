// =================== PWA INSTALL ===================
let deferredPrompt;
const installBtn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  installBtn.style.display="inline-flex";
});
installBtn.addEventListener("click",async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
});

// =================== ELEMENTS ===================
const buttons=[...document.querySelectorAll(".btn-ad")];
const counterDisplay=document.getElementById("counterDisplay");
const counterValueEl=document.getElementById("counterValue");

// =================== DAILY COUNTER ===================
function initDailyCounter(){
  const today=new Date().toLocaleDateString();
  let data=JSON.parse(localStorage.getItem("adCounterData"))||{};
  if(data.date!==today){
    data={date:today,count:0};
    localStorage.setItem("adCounterData",JSON.stringify(data));
  }
  return data;
}
let adCounterData=initDailyCounter();
function incrementCounter(){
  adCounterData.count+=1;
  localStorage.setItem("adCounterData",JSON.stringify(adCounterData));
  updateCounterDisplay();
}
function updateCounterDisplay(){
  counterValueEl.innerText=adCounterData.count;
  counterDisplay.classList.add("pop");
  clearTimeout(counterDisplay._popTimer);
  counterDisplay._popTimer=setTimeout(()=>counterDisplay.classList.remove("pop"),220);
}
updateCounterDisplay();

// =================== DUAL BUFFER ===================
let adBuffer=[null,null],bufferIndex=0,preloadInProgress=[false,false],currentIndex=0;

// =================== AUTO CLOSE AD ===================
async function autoCloseAd(adInstance,mode="reward"){
  return new Promise(resolve=>{
    const forcedFinish=setTimeout(()=>{
      try{if(adInstance&&typeof adInstance.close==="function")adInstance.close();}catch(e){}
      resolve();
    },10000);
    if(adInstance&&typeof adInstance.onFinish==="function"){
      try{adInstance.onFinish(()=>{
        clearTimeout(forcedFinish);
        try{if(adInstance&&typeof adInstance.close==="function")adInstance.close();}catch(e){}
        resolve();
      });}catch(e){}
    }
  });
}

// =================== PRELOAD SLOT ===================
async function preloadSlot(slot=0,mode="reward"){
  if(preloadInProgress[slot]) return;
  preloadInProgress[slot]=true;
  try{
    const preloadCall=()=>{adBuffer[slot]=show_10276123(mode).then(ai=>ai).catch(()=>adBuffer[slot]=null);}
    if('requestIdleCallback' in window) requestIdleCallback(preloadCall,{timeout:3000});
    else setTimeout(preloadCall,200);
  }catch(e){adBuffer[slot]=null;}
  preloadInProgress[slot]=false;
}
window.addEventListener("load",()=>{preloadSlot(0); preloadSlot(1);});
setInterval(()=>{adBuffer.forEach((item,i)=>{if(!item) preloadSlot(i);});},20000);

// =================== AUTO NEXT ===================
function autoNext(){currentIndex=(currentIndex+1)%buttons.length;}

// =================== PLAY AD ===================
async function playAd(mode="reward"){
  const slot=bufferIndex;
  bufferIndex=(bufferIndex+1)%2;
  let adInstance;
  if(adBuffer[slot]){try{adInstance=await adBuffer[slot];}catch(e){} adBuffer[slot]=null; preloadSlot(slot,mode);}
  if(!adInstance){try{adInstance=await (mode==="popup"?show_10276123("pop"):show_10276123());}catch(e){} preloadSlot(slot,mode);}
  const btn=buttons[currentIndex];
  if(btn) btn.disabled=true;
  await autoCloseAd(adInstance,mode);
  if(btn) btn.disabled=false;
  incrementCounter();
  autoNext();
}

// =================== AUTO LOOP ===================
function startAutoLoop(){
  function clickNext(){
    const btn=buttons[currentIndex];
    playAd("reward").then(()=>setTimeout(clickNext,200));
  }
  clickNext();
}
window.addEventListener("load",startAutoLoop);

// =================== RAINBOW PARTICLE BACKGROUND ===================
const canvas=document.getElementById("bgCanvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
window.addEventListener("resize",()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});

class Particle{
  constructor(){this.reset();}
  reset(){this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.vx=(Math.random()-0.5)*0.6; this.vy=(Math.random()-0.5)*0.6; this.size=2+Math.random()*3; this.color=`hsl(${Math.random()*360},80%,70%)`;}
  update(){this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height)this.reset();}
  draw(){ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle=this.color; ctx.fill();}
}
const particles=[];
for(let i=0;i<120;i++) particles.push(new Particle());
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.update(); p.draw();});
  requestAnimationFrame(animate);
}
animate();
