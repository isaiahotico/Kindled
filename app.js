// ------------------ Per-user Data ------------------
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
        watchedYT: false
    };
    return data;
}

function saveUserData(data) {
    const uid = getCurrentUserId();
    localStorage.setItem("user_" + uid, JSON.stringify(data));
}

let userData = loadUserData();

// ------------------ UI Update ------------------
function updateUI() {
    document.getElementById("points").textContent = userData.points;
    document.getElementById("phpValue").textContent = (userData.points * 0.001).toFixed(3);
}
updateUI();

// ------------------ Ad Simulation ------------------
document.getElementById("watchAd").addEventListener("click", () => {
    let timer = 15;
    const output = document.getElementById("output");
    output.innerHTML = `Ad playing... ${timer}s`;

    const interval = setInterval(() => {
        timer--;
        output.innerHTML = `Ad playing... ${timer}s`;

        if (timer <= 0) {
            clearInterval(interval);
            userData.points += 1;
            userData.history.push({type:"ad",msg:"+1 point from ad",time:Date.now()});
            saveUserData(userData);
            updateUI();
            output.innerHTML = "Ad finished! (+1 point)";
        }
    }, 1000);
});

// ------------------ Withdraw Panel ------------------
const youtubeFrame = document.getElementById("youtubeVideo");
let ytVideoURL = localStorage.getItem("ytVideoURL") || "";
let withdrawCodeSet = localStorage.getItem("withdrawCode") || "";

document.getElementById("withdrawBtn").addEventListener("click", () => {
    document.getElementById("withdrawPanel").classList.remove("hidden");
    if (ytVideoURL) youtubeFrame.src = ytVideoURL;
});

youtubeFrame.addEventListener("ended", () => {
    userData.watchedYT = true;
    saveUserData(userData);
    document.getElementById("youtubeMsg").innerText = "✅ Video watched! Enter code to withdraw";
});

// Submit Withdrawal
document.getElementById("submitWithdraw").addEventListener("click", () => {
    const enteredCode = document.getElementById("withdrawCode").value.trim();
    const gcashNum = document.getElementById("gcashNumber").value.trim();

    if (!userData.watchedYT) return alert("Watch the full video first!");
    if (!gcashNum) return alert("Enter GCash number");
    if (enteredCode !== withdrawCodeSet) return alert("Incorrect withdrawal code!");

    const amountPHP = (userData.points * 0.001).toFixed(3);
    userData.pendingWithdrawals.push({number:gcashNum,amount:amountPHP,points:userData.points,status:"PENDING",time:Date.now()});
    userData.points = 0;
    userData.watchedYT = false;
    saveUserData(userData);
    updateUI();
    alert("Withdrawal submitted and now pending!");
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

    // Pending Withdrawals (from all users)
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

    // Approved Logs
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

// Approve Owner Withdrawal
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

// Set YouTube URL
document.getElementById("saveYTLink").addEventListener("click",()=>{
    ytVideoURL = document.getElementById("setYTLink").value.trim();
    localStorage.setItem("ytVideoURL",ytVideoURL);
    alert("YouTube URL saved!");
});

// Set withdrawal code
document.getElementById("saveWithdrawCode").addEventListener("click",()=>{
    withdrawCodeSet = document.getElementById("setWithdrawCode").value.trim();
    localStorage.setItem("withdrawCode",withdrawCodeSet);
    alert("Withdrawal code saved!");
});
