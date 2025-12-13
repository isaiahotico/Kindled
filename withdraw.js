import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.getElementById('withdraw-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const userTelegramId='<USER_TELEGRAM_ID>';
  const coinsToWithdraw=Number(document.getElementById('withdraw-amount').value);
  const method=document.getElementById('withdraw-method').value;
  const db=getDatabase(); const userRef=ref(db,`users/${userTelegramId}`);
  get(userRef).then(snapshot=>{
    if(!snapshot.exists()) return alert('User not found');
    const user=snapshot.val();
    if(coinsToWithdraw<500 || coinsToWithdraw>user.coins) return alert('Invalid withdrawal amount');
    const peso=coinsToWithdraw*0.03; const usdt=coinsToWithdraw*0.00051;
    set(ref(db,`users/${userTelegramId}/coins`),user.coins-coinsToWithdraw);
    const withdrawalsRef=ref(db,`users/${userTelegramId}/withdrawals`);
    get(withdrawalsRef).then(snap=>{
      const current=snap.exists()?snap.val():[];
      current.push({amount:coinsToWithdraw,peso,usdt,method,status:'pending',timestamp:Date.now()});
      set(withdrawalsRef,current);
    });
    alert(`Withdrawal submitted: ${peso} PHP (${usdt} USDT)`);
  });
});
