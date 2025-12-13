import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { db } from "../firebase/config.js";

const userTelegramId = '<USER_TELEGRAM_ID>'; // Replace with actual Telegram ID

const coinsDisplay = document.getElementById('coins');
const referralDisplay = document.getElementById('referral-coins');
const notifications = document.getElementById('notifications');

function initDashboard() {
  const userRef = ref(db, `users/${userTelegramId}`);
  onValue(userRef, snapshot => {
    if(!snapshot.exists()) return;
    const user = snapshot.val();
    coinsDisplay.textContent = user.coins || 0;
    referralDisplay.textContent = user.total_ref_earnings || 0;
  });
}

export function notify(message, duration=3000){
  const notif = document.createElement('div');
  notif.classList.add('popup');
  notif.textContent = message;
  notifications.appendChild(notif);
  notif.style.display = 'block';
  setTimeout(()=>{ notifications.removeChild(notif); }, duration);
}

document.addEventListener('DOMContentLoaded', initDashboard);
