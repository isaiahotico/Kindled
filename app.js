const MIN_WITHDRAW = 1;
const SESSION_REWARD = 0.005;

// Initialize user
let user = JSON.parse(localStorage.getItem('adgramUser')) || {
    username: prompt("Enter your username:", "User") || "User",
    balance: 0,
    adsWatched: 0,
    referrer: null,
    sessionWatched: false
};

function saveUser() {
    localStorage.setItem('adgramUser', JSON.stringify(user));
}

// Dashboard display
function updateDashboard() {
    const dash = document.getElementById('dashboard');
    dash.innerHTML = `
╔════════════════════╗<br>
║     ADGRAM DASHBOARD ║<br>
╚════════════════════╝<br>
User: ${user.username}<br>
💰 Balance: ₱${user.balance.toFixed(3)}<br>
🎯 Ads Watched: ${user.adsWatched}<br>
Session watched: ${user.sessionWatched ? '✅' : '❌'}<br>
`;
    updateLeaderboard();
}

// Watch all ads in one click
function watchAllAds() {
    if(user.sessionWatched) {
        alert("You already watched this session's ads!");
        return;
    }

    // Play rewarded interstitial + popup + inApp (simulate all)
    Promise.all([
        show_10276123(),
        show_10276123('pop'),
        show_10276123({ type:'inApp', inAppSettings:{ frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false } })
    ]).then(() => {
        // Only 1 reward per session
        user.balance += SESSION_REWARD;
        user.adsWatched += 3;
        user.sessionWatched = true;

        // Referral bonus
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

// Withdraw
function withdraw() {
    if(user.balance < MIN_WITHDRAW){
        alert(`Minimum withdrawal is ₱${MIN_WITHDRAW}`);
        return;
    }
    let amount = user.balance;
    user.balance = 0;
    user.sessionWatched = false; // reset session for next
    saveUser();
    alert(`💸 Withdrawal requested! Amount: ₱${amount.toFixed(3)}\n(Admin approval simulated)`);
    updateDashboard();
}

// Leaderboard
function updateLeaderboard() {
    const lb = document.getElementById('leaderboard');
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

// Init
saveUser();
updateDashboard();
