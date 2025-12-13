// Global coins
let coins = Number(localStorage.getItem("coins") || 0);
let uid = localStorage.getItem("uid") || Math.floor(100000+Math.random()*900000);
localStorage.setItem("uid", uid);

// Update coin displays
function update(){
  document.querySelectorAll("#coins, #usercoins").forEach(e => e.innerText = coins);
  if(typeof guardians !== "undefined"){
    document.getElementById("gname") && (document.getElementById("gname").innerText = guardians[gIndex].name + " – 50000 HP");
    document.getElementById("glore") && (document.getElementById("glore").innerText = guardians[gIndex].lore);
    document.getElementById("hp") && (document.getElementById("hp").value = hp);
    let b = document.getElementById("board"); if(b){
      b.innerHTML="";
      Object.entries(board).sort((a,b)=>b[1]-a[1]).slice(0,10)
        .forEach(e => { let li=document.createElement("li"); li.innerText=e[0]+": "+e[1]+" HP"; b.appendChild(li); });
    }
  }
}
update();

// Ad cooldown
let lastAd = 0;
function canAd(){
  let now = Date.now();
  if(now - lastAd < 3000){ alert("⏳ Wait 3 seconds"); return false; }
  lastAd = now; return true;
}

// Setup Heal button
window.onload = () => {
  if(typeof show_10276123 !== "function") return;
  document.getElementById("healBtn")?.addEventListener("click", ()=>{
    if(!canAd()) return;
    show_10276123().then(()=>{
      coins++; localStorage.setItem("coins", coins);
      heal(uid);
      alert("✨ You are Healed too, here is your reward!");
      update();
      show_10276123('pop').catch(()=>{});
    });
  });

  show_10276123({
    type:'inApp',
    inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}
  });
};
