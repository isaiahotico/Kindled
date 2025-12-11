// Global user & boss state
let user = {coins:0, hasWatchedVideo:true, withdrawCode:"1234", withdrawVideoLink:"", adsWatched:0};
let boss = {maxHP:50000, currentHP:50000};

// NAVIGATION
function navigate(pageId){document.querySelectorAll('.page').forEach(p=>p.style.display='none');document.getElementById(pageId).style.display='block';}
function backHome(){navigate('homePage');}

// TRIGGERS
function openSpin(){navigate('spinPage');}
function openProfile(){navigate('profilePage');}
function openSettings(){navigate('settingsPage');}
function openEvent(){navigate('eventPage');}

// WITHDRAWAL
function processWithdrawal(){
  const codeInput=document.getElementById('withdrawCode').value;
  if(!user.hasWatchedVideo){alert('Watch video first!'); return;}
  if(codeInput!==user.withdrawCode){alert('Incorrect code'); return;}
  let amount=user.coins; if(amount<500){alert('Minimum 500 coins required'); return;} if(amount>10000) amount=10000;
  user.coins-=amount; updateCoinsDisplay(); alert(`Withdrawal of ${amount} coins processed!`);
}

// ADMIN
function verifyAdminPassword(){
  if(document.getElementById('adminPassword').value==='siditsnicheahit'){renderAdminTable();}
  else alert('Incorrect password');
}
function verifyLinkPassword(){
  if(document.getElementById('adminLinkPassword').value==='Propetas6'){document.getElementById('linkInputs').style.display='block';}
  else alert('Incorrect password');
}
function saveLinkAndCode(){
  user.withdrawVideoLink=document.getElementById('youtubeLink').value;
  user.withdrawCode=document.getElementById('secretCode').value;
  alert('Video link & code saved');
}
function renderAdminTable(){
  const tbl=document.getElementById('withdrawalTable'); tbl.innerHTML='<tr><th>#</th><th>User</th><th>Coins</th><th>Status</th><th>Time</th></tr>';
  for(let i=0;i<10;i++){tbl.innerHTML+=`<tr><td>${i+1}</td><td>User${i+1}</td><td>${500+i*100}</td><td>Processing</td><td>${new Date().toLocaleTimeString()}</td></tr>`;}
}

// ADS
function watchAd(adNumber){
  if(adNumber===1||adNumber===2){show_10276123('pop').then(()=>{user.coins+=1; user.adsWatched++; updateCoinsDisplay(); hitBoss(1); alert('1 coin earned!');}).catch(e=>console.log(e));}
  else {show_10276123({type:'inApp', inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}}).then(()=>console.log('Ad done'));}
}
function installPWA(){alert('Trigger PWA installation');}

// UPDATE DISPLAYS
function updateCoinsDisplay(){const el=document.getElementById('userCoins'); if(el) el.innerText=user.coins;}
function hitBoss(damage){boss.currentHP-=damage; if(boss.currentHP<0) boss.currentHP=0; const bar=document.getElementById('bossBar'); if(bar){bar.style.width=(boss.currentHP/boss.maxHP*100)+'%'; bar.innerText=boss.currentHP+' HP';}}
