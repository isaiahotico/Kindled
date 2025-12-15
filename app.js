
// ⚠️ WARNING: THIS FRONTEND CODE REQUIRES A SEPARATE BACKEND SERVER TO FUNCTION SECURELY AND CORRECTLY FOR WITHDRAWALS.
// ⚠️ THE PREVIOUS FRONTEND-ONLY WITHDRAWAL SYSTEM WAS HIGHLY INSECURE AND HAS BEEN REPLACED WITH API CALLS.
// ⚠️ YOU MUST IMPLEMENT A BACKEND SERVER (e.g., using Node.js, Python, PHP) AND DEPLOY IT.

// 1. Backend API Configuration (REPLACE WITH YOUR ACTUAL BACKEND SERVER URL)
const BACKEND_API_BASE_URL = 'http://localhost:3000'; // <--- IMPORTANT: Change this to your deployed backend URL

// 2. Firebase Configuration (for non-withdrawal features like links, leaderboards)
// Go to Firebase Console -> Project settings -> General -> Your apps -> Web -> Config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (for non-withdrawal features)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore instance for non-withdrawal features

// Global Variables
let currentUserId;
let currentUserName;
let currentUserIp;
let pesoBalance = 0.00; // Will be fetched from backend for primary source of truth
let freeLinksCount = parseInt(localStorage.getItem('freeLinksCount')) || 5; // Client-side for this demo
let totalLinksSubmitted = parseInt(localStorage.getItem('totalLinksSubmitted')) || 0; // Client-side for this demo
const MAX_FREE_LINKS = 5;
const MAX_TOTAL_LINKS = 20; // Extendable to 100 in future
const LINK_COST = 5; // Pesos
const VIDEO_REWARD_PER_MINUTE = 0.05; // Example reward per 1 minute watch
const ADS_REWARD_PER_CLICK = 0.007; // From previous code, assuming 4 clicks for 0.028
const WITHDRAW_MIN_PESO = 1;

let player; // YouTube Player instance
let currentVideoId = null;
let playedVideoIds = []; // Stores video IDs watched by the current user
let videoQueue = []; // Queue for random video selection
let rewardTimerInterval;
let adminLoggedIn = false;
let adminPassAttempted = false;

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

// updateBalance (Frontend-only display update for rewards/optimistic updates)
// The true balance source is now the backend.
function updateBalance(amount, isReward = true) {
    pesoBalance += amount;
    if (pesoBalance < 0) pesoBalance = 0;
    // localStorage.setItem('pesoBalance', pesoBalance.toFixed(2)); // No longer localStorage for primary balance
    document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(2);
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
    updateWithdrawalButtons();

    // If it's a reward, notify backend to update user's *true* balance and totalEarned
    if (isReward && amount > 0) {
        // This should ideally be a secure backend API call too, not client-side Firestore.
        // For this demo, we'll keep it as a client-side Firebase update for simplicity,
        // but note this is still insecure for actual money.
        db.collection('users').doc(currentUserId).update({
            balance: firebase.firestore.FieldValue.increment(amount),
            totalEarned: firebase.firestore.FieldValue.increment(amount)
        }).catch(error => console.error("Error updating user balance/totalEarned (client-side):", error));
    }
}

// Function to call the backend to get the real balance
async function fetchUserBalance() {
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/user/balance`, {
            headers: {
                'X-Telegram-User-ID': currentUserId,
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData || '' // Send initData for backend validation
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.balance !== undefined) {
            pesoBalance = parseFloat(data.balance);
            document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(2);
            document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
            updateWithdrawalButtons();
        }
    } catch (error) {
        console.error("Error fetching user balance from backend:", error);
        // Fallback to client-side stored balance if backend fails (insecure, but for UI resilience)
        pesoBalance = parseFloat(localStorage.getItem('pesoBalance') || '0.00');
        document.getElementById('pesoBalance').textContent = pesoBalance.toFixed(2);
        document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2);
        updateWithdrawalButtons();
        alert('Could not connect to the backend to get your latest balance. Displaying local value.');
    }
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
            fetchUserBalance(); // Refresh balance when entering profile
            break;
        case 'leaderboard-earnersPage':
            setupTopEarnersListener();
            break;
        case 'leaderboard-videosPage':
            setupTopVideosListener();
            break;
        case 'youtubePage':
            if (!player) createYoutubePlayer();
            else loadRandomVideo();
            break;
        case 'linkPage':
            document.getElementById('freeLinksCount').textContent = freeLinksCount;
            document.getElementById('totalLinksSubmitted').textContent = totalLinksSubmitted;
            document.getElementById('maxTotalLinks').textContent = MAX_TOTAL_LINKS;
            document.getElementById('linkSubmissionMessage').textContent = '';
            break;
        case 'withdrawalPage':
            fetchUserBalance(); // Ensure latest balance before withdrawal
            setupWithdrawalHistoryListener(); // Now fetches from backend
            break;
        case 'adminPage':
            if (adminLoggedIn) setupAdminWithdrawalsListener(); // Now fetches from backend
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

    // *** User registration/login should ideally happen via backend API ***
    // For this demo, we'll keep the client-side Firebase user creation/load for non-withdrawal features
    // and let the backend handle the 'true' user balance and profile if it exists there.
    const userRef = db.collection('users').doc(currentUserId);
    const doc = await userRef.get();

    if (!doc.exists) {
        // New user
        await userRef.set({
            username: currentUserName,
            telegramId: currentUserId,
            ipAddress: currentUserIp,
            balance: 0.00, // Initial balance in client-side Firebase for non-withdrawal features
            totalEarned: 0.00,
            freeLinks: freeLinksCount,
            totalLinks: totalLinksSubmitted,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("New user initialized in client-side Firestore for demo purposes.");
    } else {
        // Existing user, load data (non-balance related)
        const userData = doc.data();
        freeLinksCount = userData.freeLinks !== undefined ? parseInt(userData.freeLinks) : freeLinksCount;
        totalLinksSubmitted = userData.totalLinks !== undefined ? parseInt(userData.totalLinks) : totalLinksSubmitted;
        currentUserName = userData.username || currentUserName;
        // currentUserIp = userData.ipAddress || currentUserIp; // Backend should update/verify IP

        // Ensure user IP is updated in Firestore if different (client-side)
        if (userData.ipAddress !== currentUserIp) {
            await userRef.update({ ipAddress: currentUserIp });
        }
        console.log("Existing user data loaded from client-side Firestore for demo purposes.");
    }

    // Load user-watched videos from Firebase
    const watchedSnapshot = await db.collection('userWatchedVideos').doc(currentUserId).collection('watched').get();
    playedVideoIds = watchedSnapshot.docs.map(doc => doc.id);
    console.log("Loaded played video IDs:", playedVideoIds);

    updateLocalStorageData();
    await fetchUserBalance(); // Fetch actual balance from backend
    loadUserProfile();
    showPage('profilePage'); // Start on profile page after user init
}

function loadUserProfile() {
    document.getElementById('telegramUsername').textContent = currentUserName;
    document.getElementById('telegramUserId').textContent = currentUserId;
    document.getElementById('profilePesoBalance').textContent = pesoBalance.toFixed(2); // Display fetched balance
    document.getElementById('userIpAddress').textContent = currentUserIp; // Display fetched IP
}

// --- Leaderboard Listeners (Still direct Firebase for demo) ---
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
            console.error("Error fetching top earners (client-side Firebase):", error);
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
            console.error("Error fetching top videos (client-side Firebase):", error);
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
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player ready.');
    loadRandomVideo();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        document.getElementById('playRewardBtn').textContent = 'Playing...';
        document.getElementById('playRewardBtn').disabled = true;
        startRewardTimer();
    } else if (event.data == YT.PlayerState.ENDED) {
        clearInterval(rewardTimerInterval);
        document.getElementById('rewardTimer').classList.add('hidden');
        document.getElementById('playRewardBtn').textContent = 'Play for Reward';
        document.getElementById('playRewardBtn').disabled = false;
        
        if (currentVideoId && !playedVideoIds.includes(currentVideoId)) {
            playedVideoIds.push(currentVideoId);
            db.collection('userWatchedVideos').doc(currentUserId).collection('watched').doc(currentVideoId).set({
                watchedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(() => {
                console.log('Video recorded as watched by user (client-side Firebase).');
            }).catch(error => {
                console.error('Error recording watched video (client-side Firebase):', error);
            });

            db.collection('youtubeLinks').doc(currentVideoId).update({
                views: firebase.firestore.FieldValue.increment(1)
            }).then(() => {
                console.log('Video view count incremented globally (client-side Firebase).');
            }).catch(error => {
                console.error('Error updating video view count globally (client-side Firebase):', error);
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

    if (player && player.stopVideo) {
        player.stopVideo();
    }

    if (videoQueue.length === 0) {
        const snapshot = await db.collection('youtubeLinks').get();
        const allLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        videoQueue = allLinks.filter(link => !playedVideoIds.includes(link.id));

        if (videoQueue.length === 0) {
            if (allLinks.length > 0) {
                if (confirm("You've watched all available videos! Would you like to reset your played history to watch them again?")) {
                    playedVideoIds = [];
                    const batch = db.batch();
                    const userWatchedCollectionRef = db.collection('userWatchedVideos').doc(currentUserId).collection('watched');
                    const watchedDocs = await userWatchedCollectionRef.get();
                    watchedDocs.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log("User's played video history reset in client-side Firebase.");
                    videoQueue = allLinks;
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
    if (player) player.stopVideo();
    loadRandomVideo();
});

function startRewardTimer() {
    let timeLeft = 60;
    document.getElementById('rewardTimer').classList.remove('hidden');
    document.getElementById('timerCountdown').textContent = timeLeft;

    clearInterval(rewardTimerInterval);
    rewardTimerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timerCountdown').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(rewardTimerInterval);
            document.getElementById('rewardTimer').classList.add('hidden');
            if (player && player.pauseVideo) player.pauseVideo();
            updateBalance(VIDEO_REWARD_PER_MINUTE, true); // Award reward (client-side update for display, and insecure Firebase update)
            alert(`You earned ${VIDEO_REWARD_PER_MINUTE.toFixed(2)}⚡ Peso for watching!`);
            document.getElementById('playRewardBtn').textContent = 'Play for Reward';
            document.getElementById('playRewardBtn').disabled = false;
            fetchUserBalance(); // Refresh balance from backend after reward to stay in sync
        }
    }, 1000);
}


// --- Link Room (Still direct Firebase for demo) ---
function getYouTubeVideoId(url) {
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
        if (pesoBalance >= cost) { // Check client-side balance (insecure)
            updateBalance(-cost, false); // Deduct for cost, not a reward
            messageDisplay.textContent = `Link submitted for ${cost}⚡ Peso!`;
            messageDisplay.style.color = 'green';
            // In a real system, this deduction also needs backend validation/execution.
            // For now, it's just frontend balance update and client-side Firebase user update.
            db.collection('users').doc(currentUserId).update({
                balance: firebase.firestore.FieldValue.increment(-cost)
            }).catch(error => console.error("Error deducting link cost (client-side):", error));
        } else {
            messageDisplay.textContent = `Insufficient balance. Need ${cost}⚡ Peso.`;
            messageDisplay.style.color = 'red';
            return;
        }
    }

    totalLinksSubmitted++;
    updateLocalStorageData();

    try {
        const videoTitle = `Video Title (ID: ${videoId})`; 
        await db.collection('youtubeLinks').doc(videoId).set({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: videoTitle, 
            submittedBy: currentUserId,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0
        });
        await db.collection('users').doc(currentUserId).update({
            freeLinks: freeLinksCount,
            totalLinks: totalLinksSubmitted
        });
        messageDisplay.textContent += ' Link added to global pool!';
        input.value = '';
        document.getElementById('freeLinksCount').textContent = freeLinksCount;
        document.getElementById('totalLinksSubmitted').textContent = totalLinksSubmitted;
        fetchUserBalance(); // Refresh balance from backend after potential cost deduction
    } catch (error) {
        console.error("Error submitting link (client-side Firebase):", error);
        messageDisplay.textContent = 'Error submitting link. Please try again.';
        messageDisplay.style.color = 'red';
        if (cost > 0) updateBalance(cost, false); // Rollback
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

setInterval(() => {
    if (!document.getElementById('profilePage').classList.contains('hidden')) {
        loadUserLinks();
    }
}, 5 * 60 * 1000);


// --- Watch Ads Room (Still direct Firebase for demo) ---
let adsWatchedCount = 0;
const ADS_TO_WATCH = 4;
const ADS_REWARD = ADS_REWARD_PER_CLICK * ADS_TO_WATCH; // 0.028

document.getElementById('watchAdsBtn').addEventListener('click', () => {
    if (typeof MonetagSDK !== 'undefined' && MonetagSDK.show) {
        MonetagSDK.show(); // Trigger Monetag ad display
        adsWatchedCount++;
        document.getElementById('adsStatus').textContent = `Ads watched: ${adsWatchedCount}/${ADS_TO_WATCH}`;

        if (adsWatchedCount >= ADS_TO_WATCH) {
            updateBalance(ADS_REWARD, true); // Award reward (client-side)
            alert(`You earned ${ADS_REWARD.toFixed(3)}⚡ Peso for watching ads!`);
            adsWatchedCount = 0; // Reset count
            document.getElementById('adsStatus').textContent = `Ads watched: 0/${ADS_TO_WATCH}`;
            fetchUserBalance(); // Refresh balance from backend
        }
    } else {
        alert('Monetag SDK not loaded. Cannot display ads. (Simulating reward)');
        // Simulate ad watch and reward for testing without actual ads
        adsWatchedCount++;
        document.getElementById('adsStatus').textContent = `Ads watched: ${adsWatchedCount}/${ADS_TO_WATCH}`;
        if (adsWatchedCount >= ADS_TO_WATCH) {
            updateBalance(ADS_REWARD, true);
            alert(`You earned ${ADS_REWARD.toFixed(3)}⚡ Peso for watching simulated ads!`);
            adsWatchedCount = 0;
            document.getElementById('adsStatus').textContent = `Ads watched: 0/${ADS_TO_WATCH}`;
            fetchUserBalance(); // Refresh balance from backend
        }
    }
});


// --- Withdrawal Room (NOW USES BACKEND API) ---
document.getElementById('withdrawGcashBtn').addEventListener('click', () => requestWithdrawal('Gcash'));
document.getElementById('withdrawFaucetpayBtn').addEventListener('click', () => requestWithdrawal('FaucetPay'));

async function requestWithdrawal(type) {
    const amountInput = type === 'Gcash' ? document.getElementById('gcashAmount') : document.getElementById('faucetpayAmount');
    const detailsInput = type === 'Gcash' ? document.getElementById('gcashNumber') : document.getElementById('faucetpayEmail');
    
    const details = detailsInput.value.trim();
    const amountPeso = parseFloat(amountInput.value);

    // Basic client-side validation
    if (!details || !amountPeso || amountPeso < WITHDRAW_MIN_PESO) {
        alert(`Please enter valid details and an amount of at least ${WITHDRAW_MIN_PESO}⚡ Peso.`);
        return;
    }
    if (pesoBalance < amountPeso) { // Using current client-side balance for optimistic check
        alert('Insufficient balance.');
        return;
    }

    let amountUSDT;
    if (type === 'FaucetPay') {
        amountUSDT = amountPeso * USDT_PER_PESO;
        if (amountPeso > 100) { // FaucetPay max limit
            alert('FaucetPay withdrawal max is 100⚡ Peso.');
            return;
        }
    }

    // Prepare data to send to backend
    const withdrawalData = {
        amount: amountPeso,
        type: type,
        destination: details,
        amountUSDT: type === 'FaucetPay' ? amountUSDT.toFixed(2) : undefined
    };

    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': currentUserId, // Send user ID for backend authentication
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData || '' // Send initData for backend validation
            },
            body: JSON.stringify(withdrawalData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            detailsInput.value = '';
            amountInput.value = '';
            fetchUserBalance(); // Fetch updated balance from backend
            setupWithdrawalHistoryListener(); // Refresh history from backend
        } else {
            alert(`Withdrawal failed: ${result.message || 'Unknown error'}`);
            fetchUserBalance(); // Fetch updated balance from backend in case of failure to resync
        }
    } catch (error) {
        console.error("Error submitting withdrawal request to backend:", error);
        alert('An error occurred during withdrawal. Please try again or check your internet connection.');
        fetchUserBalance(); // Attempt to fetch balance to ensure sync
    }
}

async function setupWithdrawalHistoryListener() {
    const tableBody = document.getElementById('withdrawalHistoryTable').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="6">Loading withdrawal history...</td></tr>';

    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/user/withdrawals`, {
            headers: {
                'X-Telegram-User-ID': currentUserId,
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData || ''
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const withdrawals = await response.json();

        if (withdrawals.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No withdrawal history.</td></tr>';
            return;
        }

        let html = '';
        withdrawals.forEach(data => {
            const requestedTime = new Date(data.requestedAt).toLocaleString();

            html += `
                <tr>
                    <td>${requestedTime}</td>
                    <td>${data.amountPeso.toFixed(2)}⚡</td>
                    <td>${data.type}</td>
                    <td>${data.details} ${data.amountUSDT ? `(${data.amountUSDT} USDT)` : ''}</td>
                    <td class="status-${data.status}">${data.status}</td>
                    <td>${data.reason || 'N/A'}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } catch (error) {
        console.error("Error fetching withdrawal history from backend:", error);
        tableBody.innerHTML = '<tr><td colspan="6">Error loading withdrawal history.</td></tr>';
    }
}


// --- Admin Panel (NOW USES BACKEND API) ---
document.getElementById('adminLoginBtn').addEventListener('click', async () => {
    const passwordInput = document.getElementById('adminPassword');
    // For a real system, even admin login needs to be securely handled by the backend.
    // This is still client-side password check for demo purposes.
    if (passwordInput.value === 'Propetas6') {
        adminLoggedIn = true;
        adminPassAttempted = true;
        passwordInput.classList.add('hidden');
        document.getElementById('adminLoginBtn').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        setupAdminWithdrawalsListener(); // Fetch requests from backend
        alert('Admin login successful!');
    } else {
        alert('Incorrect admin password.');
        adminPassAttempted = true;
    }
    passwordInput.value = '';
});

async function setupAdminWithdrawalsListener() {
    if (!adminLoggedIn) return;

    const tableBody = document.getElementById('adminWithdrawalsTable').querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="7">Loading withdrawal requests...</td></tr>';

    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/admin/withdrawals`, {
            headers: {
                'X-Telegram-User-ID': currentUserId, // Admin's user ID
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData || '',
                'Authorization': 'Bearer ' + 'DEMO_ADMIN_TOKEN' // In a real app, admin would have a token
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const withdrawals = await response.json();

        if (withdrawals.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No pending withdrawal requests.</td></tr>';
            return;
        }

        let html = '';
        withdrawals.forEach(data => {
            const requestedTime = new Date(data.requestedAt).toLocaleString();
            const docId = data.id; // Assuming backend sends an 'id' for the withdrawal record

            const actionButtons = data.status === 'Pending' ? `
                <button class="action-button approve-btn" data-id="${docId}">Approve</button>
                <button class="action-button reject-btn" data-id="${docId}">Reject</button>
                <button class="action-button fail-btn" data-id="${docId}">Fail</button>
            ` : `<span class="status-${data.status}">${data.status}</span>`;

            html += `
                <tr>
                    <td>${requestedTime}</td>
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

        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Approved');
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Rejected', prompt("Reason for rejection:"));
        });
        document.querySelectorAll('.fail-btn').forEach(btn => {
            btn.onclick = (e) => updateWithdrawalStatus(e.target.dataset.id, 'Failed', prompt("Reason for failure:"));
        });
    } catch (error) {
        console.error("Error fetching admin withdrawals from backend:", error);
        tableBody.innerHTML = '<tr><td colspan="7">Error loading withdrawal requests.</td></tr>';
    }
}

async function updateWithdrawalStatus(withdrawalId, status, reason = '') {
    if (!adminLoggedIn) {
        alert('You must be logged in as admin to perform this action.');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': currentUserId,
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData || '',
                'Authorization': 'Bearer ' + 'DEMO_ADMIN_TOKEN' // Admin token
            },
            body: JSON.stringify({ status, reason })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            setupAdminWithdrawalsListener(); // Refresh admin table
            // No need to refresh user's history here; backend update will trigger their listener.
        } else {
            alert(`Failed to update status: ${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error updating withdrawal status via backend API:", error);
        alert('An error occurred. Please try again.');
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', initializeUser);
