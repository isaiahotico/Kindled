console.log('Ads app loaded');
// NOTE: Firebase config must be added here for leaderboard & withdrawals
document.getElementById('btnAllAds').onclick = async ()=>{
  let ads = 4 + Math.floor(Math.random()*2);
  for(let i=ads;i>0;i--){
    await show_10276123();
    alert('Ads left: '+(i-1));
  }
  alert('🎉 You earned reward!');
};
