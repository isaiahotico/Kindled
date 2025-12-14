// Open ADS ROOM
function openAdsRoom(){
  window.location.href = "ads-room.html";
}

// Load all inline ads
function loadAllAds(){
  const adsContainer = document.getElementById("adsContainer");
  if(!adsContainer) return;

  adsContainer.innerHTML = "";
  const ADS_COUNT = 4; // change how many ads you want

  for(let i=0;i<ADS_COUNT;i++){
    const ad = document.createElement("div");
    ad.className = "ad-box";
    ad.innerHTML = `<div data-monetag-zone="3136495" style="width:100%;height:250px;"></div>`;
    adsContainer.appendChild(ad);
  }

  // Monetag reload
  if(window.monetag) monetag.reload();
}
