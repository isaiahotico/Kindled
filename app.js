let uid='guest_'+Math.random().toString(36).slice(2);
let balance=parseFloat(localStorage.getItem(uid+'_bal')||0);
let progress=parseInt(localStorage.getItem(uid+'_prog')||0);
const rewards=[0.025,0.03,0.035,0.04];
const ADS_PER_LEVEL=5;
const $=id=>document.getElementById(id);

$('balance').innerText=`₱${balance.toFixed(3)}`;

function popup(val){
 const p=$('rewardPopup');
 p.innerText=`+₱${val.toFixed(3)}`;
 p.style.opacity=1;
 setTimeout(()=>p.style.opacity=0,2000);
}

async function playRandomAd(){
 const ads=[()=>show_10276123(),()=>show_10276123('pop'),()=>show_10276123({type:'inApp',inAppSettings:{frequency:1,interval:20}})];
 await ads[Math.floor(Math.random()*ads.length)]();
}

async function watchAds(count){
 for(let i=0;i<count;i++){
  await playRandomAd();
  await new Promise(r=>setTimeout(r,800));
 }
 const reward=rewards[Math.floor(Math.random()*rewards.length)];
 balance+=reward; progress++;
 localStorage.setItem(uid+'_bal',balance);
 localStorage.setItem(uid+'_prog',progress);
 $('balance').innerText=`₱${balance.toFixed(3)}`;
 popup(reward);
 $('progressFill').style.width=`${(progress%ADS_PER_LEVEL)/ADS_PER_LEVEL*100}%`;
 $('storyLevel').innerText=`Story Level: ${Math.floor(progress/ADS_PER_LEVEL)+1}`;
}

$('btnAllAds').onclick=()=>watchAds(5);
$('dailyLoginBtn').onclick=()=>watchAds(3);
$('giftBtn').onclick=()=>watchAds(1);
