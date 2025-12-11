// ------------------ User Data ------------------
function getCurrentUserId() {
    let uid = localStorage.getItem("user_unique_id");
    if (!uid) {
        uid = "uid_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("user_unique_id", uid);
    }
    return uid;
}

function loadUserData() {
    const uid = getCurrentUserId();
    const data = JSON.parse(localStorage.getItem("user_" + uid)) || {
        points: 0,
        history: [],
        pendingWithdrawals: [],
        approvedWithdrawals: [],
        watchedYT: false,
        referralCode: "REF-" + Math.random().toString(36).substring(2,6).toUpperCase(),
        affiliateBalance: 0,
        referredBy: null
    };
    return data;
}

function saveUserData(data) {
    const uid = getCurrentUserId();
    localStorage.setItem("user_" + uid, JSON.stringify(data));
}

let userData = loadUserData();

// Display referral code
document.getElementById("myReferral").textContent = userData.referralCode;

// Ask for referral code if new user
if(!userData.referredBy){
    const code = prompt("Enter referral code if you have one (optional):");
    if(code){
        userData.referredBy = code.trim().toUpperCase();
        saveUserData(userData);
    }
}

// ------------------ UI Update ------------------
function updateUI() {
    document.getElementById("points").textContent = userData.points;
    document.getElementById("phpValue").textContent = (userData.points * 0.0012).toFixed(4);
}
updateUI();

// ------------------ Ad Functions ------------------
async function rewardAd(type, mode="") {
    try {
        await (mode === 'pop' ? show_10276123('pop') : show_10276123());
        userData.points += 1;
        userData.history.push({type:type,msg:`+1 point from ${type}`,time:Date.now()});
        saveUserData(userData);
        updateUI();
    } catch(e){ console.log(e); }
}

async function watchAd1() { return rewardAd("ad1"); }
async function watchAd2() { return rewardAd("ad2"); }
async function watchAd3() { return rewardAd("ad3"); }
async function watchAd4() { return rewardAd("ad4", 'pop'); }

// ------------------ Auto-play Sequence ------------------
async function autoPlayAds() {
    const adFuncs = [watchAd1, watchAd2, watchAd3, watchAd4];
    for (let f of adFuncs){
        await f();
        await new Promise(r => setTimeout(r,2000)); // delay between ads
    }
    alert("Auto-play complete! Points awarded.");
}

// ------------------ Button Listeners ------------------
document.getElementById("adBtn1").addEventListener("click", autoPlayAds);
document.getElementById("adBtn2").addEventListener("click", watchAd2);
document.getElementById("adBtn3").addEventListener("click", watchAd3);
document.getElementById("adBtn4").addEventListener("click", watchAd4);

// ------------------ Withdraw Panel ------------------
const youtubeFrame = document.getElementById("youtubeVideo");
let ytVideoURL = localStorage.getItem("ytVideoURL") || "";
let withdrawCodeSet = localStorage.getItem("withdrawCode") || "";

document.getElementById("withdrawBtn").addEventListener("click", () => {
    document.getElementById("withdrawPanel").classList.remove("hidden");
    if(ytVideoURL) youtubeFrame.src = ytVideoURL;
});

youtubeFrame.addEventListener("ended", () => {
    userData.watchedYT = true;
    saveUserData(userData);
    document.getElementById("youtubeMsg").innerText = "✅ Video watched! Enter code to withdraw";
});

document.getElementById("submitWithdraw").addEventListener("click", () => {
    const code = document.getElementById("withdrawCode").value.trim();
    const gcash = document.getElementById("gcashNumber").value.trim();

    if(!userData.watchedYT) return alert("Watch full video first!");
    if(!gcash) return alert("Enter GCash number");
    if(code !== withdrawCodeSet) return alert("Incorrect withdrawal code!");

    const amountPHP = (userData.points * 0.0012).toFixed(4);

    // Pay affiliate 10% to referrer
    if(userData.referredBy){
        const allUsers = Object.keys(localStorage).filter(k=>k.startsWith("user_"));
        for(let key of allUsers){
            let u = JSON.parse(localStorage.getItem(key));
            if(u.referralCode === userData.referredBy){
                u.affiliateBalance = (parseFloat(u.affiliateBalance) + userData.points * 0.1).toFixed(2);
                localStorage.setItem(key, JSON.stringify(u));
                break;
            }
        }
    }

    userData.pendingWithdrawals.push({number:gcash,amount:amountPHP,points:userData.points,status:"PENDING",time:Date.now()});
    userData.points = 0;
    userData.watchedYT = false;
    saveUserData(userData);
    updateUI();
    alert("Withdrawal submitted and now pending!");
});

// ------------------ Claim Affiliate Balance ------------------
document.getElementById("claimAffiliateBtn")?.addEventListener("click", ()=>{
    if(userData.affiliateBalance > 0){
        userData.points += parseFloat(userData.affiliateBalance);
        userData.history.push({type:"affiliate",msg:`+${userData.affiliateBalance} points from referrals`,time:Date.now()});
        userData.affiliateBalance = 0;
        saveUserData(userData);
        updateUI();
        alert("Affiliate points added to your balance!");
    } else alert("No affiliate points to claim yet.");
});

// ------------------ History Panel ------------------
document.getElementById("historyBtn").addEventListener("click", () => {
    const panel = document.getElementById("historyPanel");
    const log = document.getElementById("historyLog");

    log.innerHTML = userData.history.map(h =>
        `<p>• ${h.msg}<br><small>${new Date(h.time).toLocaleString()}</small></p>`
    ).join("");

    panel.classList.remove("hidden");
});

// Close Panels
document.querySelectorAll(".closePanel").forEach(btn => {
    btn.onclick = () => document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
});

// ------------------ Owner Control ------------------
const ownerControlBtn = document.getElementById("ownerControlBtn");
ownerControlBtn.addEventListener("click", () => {
    const password = prompt("Enter owner password:");
    if (password !== "Propetas6") return alert("Incorrect password!");
    showOwnerDashboard();
});

function showOwnerDashboard() {
    const panel = document.getElementById("ownerPanel");
    panel.classList.add("opened");

    const pendingList = document.getElementById("pendingList");
    pendingList.innerHTML = userData.pendingWithdrawals.map((w,i)=>
        `<div class="item">
            <p>
                <b>GCash:</b> ${w.number}<br>
                <b>Amount:</b> ₱${w.amount}<br>
                <b>Status:</b> ${w.status}<br>
                <small>Requested: ${new Date(w.time).toLocaleString()}</small>
            </p>
            <button onclick="approveOwner(${i}, this)" class="btn-main">Mark Approved</button>
        </div>`
    ).join("") || "<p>No pending withdrawals</p>";

    const approvedList = document.getElementById("approvedList");
    approvedList.innerHTML = userData.approvedWithdrawals.map(w=>
        `<p>
            <b>GCash:</b> ${w.number} — ₱${w.amount}<br>
            <b>Status:</b> ${w.status}<br>
            <small>Approved: ${w.approvedTime ? new Date(w.approvedTime).toLocaleString() : "-"}</small>
        </p>`
    ).join("") || "<p>No approved withdrawals</p>";

    panel.classList.remove("hidden");
}

window.approveOwner = function(index, btn) {
    const w = userData.pendingWithdrawals[index];
    w.status = "APPROVED";
    w.approvedTime = Date.now();
    userData.approvedWithdrawals.push(w);
    userData.pendingWithdrawals.splice(index,1);
    saveUserData(userData);

    btn.style.background="#333333";
    alert(`Withdrawal for ${w.number} approved!`);
    showOwnerDashboard();
}

// Owner set YouTube & code
document.getElementById("saveYTLink").addEventListener("click",()=>{
    ytVideoURL = document.getElementById("setYTLink").value.trim();
    localStorage.setItem("ytVideoURL",ytVideoURL);
    alert("YouTube URL saved!");
});
document.getElementById("saveWithdrawCode").addEventListener("click",()=>{
    withdrawCodeSet = document.getElementById("setWithdrawCode").value.trim();
    localStorage.setItem("withdrawCode",withdrawCodeSet);
    alert("Withdrawal code saved!");
});
