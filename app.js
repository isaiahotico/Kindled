const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'public-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const userId = 1; // logged-in user
let userBalance = 50000;

// Elements
const displayNameEl = document.getElementById('displayName');
const updateNameBtn = document.getElementById('updateNameBtn');
const balanceEl = document.getElementById('userBalance');
const withdrawBtn = document.getElementById('withdrawBtn');
const gcashInput = document.getElementById('gcashNumber');
const amountInput = document.getElementById('withdrawAmount');
const userTbody = document.querySelector('#userWithdrawalTable tbody');
const adminTbody = document.querySelector('#withdrawalTable tbody');
const adminSearch = document.getElementById('adminSearch');

// ---------------- Telegram Name Update ----------------
async function updateTelegramName() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if(!telegramUser) return alert('Unable to fetch Telegram user info');
    const telegramName = telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '');
    const telegramId = telegramUser.id;

    await supabase.from('users').upsert([{ id:userId, telegram_id:telegramId, name:telegramName }], { onConflict:['id'] });
    displayNameEl.textContent = `User: ${telegramName}`;
    alert(`Telegram name updated: ${telegramName}`);
    renderUserTable();
}

updateNameBtn.addEventListener('click', updateTelegramName);

// Load name initially
async function loadUserName() {
    const { data } = await supabase.from('users').select('name').eq('id', userId).single();
    displayNameEl.textContent = data?.name ? `User: ${data.name}` : 'User: Unknown';
}

loadUserName();

// ---------------- User Withdrawal ----------------
withdrawBtn.addEventListener('click', async () => {
    const gcash = gcashInput.value.trim();
    const amount = parseFloat(amountInput.value);
    if(!gcash || amount<=0) return alert('Enter valid GCash number and amount');
    if(amount>userBalance) return alert('Insufficient balance');

    const { data: userData } = await supabase.from('users').select('name, balance').eq('id',userId).single();
    const userName = userData?.name || 'Unknown User';
    const beforeBalance = userData?.balance || userBalance;
    const afterBalance = beforeBalance - amount;

    await supabase.from('withdrawals').insert([{
        user_id:userId, user:userName, gcash, amount, status:'pending',
        requested_at:new Date(), user_balance_before:beforeBalance, user_balance_after:afterBalance
    }]);
    userBalance = afterBalance;
    balanceEl.textContent = `₱${userBalance}`;
    gcashInput.value=''; amountInput.value='';
});

// ---------------- Render User Table ----------------
async function renderUserTable() {
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', userId).order('requested_at',{ascending:false});
    userTbody.innerHTML='';
    data.forEach(w=>{
        const tr=document.createElement('tr');
        const statusClass = w.status==='pending'?'status-pending': w.status==='approved'?'status-approved':'status-denied';
        tr.innerHTML=`<td>₱${w.amount}</td><td class="${statusClass}">${w.status}</td><td>${new Date(w.requested_at).toLocaleString()}</td>`;
        userTbody.appendChild(tr);
    });
}

// ---------------- Render Admin Table ----------------
async function renderAdminTable(search='') {
    let query = supabase.from('withdrawals').select('*').order('requested_at',{ascending:false});
    if(search) query = query.ilike('user', `%${search}%`).or(`gcash.ilike.%${search}%`);
    const { data } = await query;

    adminTbody.innerHTML='';
    data.forEach(w=>{
        const tr=document.createElement('tr');
        const statusClass = w.status==='pending'?'status-pending': w.status==='approved'?'status-approved':'status-denied';
        tr.innerHTML=`
            <td><a href="https://t.me/${w.telegram_username || ''}" target="_blank">${w.user}</a></td>
            <td>${w.gcash}</td>
            <td>₱${w.amount}</td>
            <td class="${statusClass}">${w.status}</td>
            <td>${new Date(w.requested_at).toLocaleString()}</td>
            <td>${w.status==='pending'? `<button class="approve-btn" onclick="approve(${w.id})">Approve</button> <button class="deny-btn" onclick="deny(${w.id})">Deny</button>`:''}</td>
        `;
        adminTbody.appendChild(tr);
    });
}

// ---------------- Admin Approve/Deny ----------------
async function approve(id){
    const { data, error } = await supabase.from('withdrawals').select('*').eq('id',id).single();
    if(error) return console.error(error);
    await supabase.from('withdrawals').update({status:'approved', approved_at:new Date()}).eq('id',id);
    alert(`Withdrawal ₱${data.amount} approved for ${data.user}`);
}

async function deny(id){
    const { data, error } = await supabase.from('withdrawals').select('*').eq('id',id).single();
    if(error) return console.error(error);
    userBalance += data.amount;
    balanceEl.textContent=`₱${userBalance}`;
    await supabase.from('withdrawals').update({status:'denied', approved_at:new Date()}).eq('id',id);
    alert(`Withdrawal ₱${data.amount} denied for ${data.user}`);
}

// ---------------- Search ----------------
adminSearch.addEventListener('input', ()=>{ renderAdminTable(adminSearch.value); });

// ---------------- Realtime ----------------
supabase.channel('public:withdrawals')
    .on('postgres_changes',{event:'*', schema:'public', table:'withdrawals'}, payload=>{
        renderUserTable();
        renderAdminTable(adminSearch.value);
    }).subscribe();

// Initial render
renderUserTable();
renderAdminTable();
