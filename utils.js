const tgUser = Telegram.WebApp.initDataUnsafe?.user;
export const uid = tgUser?.id || 'guest_' + (localStorage.getItem('guestId') || Date.now());
localStorage.setItem('guestId', uid);

export const OWNER_PASSWORD = "Propetas6";

export function checkOwnerAccess() {
  if(localStorage.getItem('isOwner')==='true') return true;
  const pass = prompt("Owner password:");
  if(pass===OWNER_PASSWORD){
    localStorage.setItem('isOwner','true');
    return true;
  }
  alert("Access denied");
  return false;
}

// Anti-Abuse
const AD_COOLDOWN = 45000;
export function canWatchAd() {
  const last = localStorage.getItem('lastAdTime');
  return !last || Date.now() - last > AD_COOLDOWN;
}

export function markAdWatched() {
  localStorage.setItem('lastAdTime', Date.now());
}
