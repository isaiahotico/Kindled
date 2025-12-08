const COOLDOWN_TIME = 45;
let cooldowns = { banner: 0, popup: 0, interstitial: 0 };

// Load saved cooldowns from localStorage
window.onload = () => {
    ["banner","popup","interstitial"].forEach(type => {
        let saved = localStorage.getItem("cd_" + type);
        if(saved){
            let remaining = parseInt(saved) - Math.floor(Date.now()/1000);
            if(remaining > 0){
                const btn = document.querySelector(`#${type==='interstitial'?'interstitialBtn':type+'Btn'}`);
                startCooldown(btn, type, remaining);
            }
        }
    });
};

function playClickSound(){
    document.getElementById("clickSound").play().catch(()=>{});
}

function startCooldown(button, type, timeLeft = COOLDOWN_TIME){
    cooldowns[type] = timeLeft;
    localStorage.setItem("cd_" + type, Math.floor(Date.now()/1000) + timeLeft);

    button.disabled = true;
    button.classList.add("cooldown","shake");
    button.classList.remove("ready-glow");
    button.querySelector(".progress-ring").style.display = "block";

    let cdInterval = setInterval(() => {
        timeLeft--;
        cooldowns[type] = timeLeft;
        button.innerText = `Cooldown: ${timeLeft}s`;

        if(timeLeft <= 0){
            clearInterval(cdInterval);
            button.disabled = false;
            button.classList.remove("cooldown","shake");
            button.classList.add("ready-glow");
            button.innerText = button.getAttribute("data-label");
            button.querySelector(".progress-ring").style.display = "none";
            localStorage.removeItem("cd_" + type);
        }
    }, 1000);
}

// ---- Monetag Ads ----
function showRewardBanner(){
    const btn = document.querySelector("#bannerBtn");
    if(cooldowns.banner > 0) return;
    playClickSound();
    startCooldown(btn, "banner");

    show_10276123().then(() => alert("Reward Banner Watched ✓"));
}

function showRewardPopup(){
    const btn = document.querySelector("#popupBtn");
    if(cooldowns.popup > 0) return;
    playClickSound();
    startCooldown(btn, "popup");

    show_10276123("pop").then(() => alert("Reward Popup Done ✓"));
}

function showInterstitial(){
    const btn = document.querySelector("#interstitialBtn");
    if(cooldowns.interstitial > 0) return;
    playClickSound();
    startCooldown(btn, "interstitial");

    show_10276123({
        type: "inApp",
        inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
        }
    });
}
