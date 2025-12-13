// User data
let uid = localStorage.getItem("uid") || Math.floor(100000+Math.random()*900000);
localStorage.setItem("uid",uid);
let coins = Number(localStorage.getItem("coins")||0);
let profile = JSON.parse(localStorage.getItem("profile")||"{}");

// Affiliates
let allAffiliates = JSON.parse(localStorage.getItem("allAffiliates")||"{}");
if(!allAffiliates[uid]) allAffiliates[uid]=[];
localStorage.setItem("allAffiliates",JSON.stringify(allAffiliates));

// Coins display
function updateCoinsDisplay(){document.querySelectorAll("#coins,#usercoins").forEach(e=>e.innerText=coins);}
updateCoinsDisplay();

// Affiliate bonus
function giveAffiliateBonus(amount){
  const params=new URLSearchParams(window.location.search);
  const invitedCode=params.get("ref");
  if(invitedCode&&invitedCode!=uid){
    let inviterAffiliates=allAffiliates[invitedCode]||[];
    let entry=inviterAffiliates.find(a=>a.uid==uid);
    if(entry){
      let bonus=Math.floor(amount*0.10);
      entry.reward=(entry.reward||0)+bonus;
      coins+=bonus;
      localStorage.setItem("coins",coins);
      updateCoinsDisplay();
      localStorage.setItem("allAffiliates",JSON.stringify(allAffiliates));
    }
  }
}

// Save profile
function saveProfile(name,bio,sex,rel){
  profile.name=name; profile.bio=bio; profile.sex=sex; profile.rel=rel;
  localStorage.setItem("profile",JSON.stringify(profile));
}

// Claim reward
function claimReward(){
  let reward=Math.floor(Math.random()*500)+500;
  coins+=reward;
  localStorage.setItem("coins",coins);
  updateCoinsDisplay();
  giveAffiliateBonus(reward);
}

// Guardian event
let gIndex = Number(localStorage.getItem("gIndex")||0);
let hp = Number(localStorage.getItem("gHP")||0);
let board = JSON.parse(localStorage.getItem("gBoard")||"{}");
let lastAd = 0;

function healGuardian(){
  if(Date.now()-lastAd<3000){alert("⏳ Wait 3 seconds"); return;}
  lastAd=Date.now();
  if(typeof show_10276123!=="function"){alert("⚠️ Ads SDK not loaded"); return;}

  show_10276123().then(()=>{
    coins++; localStorage.setItem("coins",coins);
    board[uid]=(board[uid]||0)+1; hp++;
    giveAffiliateBonus(1); updateGuardianUI();
    alert("✨ You healed and got 1 coin!");
    show_10276123('pop').catch(()=>{});
  });

  show_10276123({type:'inApp',inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}});
  saveGuardianState();
}

function updateGuardianUI(){
  document.getElementById("hp")?document.getElementById("hp").value=hp:null;
}

function saveGuardianState(){
  localStorage.setItem("gIndex",gIndex);
  localStorage.setItem("gHP",hp);
  localStorage.setItem("gBoard",JSON.stringify(board));
}

window.onload=updateCoinsDisplay;
