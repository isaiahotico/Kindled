// =====================
// Navigation from index.html
// =====================
const adsRoomBtn = document.getElementById('adsRoomBtn');
if (adsRoomBtn) {
    adsRoomBtn.addEventListener('click', () => {
        window.location.href = 'ads-room.html';
    });
}

// =====================
// Auto-play Ads Logic
// =====================
async function autoPlayAds() {
    try {
        // Rewarded Interstitial
        show_10276123().then(() => {
            console.log('Rewarded Interstitial watched');
            // Add your reward logic here
        }).catch(e => console.error(e));

        // Rewarded Popup
        show_10276123('pop').then(() => {
            console.log('Rewarded Popup watched');
            // Add your reward logic here
        }).catch(e => console.error(e));

        // In-App Interstitial
        show_10276123({
            type: 'inApp',
            inAppSettings: {
                frequency: 9999,
                capping: 0,
                interval: 1,
                timeout: 0,
                everyPage: true
            }
        }).then(() => console.log('In-App Interstitial shown'))
          .catch(e => console.error(e));

        console.log('All ads triggered automatically.');
    } catch (err) {
        console.error('Error auto-playing ads:', err);
    }
}

// Trigger ads automatically on ads-room.html
if (window.location.pathname.includes('ads-room.html')) {
    window.addEventListener('load', () => {
        autoPlayAds();
        // Repeat every 60s
        setInterval(autoPlayAds, 60000);
    });
}
