
// ⚠️ WARNING: THIS IS A FRONTEND-ONLY PROOF-OF-CONCEPT.
// ⚠️ IT IS HIGHLY INSECURE FOR ANY REAL-WORLD APPLICATION WITH MONEY/REWARDS.
// ⚠️ ALL DATA AND LOGIC ARE VULNERABLE TO CLIENT-SIDE MANIPULATION.

// 1. Firebase Configuration (REPLACE WITH YOUR OWN CONFIG)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global Variables
let currentUserId = localStorage.getItem('currentUserId') || `user_${Date.now()}`; // Simulate a unique user ID
let currentUserName = localStorage.getItem('currentUserName') || `User${Math.floor(Math.random() * 1000)}`; // Simulate username
let pesoBalance = parseFloat(localStorage.getItem('pesoBalance')) || 0.00;
let freeLinksCount = parseInt(localStorage.getItem('freeLinksCount')) || 5;
let totalLinksSubmitted = parseInt(localStorage.getItem('totalLinksSubmitted')) || 0;
const MAX_FREE_LINKS = 5;
const MAX_TOTAL_LINKS = 20; // Extendable to 100 as per request
const LINK_COST = 5; // Pesos
const REWARD_PER_AD = 0.025;
const VIDEO_REWARD_PER_MINUTE = 0.05; // Example reward
const USDT_PER_PESO = 0.02; // 1 Peso = 0.02 USDT (example conversion)

let player; // YouTube Player instance
let currentVideoId = null;
let playedVideoIds = JSON.parse(localStorage.getItem(`playedVideoIds_${currentUserId}`)) || [];
let videoQueue = [];
let rewardTimerInterval;
let adminLoggedIn = false;

// --- Utility Functions ---
function updateBalance(amount) {
    pesoBalance += amount;
    if (pesoBalance < 0) pesoBalance = 0; // Prevent negative balance
    localStorage.setItem('pesoBalance', pesoBalance.toFixed(2));
    document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(2);
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
}

function updateLocalStorageData() {
    localStorage.setItem('freeLinksCount', freeLinksCount);
    localStorage.setItem('totalLinksSubmitted', totalLinksSubmitted);
    localStorage.setItem(`playedVideoIds_${currentUserId}`, JSON.stringify(playedVideoIds));
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    // Specific logic for each page on show
    if (pageId === 'profilePage') {
        loadUserProfile();
        loadUserLinks();
    } else if (pageId === 'youtubePage') {
        if (!player) createYoutubePlayer();
        loadRandomVideo();
    } else if (pageId === 'linkPage') {
        document.getElementById('freeLinksCount').textContent = freeLinksCount;
        document.getElementById('totalLinksSubmitted').textContent = totalLinksSubmitted;
        document.getElementById('linkSubmissionMessage').textContent = '';
    } else if (pageId === 'withdrawalPage') {
        loadWithdrawalHistory();
    } else if (pageId === 'adminPage') {
        if (adminLoggedIn) loadAdminWithdrawals();
    }
}

// --- Navigation ---
document.querySelectorAll('.nav-button, .home-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const page = event.target.dataset.page;
        if (page === 'home') {
            showPage('profilePage'); // Default home is profile for now
        } else {
            showPage(`${page}Page`);
        }
    });
});

// --- User Profile (Simulated) ---
if (!localStorage.getItem('currentUserId')) {
    localStorage.setItem('currentUserId', currentUserId);
    localStorage.setItem('currentUserName', currentUserName);
    // Initialize user in Firestore if not exists
    db.collection('users').doc(currentUserId).set({
        username: currentUserName,
        telegramId: currentUserId, // Simulating Telegram ID
        balance: pesoBalance,
        freeLinks: freeLinksCount,
        totalLinks: totalLinksSubmitted,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        console.log("Simulated user initialized in Firestore.");
    }).catch(error => {
        console.error("Error initializing user:", error);
    });
}

function loadUserProfile() {
    document.getElementById('telegramUsername').textContent = currentUserName;
    document.getElementById('telegramUserId').textContent = currentUserId;
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
}

// --- YouTube Player API ---
function onYouTubeIframeAPIReady() {
    createYoutubePlayer();
}

function createYoutubePlayer() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '', // Will be set by loadRandomVideo
        playerVars: {
            'playsinline': 1,
            'autoplay': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player ready.');
    loadRandomVideo(); // Load a video once player is ready
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        document.getElementById('playRewardBtn').textContent = 'Playing...';
        document.getElementById('playRewardBtn').disabled = true;
        startRewardTimer();
    } else if (event.data == YT.PlayerState.ENDED) {
        document.getElementById('playRewardBtn').textContent = 'Play for Reward';
        document.getElementById('playRewardBtn').disabled = false;
        clearInterval(rewardTimerInterval);
        document.getElementById('rewardTimer').classList.add('hidden');
        // A video ended, so add it to played list for this user
        if (currentVideoId && !playedVideoIds.includes(currentVideoId)) {
            playedVideoIds.push(currentVideoId);
            updateLocalStorageData();
            // Increment view count for the video globally (insecurely client-side)
            db.collection('youtubeLinks').doc(currentVideoId).update({
                views: firebase.firestore.FieldValue.increment(1)
            }).then(() => {
                console.log('Video view count incremented.');
            }).catch(error => {
                console.error('Error updating video view count:', error);
            });
        }
    } else if (event.data == YT.PlayerState.PAUSED) {
        clearInterval(rewardTimerInterval);
        document.getElementById('rewardTimer').classList.add('hidden');
        document.getElementById('playRewardBtn').textContent = 'Resume for Reward';
        document.getElementById('playRewardBtn').disabled = false;
    }
}

async function loadRandomVideo() {
    document.getElementById('playRewardBtn').textContent = 'Play for Reward';
    document.getElementById('playRewardBtn').disabled = false;
    document.getElementById('rewardTimer').classList.add('hidden');
    clearInterval(rewardTimerInterval);

    if (videoQueue.length === 0) {
        const snapshot = await db.collection('youtubeLinks').get();
        const allLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out videos already played by current user
        videoQueue = allLinks.filter(link => !playedVideoIds.includes(link.id));

        if (videoQueue.length === 0 && allLinks.length > 0) {
            alert("You've watched all available videos! Resetting your played history. Come back for more!");
            playedVideoIds = [];
            updateLocalStorageData();
            videoQueue = allLinks; // If all watched, allow re-watching for demo
        } else if (videoQueue.length === 0 && allLinks.length === 0) {
            document.getElementById('player').innerHTML = '<p>No videos available. Please submit some!</p>';
            document.getElementById('videoTitleDisplay').textContent = '';
            currentVideoId = null;
            return;
        }
    }

    const randomIndex = Math.floor(Math.random() * videoQueue.length);
    const selectedVideo = videoQueue.splice(randomIndex, 1)[0];
    currentVideoId = selectedVideo.id;

    player.loadVideoById(currentVideoId);
    document.getElementById('videoTitleDisplay').textContent = selectedVideo.title || "Untitled Video";
}

document.getElementById('playRewardBtn').addEventListener('click', () => {
    if (player && currentVideoId) {
        player.playVideo();
        // Reward logic is tied to onPlayerStateChange and startRewardTimer
    } else {
        alert('No video loaded. Please click "Next Video" or submit some links!');
    }
});

document.getElementById('nextVideoBtn').addEventListener('click', () => {
    player.stopVideo(); // Stop current video
    loadRandomVideo();
});

function startRewardTimer() {
    let timeLeft = 60; // 1 minute
    document.getElementById('rewardTimer').classList.remove('hidden');
    document.getElementById('timerCountdown').textContent = timeLeft;

    clearInterval(rewardTimerInterval);
    rewardTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timerCountdown').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(rewardTimerInterval);
            document.getElementById('rewardTimer').classList.add('hidden');
            player.pauseVideo(); // Pause after reward duration
            updateBalance(VIDEO_REWARD_PER_MINUTE); // Award reward
            alert(`You earned ${VIDEO_REWARD_PER_MINUTE.toFixed(2)} Peso for watching!`);
            document.getElementById('playRewardBtn').textContent = 'Play for Reward';
            document.getElementById('playRewardBtn').disabled = false;
        }
    }, 1000);
}


// --- Link Room ---
function getYouTubeVideoId(url) {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

document.getElementById('submitLinkBtn').addEventListener('click', async () => {
    const input = document.getElementById('youtubeLinkInput');
    const url = input.value.trim();
    const videoId = getYouTubeVideoId(url);
    const messageDisplay = document.getElementById('linkSubmissionMessage');

    if (!videoId) {
        messageDisplay.textContent = 'Please enter a valid YouTube video URL.';
        messageDisplay.style.color = 'red';
        return;
    }

    if (totalLinksSubmitted >= MAX_TOTAL_LINKS) {
        messageDisplay.textContent = `You have reached the maximum of ${MAX_TOTAL_LINKS} links.`;
        messageDisplay.style.color = 'red';
        return;
    }

    // Check if link already exists
    const existingLink = await db.collection('youtubeLinks').doc(videoId).get();
    if (existingLink.exists) {
        messageDisplay.textContent = 'This YouTube video has already been submitted by someone.';
        messageDisplay.style.color = 'orange';
        return;
    }

    let cost = 0;
    if (freeLinksCount > 0) {
        freeLinksCount--;
        messageDisplay.textContent = 'Link submitted for free!';
        messageDisplay.style.color = 'green';
    } else {
        cost = LINK_COST;
        if (pesoBalance >= cost) {
            updateBalance(-cost);
            messageDisplay.textContent = `Link submitted for ${cost} Peso!`;
            messageDisplay.style.color = 'green';
        } else {
            messageDisplay.textContent = `Insufficient balance. Need ${cost} Peso.`;
            messageDisplay.style.color = 'red';
            return;
        }
    }

    totalLinksSubmitted++;
    updateLocalStorageData();

    // Store link in Firestore (insecurely client-side)
    try {
        await db.collection('youtubeLinks').doc(videoId).set({
            url: url,
            title: `Video Title (ID: ${videoId})`, // In a real app, you'd fetch this from YouTube API
            submittedBy: currentUserId,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0 // Initial view count
        });
        await db.collection('users').doc(currentUserId).update({
            freeLinks: freeLinksCount,
            totalLinks: totalLinksSubmitted
        });
        messageDisplay.textContent += ' Link added to global pool!';
        input.value = '';
        document.getElementById('freeLinksCount').textContent = freeLinksCount;
        document.getElementById('totalLinksSubmitted').textContent = totalLinksSubmitted;
    } catch (error) {
        console.error("Error submitting link:", error);
        messageDisplay.textContent = 'Error submitting link. Please try again.';
        messageDisplay.style.color = 'red';
        // Rollback balance/link count if submission fails
        if (cost > 0) updateBalance(cost);
        if (freeLinksCount < MAX_FREE_LINKS) freeLinksCount++;
        totalLinksSubmitted--;
        updateLocalStorageData();
    }
});

async function loadUserLinks() {
    const tableBody = document.getElementById('userLinksTable').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="3">Loading your links...</td></tr>';
    const snapshot = await db.collection('youtubeLinks')
        .where('submittedBy', '==', currentUserId)
        .orderBy('submittedAt', 'desc')
        .get();
    
    if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="3">No links submitted yet.</td></tr>';
        return;
    }

    let html = '';
    snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><a href="${data.url}" target="_blank">${data.title}</a></td>
                <td>${data.views || 0}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

// Refresh user links and views every 5 minutes (client-side simulation)
setInterval(() => {
    if (!document.getElementById('profilePage').classList.contains('hidden')) {
        loadUserLinks();
    }
}, 5 * 60 * 1000);


// --- Watch Ads Room (Monetag Integration) ---
let adsWatchedCount = 0;
document.getElementById('watchAdsBtn').addEventListener('click', async () => {
    const adsStatus = document.getElementById('adsStatus');
    adsStatus.textContent = ''; // Clear previous status
    
    // Simulate watching 4 ads
    for (let i = 0; i < 4; i++) {
        adsStatus.textContent = `Watching ad ${i + 1} of 4...`;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate ad loading time

        // Call Monetag Rewarded Interstitial
        try {
            await show_10276123(); // This function comes from the Monetag SDK
            // User watched the ad till the end or closed it in interstitial format
            updateBalance(REWARD_PER_AD);
            adsWatchedCount++;
            adsStatus.textContent = `Ad ${adsWatchedCount} watched! Earned ${REWARD_PER_AD.toFixed(2)} Peso. Total: ${pesoBalance.toFixed(2)} Peso.`;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
        } catch (e) {
            // User got error during playing ad or closed it prematurely
            adsStatus.textContent = `Ad ${i + 1} was interrupted or failed. No reward.`;
            console.error('Monetag ad error:', e);
            // Optionally break if an ad fails, or continue to next
            break; 
        }
    }
    adsStatus.textContent += ' All ads watched! Total earned from this session: ' + (REWARD_PER_AD * adsWatchedCount).toFixed(2) + ' Peso.';
    adsWatchedCount = 0; // Reset
});


// --- Withdrawal Room (Highly Insecure Client-Side) ---
document.getElementById('withdrawGcashBtn').addEventListener('click', async () => {
    const number = document.getElementById('gcashNumber').value.trim();
    const amount = parseFloat(document.getElementById('gcashAmount').value);

    if (!number || !amount || amount <= 0) {
        alert('Please enter a valid Gcash number and amount.');
        return;
    }
    if (pesoBalance < amount) {
        alert('Insufficient balance.');
        return;
    }
    
    // Simulate withdrawal request
    updateBalance(-amount); // Deduct balance immediately (insecure)
    await db.collection('withdrawals').add({
        userId: currentUserId,
        username: currentUserName,
        amountPeso: amount,
        type: 'Gcash',
        details: number,
        status: 'Pending', // Manually approved by admin
        requestedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Gcash withdrawal request for ${amount.toFixed(2)} Peso submitted. It will be manually approved.`);
    document.getElementById('gcashNumber').value = '';
    document.getElementById('gcashAmount').value = '';
    loadWithdrawalHistory();
});

document.getElementById('withdrawFaucetpayBtn').addEventListener('click', async () => {
    const email = document.getElementById('faucetpayEmail').value.trim();
    const amountPeso = parseFloat(document.getElementById('faucetpayAmount').value);
    const amountUSDT = amountPeso * USDT_PER_PESO;

    if (!email || !amountPeso || amountPeso <= 0) {
        alert('Please enter a valid FaucetPay email and amount.');
        return;
    }
    if (pesoBalance < amountPeso) {
        alert('Insufficient balance.');
        return;
    }
    if (amountPeso < 1 || amountPeso > 100) {
        alert('FaucetPay withdrawal must be between 1 and 100 Peso.');
        return;
    }

    // Simulate withdrawal request
    updateBalance(-amountPeso); // Deduct balance immediately (insecure)
    await db.collection('withdrawals').add({
        userId: currentUserId,
        username: currentUserName,
        amountPeso: amountPeso,
        amountUSDT: amountUSDT.toFixed(2),
        type: 'FaucetPay',
        details: email,
        status: 'Pending',
        requestedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`FaucetPay withdrawal request for ${amountPeso.toFixed(2)} Peso (${amountUSDT.toFixed(2)} USDT) submitted. It will be manually approved.`);
    document.getElementById('faucetpayEmail').value = '';
    document.getElementById('faucetpayAmount').value = '';
    loadWithdrawalHistory();
});

async function loadWithdrawalHistory() {
    const tableBody = document.getElementById('withdrawalHistoryTable').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading history...</td></tr>';
    const snapshot = await db.collection('withdrawals')
        .where('userId', '==', currentUserId)
        .orderBy('requestedAt', 'desc')
        .get();

    if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="5">No withdrawal history.</td></tr>';
        return;
    }

    let html = '';
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.requestedAt ? new Date(data.requestedAt.toDate()).toLocaleString() : 'N/A';
        html += `
            <tr>
                <td>${date}</td>
                <td>${data.amountPeso.toFixed(2)} Peso</td>
                <td>${data.type}</td>
                <td>${data.details} ${data.amountUSDT ? `(${data.amountUSDT} USDT)` : ''}</td>
                <td style="color: ${data.status === 'Approved' ? 'green' : data.status === 'Rejected' ? 'red' : 'orange'};">${data.status}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

// --- Admin Panel (Highly Insecure Client-Side) ---
document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput.value === 'Propetas6') {
        adminLoggedIn = true;
        document.getElementById('adminLoginBtn').classList.add('hidden');
        passwordInput.classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        loadAdminWithdrawals();
        alert('Admin login successful!');
    } else {
        alert('Incorrect admin password.');
    }
    passwordInput.value = ''; // Clear password
});

async function loadAdminWithdrawals() {
    if (!adminLoggedIn) return;

    const tableBody = document.getElementById('adminWithdrawalsTable').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="7">Loading withdrawal requests...</td></tr>';
    const snapshot = await db.collection('withdrawals')
        .orderBy('requestedAt', 'desc')
        .get();

    if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="7">No pending withdrawal requests.</td></tr>';
        return;
    }

    let html = '';
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.requestedAt ? new Date(data.requestedAt.toDate()).toLocaleString() : 'N/A';
        const docId = doc.id;
        const actionButtons = data.status === 'Pending' ? `
            <button class="action-button approve-btn" data-id="${docId}">Approve</button>
            <button class="action-button reject-btn" data-id="${docId}">Reject</button>
        ` : `<span style="color: ${data.status === 'Approved' ? 'green' : 'red'};">${data.status}</span>`;

        html += `
            <tr>
                <td>${date}</td>
                <td>${data.userId}</td>
                <td>${data.amountPeso.toFixed(2)} Peso</td>
                <td>${data.type}</td>
                <td>${data.details}</td>
                <td>${data.status}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;

    // Attach event listeners to new buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateWithdrawalStatus(e.target.dataset.id, 'Approved'));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateWithdrawalStatus(e.target.dataset.id, 'Rejected'));
    });
}

async function updateWithdrawalStatus(withdrawalId, status) {
    if (!adminLoggedIn) {
        alert('You must be logged in as admin to perform this action.');
        return;
    }
    // Update status in Firestore (insecurely client-side)
    try {
        await db.collection('withdrawals').doc(withdrawalId).update({
            status: status,
            approvedBy: currentUserId, // Admin's user ID
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`Withdrawal ${withdrawalId} marked as ${status}.`);
        loadAdminWithdrawals(); // Refresh table
    } catch (error) {
        console.error("Error updating withdrawal status:", error);
        alert('Error updating withdrawal status.');
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    updateBalance(0); // Initialize balance display
    showPage('profilePage'); // Start on the profile page
});
