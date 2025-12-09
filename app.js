// cooldown map
const cooldowns = {
  btn1: 0,
  btn2: 0,
  btn3: 0,
  btn4: 0,
  btn5: 0,
  btn6: 0,
  btn7: 0
};

const cooldownTime = 45 * 1000; // 45 seconds cooldown

// Popup Rewarded Ad Buttons (btn1-3)
function handlePopupClick(btnId) {
  const now = Date.now();
  if (now - cooldowns[btnId] < cooldownTime) {
    alert("Please wait before clicking again!");
    return;
  }
  cooldowns[btnId] = now;

  show_10276123('pop').then(() => {
    alert("You have received your reward!");
  }).catch((e) => console.error(e));

  const btn = document.getElementById(btnId);
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);
}

// Interstitial Rewarded Ad Buttons (btn4-7)
function handleInterstitialClick(btnId) {
  const now = Date.now();
  if (now - cooldowns[btnId] < cooldownTime) {
    alert("Please wait before clicking again!");
    return;
  }
  cooldowns[btnId] = now;

  show_10276123().then(() => {
    alert('You have seen an ad!');
  }).catch((e) => console.error(e));

  const btn = document.getElementById(btnId);
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);
}

// Attach button listeners
document.getElementById('btn1').addEventListener('click', () => handlePopupClick('btn1'));
document.getElementById('btn2').addEventListener('click', () => handlePopupClick('btn2'));
document.getElementById('btn3').addEventListener('click', () => handlePopupClick('btn3'));
document.getElementById('btn4').addEventListener('click', () => handleInterstitialClick('btn4'));
document.getElementById('btn5').addEventListener('click', () => handleInterstitialClick('btn5'));
document.getElementById('btn6').addEventListener('click', () => handleInterstitialClick('btn6'));
document.getElementById('btn7').addEventListener('click', () => handleInterstitialClick('btn7'));

// Optional auto in-app interstitial every 30s
setInterval(() => {
  show_10276123({
    type: 'inApp',
    inAppSettings: {
      frequency: 1,
      capping: 0,
      interval: 30,
      timeout: 2,
      everyPage: false
    }
  });
}, 30000);
