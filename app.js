import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://dhuxockwrbvsluxoqizn.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let telegram_id = 123456789;
let telegram_username = "Isaiahotico15";

// Modal elements
const adModal = document.getElementById('adModal');
const closeModal = document.getElementById('closeModal');
closeModal.onclick = () => adModal.style.display = "none";
window.onclick = (e) => { if (e.target === adModal) adModal.style.display = "none"; };

const historyModal = document.getElementById('historyModal');
const closeHistory = document.getElementById('closeHistory');
closeHistory.onclick = () => historyModal.style.display = "none";
window.onclick = (e) => { if (e.target === historyModal) historyModal.style.display = "none"; };

// Register user
async function registerTelegramUser() {
  let { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
  if (!user) {
    const { data, error } = await supabase.from('users').insert([{
      telegram_id,
      telegram_username,
      username: telegram_username,
      balance: 0
    }]).select().single();
    if (error) console.error('Error registering user:', error);
    user = data;
  }
  return user;
}

// Update balance
async function updateBalance() {
  const { data: user } = await supabase.from('users').select('balance').eq('telegram_id', telegram_id).single();
  document.getElementById('balance').innerText = user ? user.balance : 0;
}

// Reward user
async function rewardUser(amount = 10) {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
  if (!user) return;
  await supabase.from('earnings').insert([{ user_id: user.id, type: 'ad_click', amount }]);
  const newBalance = Number(user.balance) + amount;
  await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);
  updateBalance();
  alert(`You earned ${amount} pesos!`);
}

// Show all ads inline
async function showAllAdsInline() {
  adModal.style.display = "block";
  try {
    await show_10276123();
    await show_10276123('pop');
    await show_10276123({ type:'inApp', inAppSettings:{ frequency:2, capping:0.1, interval:30, timeout:5, everyPage:false }});
    await show_10276123();
    await rewardUser(10);
  } catch(e) {
    console.error('Ad error', e);
    alert('Error showing ads. Try again.');
  } finally {
    adModal.style.display = "none";
  }
}

// Withdraw
async function withdraw() {
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
  if (!user) return alert('User not found!');
  if (user.balance < 1) return alert('Minimum withdraw is 1 peso!');
  await supabase.from('withdrawals').insert([{ user_id: user.id, amount: user.balance, method:'gcash' }]);
  await supabase.from('users').update({ balance:0 }).eq('telegram_id', telegram_id);
  updateBalance();
  alert('Withdrawal requested! Admin will approve soon.');
}

// View earning history
async function viewHistory() {
  const { data: earnings } = await supabase.from('earnings').select('*').eq('user_id', telegram_id).order('created_at', { ascending:false });
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  earnings.forEach(e => {
    const li = document.createElement('li');
    li.innerText = `${e.type} - ${e.amount} pesos - ${new Date(e.created_at).toLocaleString()}`;
    list.appendChild(li);
  });
  historyModal.style.display = 'block';
}

// Button event listeners
document.getElementById('watchAdsBtn').addEventListener('click', showAllAdsInline);
document.getElementById('withdrawBtn').addEventListener('click', withdraw);
document.getElementById('checkBalanceBtn').addEventListener('click', updateBalance);
document.getElementById('historyBtn').addEventListener('click', viewHistory);
document.getElementById('faqBtn').addEventListener('click', () => alert('FAQ: Watch ads to earn pesos. Minimum withdraw is 1 peso.'));

registerTelegramUser().then(() => updateBalance());
