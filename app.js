// =====================
// USER DATA INIT
// =====================
let uid = localStorage.getItem("uid") || Math.floor(100000 + Math.random() * 900000);
localStorage.setItem("uid", uid);

let coins = Number(localStorage.getItem("coins") || 0);
let profile = JSON.parse(localStorage.getItem("profile") || "{}");

// Affiliate system
let allAffiliates = JSON.parse(localStorage.getItem("allAffiliates") || "{}");
if(!allAffiliates[uid]) allAffiliates[uid] = [];
localStorage.setItem("allAffiliates", JSON.stringify(allAffiliates));

// =====================
// COINS AND UI UPDATE
// =====================
function updateCoinsDisplay(){
  document.querySelectorAll("#coins, #usercoins").forEach(e=>e.innerText = coins);
}
updateCoinsDisplay();

// =====================
// AFFILIATE BONUS
// =====================
function giveAffiliateBonus(amount){
  // give 10% bonus to inviter if exists
  const urlParams = new URLSearchParams(window.location.search);
  const invitedCode = urlParams.get("ref");
  if(invitedCode && invitedCode != uid){
    // find inviter
    let inviterAffiliates = allAffiliates[invitedCode] || [];
    let affiliateEntry = inviterAffiliates.find(a => a.uid === uid);
    if(affiliateEntry){
      let bonus = Math.floor(amount * 0.10);
      affiliateEntry.reward = (affiliateEntry.reward || 0) + bonus;
      coins += bonus; // give bonus to inviter if logged in
      localStorage.setItem("coins", coins);
      updateCoinsDisplay();
      localStorage.setItem("allAffiliates", JSON.stringify(allAffiliates));
      console.log(`💰 Affiliate bonus ${bonus} coins given to ${invitedCode}`);
    }
  }
}

// =====================
// PROFILE SAVE
// =====================
function saveProfile(name, bio, sex, rel){
  profile.name = name;
  profile.bio = bio;
  profile.sex = sex;
  profile.rel = rel;
  localStorage.setItem("profile", JSON.stringify(profile));
  console.log("✅ Profile saved");
}

// =====================
// CLAIM REWARD
// =====================
function claimReward(){
  let reward = Math.floor(Math.random() * 500) + 500; // 500-1000 coins
  coins += reward;
  localStorage.setItem("coins", coins);
  updateCoinsDisplay();
  giveAffiliateBonus(reward);
  alert(`🎉 You claimed ${reward} coins!`);
}

// =====================
// GUARDIAN EVENT
// =====================
let gIndex = Number(localStorage.getItem("gIndex") || 0);
let hp = Number(localStorage.getItem("gHP") || 0);
let board = JSON.parse(localStorage.getItem("gBoard") || "{}");

// Heal function with ad reward
let lastAd = 0;
function healGuardian(){
  if(Date.now() - lastAd < 3000){
    alert("⏳ Wait 3 seconds before next ad");
    return;
  }
  lastAd = Date.now();

  if(typeof show_10276123 !== "function"){
    alert("⚠️ Ads SDK not loaded");
    return;
  }

  // Rewarded interstitial ad
  show_10276123().then(() => {
    coins++; 
    localStorage.setItem("coins", coins);
    board[uid] = (board[uid] || 0) + 1;
    hp++;
    giveAffiliateBonus(1);
    updateGuardianUI();
    alert("✨ You healed the guardian and received 1 coin!");

    // Rewarded popup
    show_10276123('pop').catch(()=>{});
  });

  // Background inApp ad
  show_10276123({
    type: 'inApp',
    inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}
  });

  saveGuardianState();
}

// Update Guardian UI
function updateGuardianUI(){
  const guardian = guardians[gIndex];
  if(document.getElementById("gname")) document.getElementById("gname").innerText = `${guardian.name} – ${guardian.maxHP} HP`;
  if(document.getElementById("glore")) document.getElementById("glore").innerText = guardian.lore;
  if(document.getElementById("hp")) document.getElementById("hp").value = hp;
  if(document.getElementById("board")){
    let tbody = document.getElementById("board");
    tbody.innerHTML = "";
    Object.entries(board).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([user, points])=>{
      let li = document.createElement("li");
      li.innerText = `${user}: ${points} HP`;
      tbody.appendChild(li);
    });
  }
}

// Rotate guardian
function rotateGuardian(){
  gIndex = (gIndex + 1) % guardians.length;
  hp = 0;
  board = {};
  saveGuardianState();
  updateGuardianUI();
}

// Save guardian state
function saveGuardianState(){
  localStorage.setItem("gIndex", gIndex);
  localStorage.setItem("gHP", hp);
  localStorage.setItem("gBoard", JSON.stringify(board));
}

// Auto update on page load
window.onload = function(){
  updateCoinsDisplay();
  updateGuardianUI();
}
