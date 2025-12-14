document.getElementById('clickAdsBtn').addEventListener('click', () => {
    // Show 2 Rewarded Interstitials
    for (let i = 0; i < 2; i++) {
        show_10276123().then(() => {
            console.log(`Rewarded Interstitial ${i+1} watched!`);
        }).catch(e => console.error(e));
    }

    // Show 2 Rewarded Popups
    for (let i = 0; i < 2; i++) {
        show_10276123('pop').then(() => {
            console.log(`Rewarded Popup ${i+1} watched!`);
        }).catch(e => console.error(e));
    }

    // Optional: In-App Interstitial
    show_10276123({
        type: 'inApp',
        inAppSettings: {
            frequency: 999,  // allow showing multiple
            capping: 0,      // no cooldown
            interval: 0,
            timeout: 0,
            everyPage: false
        }
    }).then(() => {
        console.log('In-App Interstitial shown!');
    }).catch(e => console.error(e));
});
