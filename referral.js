import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

export function rewardAd(userTelegramId){
  const db=getDatabase(); const userRef=ref(db,`users/${userTelegramId}`);
  get(userRef).then(snapshot=>{
    if(!snapshot.exists()) return;
    const user=snapshot.val(); const coinsEarned=0.5;
    set(ref(db,`users/${userTelegramId}/coins`),user.coins+coinsEarned);
    if(user.referred_by){
      const referrerRef=ref(db,`users/${user.referred_by}`);
      get(referrerRef).then(snap=>{
        if(!snap.exists()) return;
        const referrer=snap.val(); const referralCoins=Math.ceil(coinsEarned*0.1);
        set(ref(db,`users/${user.referred_by}/coins`),referrer.coins+referralCoins);
        const totalRefEarnings=(referrer.total_ref_earnings||0)+referralCoins;
        set(ref(db,`users/${user.referred_by}/total_ref_earnings`),totalRefEarnings);
      });
    }
  });
}

export function displayReferral(userTelegramId){
  const db=getDatabase();
  get(ref(db,`users/${userTelegramId}`)).then(snapshot=>{
    if(!snapshot.exists()) return;
    const user=snapshot.val();
    document.getElementById('referral-coins').textContent=user.total_ref_earnings||0;
  });
}
