// cooldown map
const cooldowns = {
  btn1: 0,
  btn2: 0,
  btn3: 0
};

const cooldownTime = 45 * 1000; // 45 seconds cooldown

function handleClick(btnId) {
  const now = Date.now();
  if (now - cooldowns[btnId] < cooldownTime) {
    alert("Please wait before clicking again!");
    return;
  }

  cooldowns[btnId] = now;

  // Show rewarded popup ad
  show_10276123('pop').then(() => {
    alert("You have received your reward!");
  }).catch((e) => {
    console.error(e);
  });

  // Add active class for visual effect (optional)
  const btn = document.getElementById(btnId);
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);
}

// attach buttons
document.getElementById('btn1').addEventListener('click', () => handleClick('btn1'));
document.getElementById('btn2').addEventListener('click', () => handleClick('btn2'));
document.getElementById('btn3').addEventListener('click', () => handleClick('btn3'));

// optional: auto in-app interstitial every 30s
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
