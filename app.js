// 🔥 Firebase
firebase.initializeApp({
  /* YOUR FIREBASE CONFIG */
});
const db = firebase.database();

// Telegram account separation
const telegramId =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id
  || "guest_" + Math.random().toString(36).slice(2);

// Helpers
const $ = id => document.getElementById(id);
const now = ()=>Date.now();

// Balance
let balance = Number(localStorage.getItem(telegramId+"_bal")||0);
$("balance").innerText = balance.toFixed(3);

// Popup
function popup(msg){
  const p=$("popup");
  p.innerText=msg;
  p.style.opacity=1;
  setTimeout(()=>p.style.opacity=0,2000);
}

// 🔥 Monetag Revenue-Optimized Rotation
async function showOptimizedAd(){
  const rotation = [
    ()=>show_10276123(),          // Rewarded interstitial
    ()=>show_10276123('pop'),     // Rewarded popup
    ()=>show_10276123({           // In-app fallback
      type:'inApp',
      inAppSettings:{
        frequency:1,
        capping:0.1,
        interval:20,
        timeout:5,
        everyPage:false
      }
    })
  ];

  for(let fn of rotation){
    try{
      await new Promise(res=>{
        let done=false;
        const finish=()=>{if(!done){done=true;res()}};
        const p=fn();
        if(p?.then) p.then(finish).catch(finish);
        else finish();
        setTimeout(finish,7000);
      });
      return true;
    }catch(e){}
  }
  return true; // Never block reward
}

// Save user
function save(){
  localStorage.setItem(telegramId+"_bal",balance);
  db.ref("users/"+telegramId).set({balance});
  $("balance").innerText = balance.toFixed(3);
}

// Reward logic
function randomReward(){
  const r=Math.random();
  if(r<0.30) return 0.025;
  if(r<0.60) return 0.030;
  if(r<0.85) return 0.035;
  return 0.040;
}

// MAIN ADS (4–5 ads, 1 reward)
$("adsBtn").onclick=async()=>{
  let ads=4+Math.floor(Math.random()*2);
  for(let i=ads;i>0;i--){
    popup("Ads left: "+(i-1));
    await showOptimizedAd();
  }
  const reward=randomReward();
  balance+=reward;
  popup("🎉 You earned ₱"+reward.toFixed(3));
  save();
};

// DAILY LOGIN
const DAILY=30*60*1000;
$("dailyBtn").onclick=async()=>{
  const last=Number(localStorage.getItem(telegramId+"_daily")||0);
  if(now()-last<DAILY) return;
  await showOptimizedAd();
  balance+=0.04;
  localStorage.setItem(telegramId+"_daily",now());
  popup("🎁 Daily +₱0.04");
  save();
};

// GIFT
const GIFT=60*60*1000;
$("giftBtn").onclick=async()=>{
  const last=Number(localStorage.getItem(telegramId+"_gift")||0);
  if(now()-last<GIFT) return;
  await showOptimizedAd();
  balance+=0.02;
  localStorage.setItem(telegramId+"_gift",now());
  popup("🎉 Gift +₱0.02");
  save();
};

// Withdraw
$("withdrawBtn").onclick=()=>{
  if(balance<1) return alert("Minimum ₱1");
  db.ref("withdraw").push({
    user:telegramId,
    gcash:$("gcash").value,
    amount:balance
  });
  balance=0;
  save();
};

// Leaderboard
db.ref("users").on("value",s=>{
  const list=[];
  s.forEach(c=>list.push(c.val()));
  list.sort((a,b)=>b.balance-a.balance);
  $("leaderboard").innerHTML=list.slice(0,10)
    .map(u=>`<li>₱${u.balance.toFixed(2)}</li>`).join("");
});

// Owner panel
$("ownerBtn").onclick=()=>{
  if($("ownerPass").value!=="Propetas6") return;
  $("ownerPanel").style.display="block";
  db.ref("withdraw").on("value",s=>{
    $("withdrawList").innerHTML="";
    s.forEach(c=>{
      const v=c.val();
      $("withdrawList").innerHTML+=
        `<li>${v.user} ₱${v.amount}</li>`;
    });
  });
};

// Email withdrawals
$("emailWithdrawals").onclick=()=>{
  db.ref("withdraw").once("value").then(s=>{
    let body="";
    s.forEach(c=>{
      const v=c.val();
      body+=`User:${v.user}\nGCash:${v.gcash}\nAmount:${v.amount}\n\n`;
    });
    location.href=
      "mailto:Otico.isai2@gmail.com?subject=Withdrawals&body="+
      encodeURIComponent(body);
  });
};

// Time & quotes
setInterval(()=>$("time").innerText=new Date().toLocaleString(),1000);
const quotes=[
  "Consistency builds wealth",
  "Focus creates results",
  "Small actions compound",
  "Progress beats perfection",
  "Discipline pays dividends"
];
setInterval(()=>$("quote").innerText=
  quotes[Math.floor(Math.random()*quotes.length)],8000);
