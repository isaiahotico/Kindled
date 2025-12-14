// Single Rewarded Interstitial
document.getElementById('btnRewardedInterstitial').addEventListener('click', () => {
    show_10276123().then(() => {
        console.log('Rewarded Interstitial watched!');
    }).catch(e => console.error(e));
});

// Single Rewarded Popup
document.getElementById('btnRewardedPopup').addEventListener('click', () => {
    show_10276123('pop').then(() => {
        console.log('Rewarded Popup watched!');
    }).catch(e => console.error(e));
});

// Single In-App Interstitial
document.getElementById('btnInAppInterstitial').addEventListener('click', () => {
    show_10276123({
        type: 'inApp',
        inAppSettings: {
            frequency: 999,
            capping: 0,
            interval: 0,
            timeout: 0,
            everyPage: false
        }
    }).then(() => console.log('In-App Interstitial shown!'))
      .catch(e => console.error(e));
});

// Double Reward Ads (2 Rewarded Interstitials + 2 Rewarded Popups)
document.getElementById('btnDoubleAds').addEventListener('click', () => {
    for (let i = 0; i < 2; i++) {
        show_10276123().then(() => console.log(`Rewarded Interstitial ${i+1} watched!`)).catch(e => console.error(e));
        show_10276123('pop').then(() => console.log(`Rewarded Popup ${i+1} watched!`)).catch(e => console.error(e));
    }
});
