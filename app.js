firebase.initializeApp({
  /* YOUR FIREBASE CONFIG */
});
const db = firebase.database();

const telegramId =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id
  || "guest_"+Math.random().toString(36).slice(2);

const $ = id => document.getElementById(id);
const now = ()=>Date.now();

let balance = Number(localStorage.getItem(telegramId+"_bal")||0);
$("balance").innerText = balance.toFixed(3);

// Popup
function popup(t){
  const p=$("popup");
  p.innerText=t;
  p.style.opacity=1;
  setTimeout(()=>p.style.opacity=0,2000);
}

// Safe Monetag
async function safeAd(fn){
  return new Promise(res=>{
    let done=false;
    const finish=()=>{if(!done){done=true;res()}};
    try{
      const p=fn();
      if(p?.then) p.then(finish).catch(finish);
      else finish();
    }catch(e){finish()}
    setTimeout(finish,7000);
  });
}

// Monetag rotation
async function showAd(){
  const fns=[
    ()=>show_10276123(),
    ()=>show_10276123('pop'),
    ()=>show_10276123({type:'inApp'})
  ];
  await safeAd(fns[Math.floor(Math.random()*fns.length)]);
}

// CPM Quality Score
function computeCPMScore(ctx){
  let s=0;
  if(ctx.ads>=4) s+=20;
  if(ctx.ads>=5) s+=10;
  if(ctx.daily) s+=15;
  if(ctx.gift) s+=10;
  if(ctx.returned) s+=15;
  if(!ctx.fastClick) s+=20;
  if(ctx.fastClick) s-=30;
  return Math.max(0,Math.min(100,s));
}

// Reward scale
function rewardFromScore(score){
  if(score>=70) return 0.040;
  if(score>=50) return 0.035;
  if(score>=30) return 0.030;
  return 0.025;
}

// Save
function save(){
  localStorage.setItem(telegramId+"_bal",balance);
  db.ref("users/"+telegramId).set({balance});
  $("balance").innerText = balance.toFixed(3);
}

// MAIN ADS
$("adsBtn").onclick=async()=>{
  const ads=4+Math.floor(Math.random()*2);
  for(let i=0;i<ads;i++){
    popup("Ads left: "+(ads-i-1));
    await showAd();
    await new Promise(r=>setTimeout(r,1200+Math.random()*800));
  }

  const ctx={
    ads,
    daily:localStorage.getItem(telegramId+"_daily"),
    gift:localStorage.getItem(telegramId+"_gift"),
    returned:localStorage.getItem(telegramId+"_last")>now()-86400000,
    fastClick:false
  };

  const score=computeCPMScore(ctx);
  const reward=rewardFromScore(score);

  balance+=reward;
  popup(`🎉 Earned ₱${reward.toFixed(3)} (CPM ${score})`);
  localStorage.setItem(telegramId+"_last",now());
  save();
};

// DAILY
$("dailyBtn").onclick=async()=>{
  if(now()-Number(localStorage.getItem(telegramId+"_daily")||0)<1800000) return;
  await showAd();
  balance+=0.04;
  localStorage.setItem(telegramId+"_daily",now());
  popup("🎁 Daily +₱0.04");
  save();
};

// GIFT
$("giftBtn").onclick=async()=>{
  if(now()-Number(localStorage.getItem(telegramId+"_gift")||0)<3600000) return;
  await showAd();
  balance+=0.02;
  localStorage.setItem(telegramId+"_gift",now());
  popup("🎉 Gift +₱0.02");
  save();
};

// Leaderboard
db.ref("users").on("value",s=>{
  const arr=[];
  s.forEach(c=>arr.push(c.val()));
  arr.sort((a,b)=>b.balance-a.balance);
  $("leaderboard").innerHTML=
    arr.slice(0,10).map(u=>`<li>₱${u.balance.toFixed(2)}</li>`).join("");
});
