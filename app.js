// =======================
// Preload Ads
// =======================
let monetagReady = false;

// Preload function for faster ad display
async function preloadAds() {
  try {
    await show_10276123('preload'); // Preload ad
    monetagReady = true;
    console.log("Monetag ads preloaded");
  } catch(e) {
    console.warn("Ad preload failed", e);
    monetagReady = false;
  }
}
preloadAds();

// =======================
// Watch Ads (Sequential)
// =======================
async function rewardAds(){
  if(adsCount<4){
    adsCount++;
    
    // Wait for ad to show
    try{
      if(!monetagReady) await preloadAds();
      await show_10276123();
      monetagReady = false; // need to preload next
      preloadAds(); // preload next ad in background

      if(adsCount===4){
        balance += 0.025;
        adsCount = 0;
        await updateDoc(userRef, {balance});
        alert("🎉 You earned ₱0.025!");
      } else {
        alert(`You earn a reward, click again. Ads left: ${4-adsCount}`);
      }
      updateUI();
    }catch(e){
      alert("Ad failed, please try again.");
      adsCount--;
    }
  }
}

// =======================
// Gifts (Sequential with Countdown)
// =======================
function rewardGifts() {
  if(giftsCooldown) return alert("Cooldown active. Wait 5 minutes.");
  let adCount = 0;

  async function playNextGiftAd(){
    if(adCount >=4){
      balance += 0.03;
      giftsCount = 0;
      giftsCooldown = true;
      await updateDoc(userRef, {balance});
      alert("🎁 You earned ₱0.03! Cooldown 5 minutes starts.");
      updateUI();

      // 5 minutes countdown
      let sec=300;
      const interval = setInterval(()=>{
        document.getElementById("giftsCooldown").innerText = "Cooldown: " + sec + "s";
        sec--;
        if(sec<0){ clearInterval(interval); giftsCooldown=false; document.getElementById("giftsCooldown").innerText=""; }
      },1000);
      return;
    }

    try{
      if(!monetagReady) await preloadAds();
      await show_10276123('pop');
      await show_10276123();
      monetagReady = false;
      preloadAds(); // preload next ad
      adCount++;
      document.getElementById("giftsProgress").innerText = `Ads left: ${4 - adCount}`;
      playNextGiftAd();
    }catch(e){
      alert("Ad failed, try again.");
    }
  }

  playNextGiftAd();
}

// =======================
// World Chat (Sequential 2 ads per message)
// =======================
window.sendChat = async function(){
  const text = document.getElementById('chatInput').value.trim();
  if(!text) return;
  if(lock) return alert("Wait for ads to finish...");
  lock = true;

  let adCount = 0;

  async function playNextAd(){
    if(adCount >= 2){
      await addBalance(0.015);
      await addDoc(chatCol, {username, message:text, timestamp:Date.now()});
      document.getElementById('chatInput').value='';
      alert("Message sent and rewards added: ₱0.015");
      lock=false;
      return;
    }

    try{
      if(!monetagReady) await preloadAds();
      await show_10276123('pop');
      await show_10276123();
      monetagReady = false;
      preloadAds(); // preload next
      adCount++;
      playNextAd();
    }catch(e){
      lock=false;
      alert("Ad failed, try again");
    }
  }

  playNextAd();
}
