import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import axios from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

const SUPABASE_URL = 'https://dhuxockwrbvsluxoqizn.supabase.co';
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_ADMIN_CHAT_ID = 'YOUR_ADMIN_CHAT_ID';

const withdrawalsTable = document.getElementById('withdrawalsTable')?.getElementsByTagName('tbody')[0];

async function loadStats() {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact' });
  const { data: withdrawals } = await supabase.from('withdrawals').select('*');
  const { data: earnings } = await supabase.from('earnings').select('amount');
  const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

  document.getElementById('totalUsers').innerText = totalUsers || 0;
  document.getElementById('totalWithdrawals').innerText = withdrawals.length || 0;
  document.getElementById('totalEarnings').innerText = totalEarnings || 0;
}

async function loadWithdrawals() {
  if (!withdrawalsTable) return;
  const { data: withdrawals } = await supabase.from('withdrawals').select('*, users(telegram_username)').order('created_at', { ascending: false });
  withdrawalsTable.innerHTML = '';
  withdrawals.forEach(w => {
    const row = withdrawalsTable.insertRow();
    row.innerHTML = `
      <td>${w.id}</td>
      <td>${w.users.telegram_username}</td>
      <td>${w.amount}</td>
      <td class="${w.status}">${w.status}</td>
      <td>
        ${w.status === 'pending' ? `<button onclick="approveWithdrawal(${w.id})">Approve</button>
        <button onclick="rejectWithdrawal(${w.id})">Reject</button>` : ''}
      </td>
    `;
  });
}

window.approveWithdrawal = async function(id) {
  await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);
  loadWithdrawals();
  notifyTelegram(`Withdrawal #${id} approved!`);
}

window.rejectWithdrawal = async function(id) {
  await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', id);
  loadWithdrawals();
  notifyTelegram(`Withdrawal #${id} rejected!`);
}

async function notifyTelegram(message) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text: message
  });
}

// Realtime subscription
supabase.from('withdrawals').on('INSERT', payload => {
  loadWithdrawals();
  notifyTelegram(`New withdrawal request: #${payload.new.id}`);
}).subscribe();

loadStats();
loadWithdrawals();
