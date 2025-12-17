import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import axios from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

const SUPABASE_URL = 'https://dhuxockwrbvsluxoqizn.supabase.co';
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_ADMIN_CHAT_ID = 'YOUR_ADMIN_CHAT_ID';

const tableBody = document.getElementById('withdrawalsTable').getElementsByTagName('tbody')[0];

async function loadWithdrawals() {
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*, users(telegram_username)')
    .order('created_at', { ascending: false });

  tableBody.innerHTML = '';
  withdrawals.forEach(w => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${w.id}</td>
      <td>${w.users.telegram_username}</td>
      <td>${w.amount}</td>
      <td class="${w.status}">${w.status.toUpperCase()}</td>
      <td>${new Date(w.created_at).toLocaleString()}</td>
      <td>
        ${w.status === 'pending' ? `<button onclick="approveWithdrawal(${w.id})">✅ Approve</button>
        <button onclick="denyWithdrawal(${w.id})">❌ Deny</button>` : ''}
      </td>
    `;
  });
}

window.approveWithdrawal = async function(id) {
  await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
  loadWithdrawals();
  notifyTelegram(`Withdrawal #${id} approved ✅`);
}

window.denyWithdrawal = async function(id) {
  await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', id);
  loadWithdrawals();
  notifyTelegram(`Withdrawal #${id} denied ❌`);
}

async function notifyTelegram(message) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text: message
  });
}

document.getElementById('refreshBtn').addEventListener('click', loadWithdrawals);
document.getElementById('searchUserBtn').addEventListener('click', async () => {
  const username = prompt("Enter Telegram username:");
  const { data: user } = await supabase.from('users').select('*').eq('telegram_username', username).single();
  alert(user ? `Balance: ${user.balance} pesos` : "User not found");
});
document.getElementById('exportBtn').addEventListener('click', () => alert("Export feature coming soon!"));

supabase.from('withdrawals').on('INSERT', payload => {
  loadWithdrawals();
  notifyTelegram(`New withdrawal request: #${payload.new.id}`);
}).subscribe();

loadWithdrawals();
