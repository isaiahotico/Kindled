
// ⚠️ WARNING: THIS IS A FRONTEND-ONLY PROOF-OF-CONCEPT.
// ⚠️ IT IS HIGHLY INSECURE FOR ANY REAL-WORLD APPLICATION WITH MONEY/REWARDS.
// ⚠️ ALL DATA AND LOGIC ARE VULNERABLE TO CLIENT-SIDE MANIPULATION.

// 1. Firebase Configuration (REPLACE WITH YOUR OWN CONFIG)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your Firebase API Key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Project ID
    projectId: "YOUR_PROJECT_ID", // Replace with your Project ID
    storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your Project ID
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Sender ID
    appId: "YOUR_APP_ID" // Replace with your App ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global Variables
let currentUserId = localStorage.getItem('currentUserId') || `user_${Date.now()}`; // Simulate a unique user ID
let currentUserName = localStorage.getItem('currentUserName') || `User${Math.floor(Math.random() * 1000)}`; // Simulate username
let pesoBalance = parseFloat(localStorage.getItem('pesoBalance')) || 0.000;
let freeLinksCount = parseInt(localStorage.getItem('freeLinksCount')) || 5;
let totalLinksSubmitted = parseInt(localStorage.getItem('totalLinksSubmitted')) || 0;
const MAX_FREE_LINKS = 5;
const MAX_TOTAL_LINKS = 20; // Extendable to 100 as per request
const LINK_COST = 5; // Pesos
const REWARD_PER_AD = 0.007; // New ad reward per click/view
const NUM_ADS_PER_SESSION = 4;
const VIDEO_REWARD_PER_MINUTE = 0.050; // Example reward for YouTube watching
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
    localStorage.setItem('pesoBalance', pesoBalance.toFixed(3)); // Display with 3 decimal places
    document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(3);
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(3);
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
        if (!player) createYoutubePlayer(); // Create player if it doesn't exist
        else if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
             loadRandomVideo(); // Load a video only if player is not currently playing
        }
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
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(3);
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

    // Stop current video if playing
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.stopVideo();
    }

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
            alert(`You earned ${VIDEO_REWARD_PER_MINUTE.toFixed(3)} Peso for watching!`);
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

    // Check if link already exists in Firestore
    const existingLink = await db.collection('youtubeLinks').doc(videoId).get();
    if (existingLink.exists) {
        messageDisplay.textContent = 'This YouTube video has already been submitted by someone.';
        messageDisplay.style.color = 'orange';
        return;
    }

    let cost = 0;
    let isFree = false;
    if (freeLinksCount > 0) {
        isFree = true;
    } else {
        cost = LINK_COST;
        if (pesoBalance < cost) {
            messageDisplay.textContent = `Insufficient balance. Need ${cost.toFixed(2)} Peso.`;
            messageDisplay.style.color = 'red';
            return;
        }
    }

    // Proceed with submission
    if (isFree) {
        freeLinksCount--;
        messageDisplay.textContent = 'Link submitted for free!';
    } else {
        updateBalance(-cost);
        messageDisplay.textContent = `Link submitted for ${cost.toFixed(2)} Peso!`;
    }
    messageDisplay.style.color = 'green';
    
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
        if (isFree && freeLinksCount < MAX_FREE_LINKS) freeLinksCount++;
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
document.getElementById('watchAdsBtn').addEventListener('click', async () => {
    const adsStatus = document.getElementById('adsStatus');
    const watchAdsBtn = document.getElementById('watchAdsBtn');
    adsStatus.textContent = ''; // Clear previous status
    
    let successfulAds = 0;
    let totalEarnedThisSession = 0;
    
    watchAdsBtn.disabled = true; // Disable button during ad session
    const originalButtonText = watchAdsBtn.textContent;

    for (let i = 0; i < NUM_ADS_PER_SESSION; i++) {
        adsStatus.textContent = `Preparing ad ${i + 1} of ${NUM_ADS_PER_SESSION}...`;
        watchAdsBtn.textContent = `Watching Ad ${i + 1}/${NUM_ADS_PER_SESSION}...`;
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate ad preparation time

        try {
            // Call Monetag Rewarded Interstitial
            await show_10276123(); 
            // User watched the ad till the end or closed it in interstitial format
            
            successfulAds++;
            updateBalance(REWARD_PER_AD);
            totalEarnedThisSession += REWARD_PER_AD;
            adsStatus.textContent = `Ad ${i + 1} completed! You earned ${REWARD_PER_AD.toFixed(3)} Peso. Total this session: ${totalEarnedThisSession.toFixed(3)} Peso.`;

            if (i < NUM_ADS_PER_SESSION - 1) { // If not the last ad
                // Small pop-up/alert for ads left
                alert(`Ad ${i + 1} finished! ${NUM_ADS_PER_SESSION - (i + 1)} ads left to watch.`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Small delay between ads
            }

        } catch (e) {
            adsStatus.textContent = `Ad ${i + 1} was interrupted or failed. No reward for this ad.`;
            console.error('Monetag ad error:', e);
            // Decide if to stop the sequence or continue. For now, continue to next ad.
        }
    }

    adsStatus.textContent = `All ${NUM_ADS_PER_SESSION} ads finished! You earned a total of ${totalEarnedThisSession.toFixed(3)} Peso. Redirecting to YouTube Room...`;
    watchAdsBtn.disabled = false; // Re-enable button
    watchAdsBtn.textContent = originalButtonText; // Restore button text

    // After all ads, navigate to YouTube room and load a random video
    await new Promise(resolve => setTimeout(resolve, 3000)); // Small delay before redirect
    showPage('youtubePage');
    loadRandomVideo();
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
                <td>${data.amountPeso.toFixed(3)} Peso</td>
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
        ` : `<span style="color: ${data.status === 'Approved' ? 'green' : data.status === 'Rejected' ? 'red' : 'orange'};">${data.status}</span>`;

        html += `
            <tr>
                <td>${date}</td>
                <td>${data.userId}</td>
                <td>${data.amountPeso.toFixed(3)} Peso</td>
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

// --- Footer Logic ---
function updateDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateDateTime, 1000); // Update every second


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    updateBalance(0); // Initialize balance display
    showPage('profilePage'); // Start on the profile page
    updateDateTime(); // Initial call for footer date/time
});
