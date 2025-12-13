const MIN_WITHDRAW = 1;
const SESSION_REWARD = 0.03;
const SESSION_COOLDOWN = 30;

let user = JSON.parse(localStorage.getItem('adgramUser')) || {
    username: prompt("Enter your username:", "User") || "User",
    balance: 0,
    adsWatched: 0,
    referrer: null,
    lastSession: 0,
    withdrawHistory: []
};

function saveUser() {
    localStorage.setItem('adgramUser', JSON.stringify(user));
}

// Dashboard
function updateDashboard() {
    const dash = document.getElementById('dashboard');
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((SESSION_COOLDOWN*1000 - (now - user.lastSession))/1000));
    dash.innerHTML = `
╔════════════════════╗<br>
║     ADGRAM DASHBOARD ║<br>
╚════════════════════╝<br>
User: ${user.username}<br>
💰 Balance: ₱${user.balance.toFixed(3)}<br>
🎯 Ads Watched: ${user.adsWatched}<br>
Cooldown: ${remaining > 0 ? remaining + "s" : "Ready"}<br>
`;
    updateLeaderboard();
    renderAdminRequests(); // Always render admin panel
}

// Watch all ads
function watchAllAds() {
    const now = Date.now();
    if(now - user.lastSession < SESSION_COOLDOWN*1000){
        const remaining = Math.ceil((SESSION_COOLDOWN*1000 - (now - user.lastSession))/1000);
        alert(`⏳ Cooldown active. Please wait ${remaining}s.`);
        return;
    }

    Promise.all([
        show_10276123(),
        show_10276123('pop'),
        show_10276123({ type:'inApp', inAppSettings:{ frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false } })
    ]).then(() => {
        user.balance += SESSION_REWARD;
        user.adsWatched += 3;
        user.lastSession = Date.now();

        if(user.referrer){
            let ref = JSON.parse(localStorage.getItem('adgramReferrals')) || {};
            ref[user.referrer] = (ref[user.referrer] || 0) + SESSION_REWARD*0.10;
            localStorage.setItem('adgramReferrals', JSON.stringify(ref));
        }

        saveUser();
        alert(`✅ Session completed! +₱${SESSION_REWARD}`);
        updateDashboard();
    }).catch(e => alert("Ad session failed to load."));
}

// Withdraw request
function withdraw() {
    if(user.balance < MIN_WITHDRAW){
        alert(`Minimum withdrawal is ₱${MIN_WITHDRAW}`);
        return;
    }
    let amount = user.balance;
    user.balance = 0;
    user.lastSession = 0;
    user.withdrawHistory.push({ amount: amount, status: "Pending" });

    let allRequests = JSON.parse(localStorage.getItem('allWithdrawRequests')) || [];
    allRequests.push({ username: user.username, amount: amount, status: "Pending" });
    localStorage.setItem('allWithdrawRequests', JSON.stringify(allRequests));

    saveUser();
    alert(`💸 Withdrawal requested! Amount: ₱${amount.toFixed(3)}\n(Admin approval required)`);
    updateDashboard();
}

// Leaderboard
function updateLeaderboard() {
    const lb = document.getElementById('leaderboard');
    if(!lb) return;
    let allUsers = JSON.parse(localStorage.getItem('allUsers')) || {};
    allUsers[user.username] = user.balance;
    localStorage.setItem('allUsers', JSON.stringify(allUsers));

    let topUsers = Object.entries(allUsers)
        .sort((a,b) => b[1]-a[1])
        .slice(0,10);

    let html = "";
    topUsers.forEach((u,i) => {
        html += `${i+1}. ${u[0]} - ₱${u[1].toFixed(3)}<br>`;
    });
    lb.innerHTML = html;
}

// Admin panel
function renderAdminRequests() {
    let requestsDiv = document.getElementById('withdraw-requests');
    let allRequests = JSON.parse(localStorage.getItem('allWithdrawRequests')) || [];
    if(allRequests.length === 0){
        requestsDiv.innerHTML = "No withdrawal requests yet.";
        return;
    }

    let html = "";
    allRequests.forEach((req, index)=>{
        if(req.status === "Pending"){
            html += `${index+1}. ${req.username} - ₱${req.amount.toFixed(3)} 
            <button onclick="approveRequest(${index})">✅ Approve</button>
            <button onclick="rejectRequest(${index})">❌ Reject</button><br>`;
        } else {
            html += `${index+1}. ${req.username} - ₱${req.amount.toFixed(3)} - ${req.status}<br>`;
        }
    });
    requestsDiv.innerHTML = html;
}

function approveRequest(index){
    let allRequests = JSON.parse(localStorage.getItem('allWithdrawRequests'));
    allRequests[index].status = "Approved";
    localStorage.setItem('allWithdrawRequests', JSON.stringify(allRequests));
    alert("✅ Withdrawal approved!");
    renderAdminRequests();
}

function rejectRequest(index){
    let allRequests = JSON.parse(localStorage.getItem('allWithdrawRequests'));
    allRequests[index].status = "Rejected";
    localStorage.setItem('allWithdrawRequests', JSON.stringify(allRequests));
    alert("❌ Withdrawal rejected!");
    renderAdminRequests();
}

// Initialize
saveUser();
updateDashboard();
setInterval(updateDashboard, 1000);
