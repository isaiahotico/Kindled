
// ⚠️ WARNING: THIS IS A FRONTEND-ONLY PROOF-OF-CONCEPT.
// ⚠️ IT IS HIGHLY INSECURE AND UNSUITABLE FOR ANY REAL-WORLD APPLICATION WITH MONEY/REWARDS.
// ⚠️ ALL DATA AND LOGIC ARE VULNERABLE TO CLIENT-SIDE MANIPULATION.
// ⚠️ REAL PAYMENT GATEWAY INTEGRATIONS (Gcash, FaucetPay) ARE NOT INCLUDED AND REQUIRE A SECURE BACKEND.

// 1. Firebase Configuration (REPLACE WITH YOUR OWN CONFIG)
// Go to Firebase Console -> Project settings -> General -> Your apps -> Web -> Config
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
let currentUserId;
let currentUserName;
let currentUserIp;
let pesoBalance = parseFloat(localStorage.getItem('pesoBalance')) || 0.00;
let freeLinksCount = parseInt(localStorage.getItem('freeLinksCount')) || 5;
let totalLinksSubmitted = parseInt(localStorage.getItem('totalLinksSubmitted')) || 0;
const MAX_FREE_LINKS = 5;
const MAX_TOTAL_LINKS = 20; // Extendable to 100 in future
const LINK_COST = 5; // Pesos
const VIDEO_REWARD_PER_MINUTE = 0.05; // Example reward per 1 minute watch
const USDT_PER_PESO = 0.02; // 1 Peso = 0.02 USDT (example conversion)
const WITHDRAW_MIN_PESO = 1;

let player; // YouTube Player instance
let currentVideoId = null;
let playedVideoIds = []; // Stores video IDs watched by the current user
let videoQueue = []; // Queue for random video selection
let rewardTimerInterval;
let adminLoggedIn = false;
let adminPassAttempted = false; // To show password prompt only once

// --- Utility Functions ---
async function fetchUserIp() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        currentUserIp = data.ip;
        localStorage.setItem('userIpAddress', currentUserIp);
        document.getElementById('userIpAddress').textContent = currentUserIp;
    } catch (error) {
        console.error("Error fetching IP address:", error);
        document.getElementById('userIpAddress').textContent = 'Error fetching IP';
    }
}

function updateBalance(amount) {
    pesoBalance += amount;
    if (pesoBalance < 0) pesoBalance = 0; // Prevent negative balance
    localStorage.setItem('pesoBalance', pesoBalance.toFixed(2));
    document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(2);
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
    updateWithdrawalButtons();

    // Update total earned in Firestore (insecurely client-side)
    db.collection('users').doc(currentUserId).update({
        balance: pesoBalance,
        totalEarned: firebase.firestore.FieldValue.increment(amount > 0 ? amount : 0)
    }).catch(error => console.error("Error updating user balance/totalEarned:", error));
}

function updateLocalStorageData() {
    localStorage.setItem('freeLinksCount', freeLinksCount);
    localStorage.setItem('totalLinksSubmitted', totalLinksSubmitted);
}

function updateWithdrawalButtons() {
    const disable = pesoBalance < WITHDRAW_MIN_PESO;
    document.getElementById('withdrawGcashBtn').disabled = disable;
    document.getElementById('withdrawFaucetpayBtn').disabled = disable;
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    
    // Stop YouTube player if switching away from YouTube room
    if (pageId !== 'youtubePage' && player && player.stopVideo) {
        player.stopVideo();
        clearInterval(rewardTimerInterval);
        document.getElementById('rewardTimer').classList.add('hidden');
        document.getElementById('playRewardBtn').textContent = 'Play for Reward';
        document.getElementById('playRewardBtn').disabled = false;
    }

    // Specific logic for each page on show
    switch (pageId) {
        case 'profilePage':
            loadUserProfile();
            loadUserLinks();
            break;
        case 'leaderboard-earnersPage':
            setupTopEarnersListener();
            break;
        case 'leaderboard-videosPage':
            setupTopVideosListener();
            break;
        case 'youtubePage':
            if (!player) createYoutubePlayer();
            else loadRandomVideo(); // Load a video if player already exists
            break;
        case 'linkPage':
            document.getElementById('freeLinksCount').textContent = freeLinksCount;
            document.getElementById('totalLinksSubmitted').textContent = totalLinksSubmitted;
            document.getElementById('maxTotalLinks').textContent = MAX_TOTAL_LINKS;
            document.getElementById('linkSubmissionMessage').textContent = '';
            break;
        case 'withdrawalPage':
            setupWithdrawalHistoryListener();
            break;
        case 'adminPage':
            if (adminLoggedIn) setupAdminWithdrawalsListener();
            else if (!adminPassAttempted) document.getElementById('adminPassword').classList.remove('hidden');
            break;
    }
}

// --- Navigation ---
document.querySelectorAll('.nav-button, .home-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const page = event.target.dataset.page;
        if (page === 'home') {
            showPage('profilePage'); // Default home is profile
        } else {
            showPage(`${page}Page`);
        }
    });
});

// --- User Initialization (Simulated Telegram / IP Check) ---
async function initializeUser() {
    // Try to get Telegram WebApp data
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        currentUserId = `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
        currentUserName = window.Telegram.WebApp.initDataUnsafe.user.username || window.Telegram.WebApp.initDataUnsafe.user.first_name || 'Telegram User';
        document.getElementById('telegramUserInfo').textContent = `Logged in as: ${currentUserName} (ID: ${currentUserId})`;
        console.log("Telegram WebApp user detected:", currentUserName, currentUserId);
    } else {
        // Fallback for non-Telegram environment
        currentUserId = localStorage.getItem('currentUserId');
        currentUserName = localStorage.getItem('currentUserName');

        if (!currentUserId) {
            currentUserId = `user_${Date.now()}`;
            currentUserName = prompt("Enter a username (e.g., 'Guest123'):", `Guest${Math.floor(Math.random() * 1000)}`) || `Guest${Date.now()}`;
            localStorage.setItem('currentUserId', currentUserId);
            localStorage.setItem('currentUserName', currentUserName);
        }
        document.getElementById('telegramUserInfo').textContent = `Simulated User: ${currentUserName} (ID: ${currentUserId})`;
        alert(`Welcome, ${currentUserName}! (Simulated user for non-Telegram environment)`);
    }

    // Fetch IP address
    await fetchUserIp();

    // Load user data from Firestore or create new
    const userRef = db.collection('users').doc(currentUserId);
    const doc = await userRef.get();

    if (!doc.exists) {
        // New user
        await userRef.set({
            username: currentUserName,
            telegramId: currentUserId,
            ipAddress: currentUserIp,
            balance: pesoBalance,
            freeLinks: freeLinksCount,
            totalLinks: totalLinksSubmitted,
            totalEarned: 0,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("New user initialized in Firestore.");
    } else {
        // Existing user, load data
        const userData = doc.data();
        pesoBalance = userData.balance !== undefined ? parseFloat(userData.balance) : pesoBalance;
        freeLinksCount = userData.freeLinks !== undefined ? parseInt(userData.freeLinks) : freeLinksCount;
        totalLinksSubmitted = userData.totalLinks !== undefined ? parseInt(userData.totalLinks) : totalLinksSubmitted;
        currentUserName = userData.username || currentUserName; // Update username if it changed
        currentUserIp = userData.ipAddress || currentUserIp; // Update IP if it changed (client-side)

        // Ensure user IP is updated in Firestore if different
        if (userData.ipAddress !== currentUserIp) {
            await userRef.update({ ipAddress: currentUserIp });
        }
        console.log("Existing user data loaded from Firestore.");
    }

    // Load user-watched videos
    const watchedSnapshot = await db.collection('userWatchedVideos').doc(currentUserId).collection('watched').get();
    playedVideoIds = watchedSnapshot.docs.map(doc => doc.id);
    console.log("Loaded played video IDs:", playedVideoIds);

    updateBalance(0); // Update display and ensure totalEarned is correctly set/updated
    updateLocalStorageData();
    loadUserProfile();
    showPage('profilePage'); // Start on profile page after user init
}

function loadUserProfile() {
    document.getElementById('telegramUsername').textContent = currentUserName;
    document.getElementById('telegramUserId').textContent = currentUserId;
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
    document.getElementById('userIpAddress').textContent = currentUserIp; // Display fetched IP
}

// --- Leaderboard Listeners ---
function setupTopEarnersListener() {
    const tableBody = document.getElementById('topEarnersTable').querySelector('tbody');
    db.collection('users')
        .orderBy('totalEarned', 'desc')
        .limit(10)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="3">No top earners yet.</td></tr>';
                return;
            }
            let html = '';
            snapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${data.username}</td>
                        <td>${data.totalEarned ? data.totalEarned.toFixed(2) : '0.00'}⚡</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }, error => {
            console.error("Error fetching top earners:", error);
            tableBody.innerHTML = '<tr><td colspan="3">Error loading leaderboard.</td></tr>';
        });
}

function setupTopVideosListener() {
    const tableBody = document.getElementById('topVideosTable').querySelector('tbody');
    db.collection('youtubeLinks')
        .orderBy('views', 'desc')
        .limit(10)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="3">No top videos yet.</td></tr>';
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
        }, error => {
            console.error("Error fetching top videos:", error);
            tableBody.innerHTML = '<tr><td colspan="3">Error loading leaderboard.</td></tr>';
        });
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
            'autoplay': 0,
            'modestbranding': 1 // Reduces YouTube logo
            // NOTE: YouTube Player API does not provide direct control over ads for third-party apps to monetize.
            // Ads are shown at YouTube's discretion based on channel settings and user location.
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
    // Player state validation: Ensure user is actively playing for reward
    if (event.data == YT.PlayerState.PLAYING) {
        document.getElementById('playRewardBtn').textContent = 'Playing...';
        document.getElementById('playRewardBtn').disabled = true;
        startRewardTimer();
    } else if (event.data == YT.PlayerState.ENDED) {
        clearInterval(rewardTimerInterval);
        document.getElementById('rewardTimer').classList.add('hidden');
        document.getElementById('playRewardBtn').textContent = 'Play for Reward';
        document.getElementById('playRewardBtn').disabled = false;
        
        // A video ended, so add it to played list for this user (client-side & Firestore)
        if (currentVideoId && !playedVideoIds.includes(currentVideoId)) {
            playedVideoIds.push(currentVideoId);
            db.collection('userWatchedVideos').doc(currentUserId).collection('watched').doc(currentVideoId).set({
                watchedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(() => {
                console.log('Video recorded as watched by user.');
            }).catch(error => {
                console.error('Error recording watched video:', error);
            });

            // Increment view count for the video globally (insecurely client-side)
            db.collection('youtubeLinks').doc(currentVideoId).update({
                views: firebase.firestore.FieldValue.increment(1)
            }).then(() => {
                console.log('Video view count incremented globally.');
            }).catch(error => {
                console.error('Error updating video view count globally:', error);
            });
        }
    } else if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.BUFFERING) {
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
    if (player && player.stopVideo) {
        player.stopVideo();
    }

    if (videoQueue.length === 0) {
        const snapshot = await db.collection('youtubeLinks').get();
        const allLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter out videos already played by current user
        videoQueue = allLinks.filter(link => !playedVideoIds.includes(link.id));

        if (videoQueue.length === 0) {
            if (allLinks.length > 0) {
                // All videos played, offer to reset for demo purposes
                if (confirm("You've watched all available videos! Would you like to reset your played history to watch them again?")) {
                    playedVideoIds = [];
                    // Clear user's watched videos in Firestore (insecurely client-side)
                    const batch = db.batch();
                    const userWatchedCollectionRef = db.collection('userWatchedVideos').doc(currentUserId).collection('watched');
                    const watchedDocs = await userWatchedCollectionRef.get();
                    watchedDocs.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log("User's played video history reset in Firestore.");
                    videoQueue = allLinks; // Re-add all links to queue
                } else {
                    document.getElementById('player').innerHTML = '<p>No new videos available.</p>';
                    document.getElementById('videoTitleDisplay').textContent = '';
                    currentVideoId = null;
                    return;
                }
            } else {
                document.getElementById('player').innerHTML = '<p>No videos available. Please submit some!</p>';
                document.getElementById('videoTitleDisplay').textContent = '';
                currentVideoId = null;
                return;
            }
        }
    }

    const randomIndex = Math.floor(Math.random() * videoQueue.length);
    const selectedVideo = videoQueue.splice(randomIndex, 1)[0];
    currentVideoId = selectedVideo.id;

    player.loadVideoById(currentVideoId);
    document.getElementById('videoTitleDisplay').textContent = selectedVideo.title || `Untitled Video (ID: ${currentVideoId})`;
}

document.getElementById('playRewardBtn').addEventListener('click', () => {
    if (player && currentVideoId) {
        player.playVideo();
    } else {
        alert('No video loaded. Please click "Next Video" or submit some links!');
    }
});

document.getElementById('nextVideoBtn').addEventListener('click', () => {
    if (player) player.stopVideo(); // Stop current video
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
            if (player && player.pauseVideo) player.pauseVideo(); // Pause after reward duration
            updateBalance(VIDEO_REWARD_PER_MINUTE); // Award reward
            alert(`You earned ${VIDEO_REWARD_PER_MINUTE.toFixed(2)}⚡ Peso for watching!`);
            document.getElementById('playRewardBtn').textContent = 'Play for Reward';
            document.getElementById('playRewardBtn').disabled = false;
        }
    }, 1000);
}


// --- Link Room ---
function getYouTubeVideoId(url) {
    // Smart Auto YouTube URL Engine: Validates & converts various YouTube URL formats
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([a-zA-Z0-9_-]{11})(?:\S+)?/;
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

    // Check if link already exists in global pool
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
            messageDisplay.textContent = `Link submitted for ${cost}⚡ Peso!`;
            messageDisplay.style.color = 'green';
        } else {
            messageDisplay.textContent = `Insufficient balance. Need ${cost}⚡ Peso.`;
            messageDisplay.style.color = 'red';
            return;
        }
    }

    totalLinksSubmitted++;
    updateLocalStorageData();

    // Store link in Firestore (insecurely client-side)
    try {
        // In a real app, you'd use YouTube Data API to fetch actual title
        const videoTitle = `Video Title (ID: ${videoId})`; 
        await db.collection('youtubeLinks').doc(videoId).set({
            url: `https://www.youtube.com/watch?v=${videoId}`, // Standardize URL
            title: videoTitle, 
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


// --- Withdrawal Room (Highly Insecure Client-Side) ---
document.getElementById('withdrawGcashBtn').addEventListener('click', () => requestWithdrawal('Gcash'));
document.getElementById('withdrawFaucetpayBtn').addEventListener('click', () => requestWithdrawal('FaucetPay'));

async function requestWithdrawal(type) {
    const amountInput = type === 'Gcash' ? document.getElementById('gcashAmount') : document.getElementById('faucetpayAmount');
    const detailsInput = type === 'Gcash' ? document.getElementById('gcashNumber') : document.getElementById('faucetpayEmail');
    
    const details = detailsInput.value.trim();
    const amountPeso = parseFloat(amountInput.value);

    if (!details || !amountPeso || amountPeso < WITHDRAW_MIN_PESO) {
        alert(`Please enter valid details and an amount of at least ${WITHDRAW_MIN_PESO}⚡ Peso.`);
        return;
    }
    if (pesoBalance < amountPeso) {
        alert('Insufficient balance.');
        return;
    }

    let amountUSDT;
    if (type === 'FaucetPay') {
        amountUSDT = amountPeso * USDT_PER_PESO;
        if (amountPeso > 100) {
            alert('FaucetPay withdrawal max is 100⚡ Peso.');
            return;
        }
    }

    // Deduct balance immediately (insecurely client-side)
    updateBalance(-amountPeso); 
    
    const withdrawalData = {
        userId: currentUserId,
        username: currentUserName,
        amountPeso: amountPeso,
        type: type,
        details: details,
        status: 'Pending', // Manually approved by admin
        requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ipAddress: currentUserIp,
        telegramId: currentUserId // Storing for admin check
    };
    if (type === 'FaucetPay') withdrawalData.amountUSDT = amountUSDT.toFixed(2);

    // Simulate "Instant Payout Routing" and "Smart-Queue" by setting status
    const speed = amountPeso < 10 ? 'Auto-Instant' : (amountPeso < 50 ? 'Smart-Queue' : 'Admin-Fast Review');

    try {
        const docRef = await db.collection('withdrawals').add(withdrawalData);
        alert(`${type} withdrawal request for ${amountPeso.toFixed(2)}⚡ Peso (${speed}) submitted. ID: ${docRef.id}. It will be manually approved.`);
        detailsInput.value = '';
        amountInput.value = '';
    } catch (error) {
        console.error("Error submitting withdrawal request:", error);
        alert('Error submitting withdrawal request. Please try again.');
        updateBalance(amountPeso); // Rollback balance (insecure)
    }
}

function setupWithdrawalHistoryListener() {
    const tableBody = document.getElementById('withdrawalHistoryTable').querySelector('tbody');
    db.collection('withdrawals')
        .where('userId', '==', currentUserId)
        .orderBy('requestedAt', 'desc')
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6">No withdrawal history.</td></tr>';
                return;
            }

            let html = '';
            // Withdrawal history stays forever, as requested
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const requestedTime = data.requestedAt ? new Date(data.requestedAt.toDate()) : new Date();

                html += `
                    <tr>
                        <td>${requestedTime.toLocaleString()}</td>
                        <td>${data.amountPeso.toFixed(2)}⚡</td>
                        <td>${data.type}</td>
                        <td>${data.details} ${data.amountUSDT ? `(${data.amountUSDT} USDT)` : ''}</td>
                        <td class="status-${data.status}">${data.status}</td>
                        <td>${data.reason || 'N/A'}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }, error => {
            console.error("Error fetching withdrawal history:", error);
            tableBody.innerHTML = '<tr><td colspan="6">Error loading withdrawal history.</td></tr>';
        });
}

// --- Admin Panel (Highly Insecure Client-Side) ---
document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput.value === 'Propetas6') {
        adminLoggedIn = true;
        adminPassAttempted = true;
        passwordInput.classList.add('hidden');
        document.getElementById('adminLoginBtn').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        setupAdminWithdrawalsListener(); // Start real-time listener for admin
        alert('Admin login successful!');
    } else {
        alert('Incorrect admin password.');
        adminPassAttempted = true; // Still mark as attempted so it doesn't pop up again
    }
    passwordInput.value = ''; // Clear password
});

function setupAdminWithdrawalsListener() {
    if (!adminLoggedIn) return;

    const tableBody = document.getElementById('adminWithdrawalsTable').querySelector('tbody');
    db.collection('withdrawals')
        .orderBy('requestedAt', 'desc')
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7">No pending withdrawal requests.</td></tr>';
                return;
            }

            let html = '';
            // Withdrawal history stays forever, as requested
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const requestedTime = data.requestedAt ? new Date(data.requestedAt.toDate()) : new Date();

                const docId = doc.id;
                const actionButtons = data.status === 'Pending' ? `
                    <button class="action-button approve-btn" data-id="${docId}">Approve</button>
                    <button class="action-button reject-btn" data-id="${docId}">Reject</button>
                    <button class="action-button fail-btn" data-id="${docId}">Fail</button>
                ` : `<span class="status-${data.status}">${data.status}</span>`;

                html += `
                    <tr>
                        <td>${requestedTime.toLocaleString()}</td>
                        <td>${data.username} (${data.userId})</td>
                        <td>${data.amountPeso.toFixed(2)}⚡</td>
                        <td>${data.type}</td>
                        <td>${data.details}</td>
                        <td class="status-${data.status}">${data.status}</td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;

            // Attach event listeners to new buttons
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Approved');
            });
            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Rejected', prompt("Reason for rejection:"));
            });
            document.querySelectorAll('.fail-btn').forEach(btn => {
                btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Failed', prompt("Reason for failure:"));
            });
        }, error => {
            console.error("Error fetching admin withdrawals:", error);
            tableBody.innerHTML = '<tr><td colspan="7">Error loading withdrawal requests.</td></tr>';
        });
}

async function updateWithdrawalStatus(withdrawalId, status, reason = '') {
    if (!adminLoggedIn) {
        alert('You must be logged in as admin to perform this action.');
        return;
    }
    // Update status in Firestore (insecurely client-side)
    try {
        const updateData = {
            status: status,
            approvedBy: currentUserId, // Admin's user ID
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (reason) updateData.reason = reason;

        await db.collection('withdrawals').doc(withdrawalId).update(updateData);
        alert(`Withdrawal ${withdrawalId} marked as ${status}.`);
        // The onSnapshot listener will automatically refresh the table
    } catch (error) {
        console.error("Error updating withdrawal status:", error);
        alert('Error updating withdrawal status.');
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', initializeUser); // Start by initializing user
