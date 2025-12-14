const tg = window.Telegram.WebApp;
tg.ready();

const REWARD = 0.025;
const COOLDOWN = 60000;

const balanceEl = document.getElementById('balance');
const watchBtn = document.getElementById('watchAdBtn');
const cooldownText = document.getElementById('cooldownText');

const user = tg.initDataUnsafe?.user;
if (!user) alert('Open inside Telegram');

const KEY = `user_${user.id}`;
let data = JSON.parse(localStorage.getItem(KEY)) || { balance: 0, lastAd: 0 };

watchBtn.onclick = () => {
  const now = Date.now();
  if (now - data.lastAd < COOLDOWN) return;

  show_10276123('pop').then(() => {
    data.balance += REWARD;
    data.lastAd = Date.now();
    save();
    update();
    tg.HapticFeedback.impactOccurred('medium');
  });
};

function update() {
  balanceEl.textContent = `₱${data.balance.toFixed(3)}`;
  const r = COOLDOWN - (Date.now() - data.lastAd);
  watchBtn.disabled = r > 0;
  cooldownText.textContent = r > 0 ? `⏳ Wait ${Math.ceil(r / 1000)}s` : '';
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

setInterval(update, 1000);
update();