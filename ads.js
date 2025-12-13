export function initAds(userTelegramId){
  const script=document.createElement('script');
  script.src='//libtl.com/sdk.js';
  script.setAttribute('data-zone','10276123');
  script.setAttribute('data-sdk','show_10276123');
  document.head.appendChild(script);
  window.showAdAndReward=function(){
    show_10276123().then(()=>{
      import('./referral.js').then(mod=>mod.rewardAd(userTelegramId));
      alert('You earned 0.5 coin!');
    }).catch(console.error);
  };
  document.getElementById('watch-ad')?.addEventListener('click',()=>window.showAdAndReward());
}
