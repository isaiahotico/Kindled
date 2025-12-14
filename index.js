const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

const bot = new Telegraf('8501615110:AAEQBCoLK60aU1TOF6UcTJCQ92YdouVCfgE');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  databaseURL: "https://YOUR_PROJECT.firebaseio.com"
});

const db = admin.database();
const ADMIN_ID = 7398171299; // Replace with your Telegram ID
const ADMIN_PASSWORD = "Propetas6";
const COIN_VALUE_PHP = 0.01;
const PHP_TO_USDT = 0.018;
const NORMAL_AD_COOLDOWN = 10000; // 10s
const BONUS_AD_COOLDOWN = 300000; // 5min

// ------------------- USER PROFILE AND REFERRALS -------------------
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name;
  const startPayload = ctx.startPayload || ''; // referral payload

  let referrerId = null;
  if (startPayload.startsWith('user_')) {
    referrerId = startPayload.replace('user_', '');
    if (referrerId === String(userId)) referrerId = null;
  }

  const userRef = db.ref(`users/${userId}`);
  const snapshot = await userRef.get();
  if (!snapshot.exists()) {
    await userRef.set({
      username,
      telegramId: userId,
      coins: 0,
      lastNormalAd: 0,
      lastBonusAd: 0,
      referral_balance: 0,
      referrerId: referrerId || null,
      invites: 0
    });

    if (referrerId) {
      const refRef = db.ref(`users/${referrerId}`);
      const refSnap = await refRef.get();
      const currentInvites = refSnap.exists() ? (refSnap.val().invites || 0) : 0;
      await refRef.update({ invites: currentInvites + 1 });
    }
  }

  ctx.reply(`Welcome ${username}!\nLet's complete your profile.`);
  await userRef.update({ step: 'sex' });
  ctx.reply('What is your sex? (Male/Female/Other)');
});

// ------------------- PROFILE COLLECTION -------------------
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message.text;
  const userRef = db.ref(`users/${userId}`);
  const snapshot = await userRef.get();
  if (!snapshot.exists()) return;

  const step = snapshot.val().step;

  if (step === 'sex') {
    await userRef.update({ sex: message, step: 'age' });
    return ctx.reply('How old are you?');
  }

  if (step === 'age') {
    const age = parseInt(message);
    if (isNaN(age)) return ctx.reply('Please enter a valid number for age.');
    const username = snapshot.val().username;
    const sex = snapshot.val().sex;
    const bio = `Hi, I'm ${username}, ${age} years old, ${sex}`;
    await userRef.update({ age, bio, step: 'completed' });
    return ctx.reply(`✅ Profile completed!\nYour bio: ${bio}\nUse /watchads to earn coins.`);
  }

  const pendingRef = db.ref(`pending_withdraw/${userId}`);
  const pendingSnap = await pendingRef.get();
  if (pendingSnap.exists()) {
    const { method, coins } = pendingSnap.val();
    await processWithdrawal(userId, coins, method, message);
    await pendingRef.remove();
    return ctx.reply(`✅ Withdrawal request submitted.\nCheck admin approval later.`);
  }

  if (userId === ADMIN_ID) {
    const sessionRef = db.ref(`admin_sessions/${userId}`);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists() || !sessionSnap.val().authenticated) {
      if (message === ADMIN_PASSWORD) {
        await sessionRef.set({ authenticated: true });
        ctx.reply('✅ Password correct. Access granted.');
        return showAdminMenu(ctx);
      } else {
        return ctx.reply('❌ Incorrect password. Try again.');
      }
    }
  }
});

// ------------------- ADS COMMANDS -------------------
bot.command('watchads', async (ctx) => {
  const userId = ctx.from.id;
  const now = Date.now();
  const userRef = db.ref(`users/${userId}`);
  const userSnap = await userRef.get();
  const lastNormal = userSnap.val().lastNormalAd || 0;

  if (now - lastNormal < NORMAL_AD_COOLDOWN) {
    const waitTime = Math.ceil((NORMAL_AD_COOLDOWN - (now - lastNormal)) / 1000);
    return ctx.reply(`⏳ Wait ${waitTime}s before watching normal ads.`);
  }

  for (let i = 1; i <= 4; i++) console.log(`Normal ad ${i} for user ${userId}`);

  const currentCoins = userSnap.val().coins || 0;
  await userRef.update({ coins: currentCoins + 1, lastNormalAd: now });
  ctx.reply(`🎉 4 ads watched! Earned 1 coin.\nTotal coins: ${currentCoins + 1} (${((currentCoins + 1)*COIN_VALUE_PHP).toFixed(2)} PHP)`);
});

bot.command('bonusads', async (ctx) => {
  const userId = ctx.from.id;
  const now = Date.now();
  const userRef = db.ref(`users/${userId}`);
  const userSnap = await userRef.get();
  const lastBonus = userSnap.val().lastBonusAd || 0;

  if (now - lastBonus < BONUS_AD_COOLDOWN) {
    const waitTime = Math.ceil((BONUS_AD_COOLDOWN - (now - lastBonus)) / 1000);
    return ctx.reply(`⏳ Bonus gift available in ${waitTime}s.`);
  }

  for (let i = 1; i <= 4; i++) console.log(`Bonus ad ${i} for user ${userId}`);

  const currentCoins = userSnap.val().coins || 0;
  await userRef.update({ coins: currentCoins + 1.5, lastBonusAd: now });
  ctx.reply(`🎁 Bonus gift! 4 ads watched, earned 1.5 coins.\nTotal coins: ${currentCoins + 1.5} (${((currentCoins + 1.5)*COIN_VALUE_PHP).toFixed(2)} PHP)`);
});

// ------------------- WITHDRAWAL -------------------
bot.command('withdraw', async (ctx) => {
  const userId = ctx.from.id;
  const snapshot = await db.ref(`users/${userId}`).get();
  const coins = snapshot.val().coins || 0;

  if (coins < 100) return ctx.reply('❌ Minimum withdrawal: 100 coins.');

  ctx.reply('Choose withdrawal method:', Markup.inlineKeyboard([
    Markup.button.callback('GCash (PHP)', 'withdraw_gcash'),
    Markup.button.callback('FaucetPay (USDT)', 'withdraw_faucetpay')
  ]));
});

bot.on('callback_query', async (ctx) => {
  const userId = ctx.from.id;
  const data = ctx.callbackQuery.data;

  if (userId === ADMIN_ID && (data.startsWith('approve_') || data.startsWith('reject_') || data === 'admin_summary' || data === 'admin_pending' || data === 'return_home')) {
    return handleAdminCallback(ctx);
  }

  if (data === 'withdraw_gcash' || data === 'withdraw_faucetpay') {
    const snapshot = await db.ref(`users/${userId}`).get();
    const coins = snapshot.val().coins || 0;
    if (coins < 100) return ctx.answerCbQuery('Balance too low');

    ctx.answerCbQuery();
    const text = data === 'withdraw_gcash' ? 'Enter your GCash number:' : 'Enter your FaucetPay email:';
    await db.ref(`pending_withdraw/${userId}`).set({ method: data, coins });
    ctx.reply(text);
  }
});

// ------------------- PROCESS WITHDRAWAL -------------------
async function processWithdrawal(userId, coins, method, accountInfo) {
  const userRef = db.ref(`users/${userId}`);
  const userSnap = await userRef.get();
  const referrerId = userSnap.val().referrerId;
  const amountPHP = coins * COIN_VALUE_PHP;
  const amountUSDT = coins * COIN_VALUE_PHP * PHP_TO_USDT;

  await userRef.update({ coins: 0 });

  const requestsRef = db.ref('withdraw_requests');
  const newRequestRef = requestsRef.push();
  await newRequestRef.set({
    userId,
    username: userSnap.val().username,
    method,
    coins,
    amountPHP,
    amountUSDT,
    accountInfo,
    status: 'pending',
    timestamp: Date.now()
  });

  if (referrerId) {
    const bonus = amountPHP * 0.10;
    const referrerRef = db.ref(`users/${referrerId}/referral_balance`);
    const refSnap = await referrerRef.get();
    const currentRefBalance = refSnap.exists() ? refSnap.val() : 0;
    await referrerRef.set(currentRefBalance + bonus);
  }
}

// ------------------- CLAIM REFERRAL -------------------
bot.command('claimreferral', async (ctx) => {
  const userId = ctx.from.id;
  const referrerRef = db.ref(`users/${userId}/referral_balance`);
  const snapshot = await referrerRef.get();
  const balance = snapshot.exists() ? snapshot.val() : 0;

  if (balance <= 0) return ctx.reply('❌ No referral rewards to claim.');

  const userSnap = await db.ref(`users/${userId}`).get();
  const currentCoins = userSnap.val().coins || 0;
  await db.ref(`users/${userId}`).update({ coins: currentCoins + balance });
  await referrerRef.set(0);

  ctx.reply(`✅ Claimed ${balance.toFixed(2)} PHP from referral rewards.\nTotal coins: ${currentCoins + balance}`);
});

// ------------------- REFERRAL LINK -------------------
bot.command('referral', async (ctx) => {
  const userId = ctx.from.id;
  const userSnap = await db.ref(`users/${userId}`).get();
  const invites = userSnap.val().invites || 0;

  const link = `http://t.me/SENTINEL_DARK_bot/start?start=user_${userId}`;
  const footer = `\n\n📅 ${new Date().toLocaleString()} ®2025\nContact: otico.isai2@gmail.com`;
  ctx.reply(`Your referral link: ${link}\nInvites: ${invites}${footer}`);
});

// ------------------- LEADERBOARD -------------------
bot.command('leaderboard', async (ctx) => {
  const snapshot = await db.ref('users').get();
  if (!snapshot.exists()) return ctx.reply('No users yet.');

  const users = snapshot.val();
  const userArray = Object.values(users);

  const topReferrers = userArray
    .sort((a, b) => (b.invites || 0) - (a.invites || 0))
    .slice(0, 5);

  let refText = '🏆 Top Referrers:\n';
  topReferrers.forEach((u, i) => {
    refText += `${i + 1}. ${u.username || 'User'} - ${u.invites || 0} invites\n`;
  });

  const topEarners = userArray
    .sort((a, b) => ((b.coins || 0) + (b.referral_balance || 0)) - ((a.coins || 0) + (a.referral_balance || 0)))
    .slice(0, 5);

  let earnText = '\n💰 Top Earners:\n';
  topEarners.forEach((u, i) => {
    const totalCoins = (u.coins || 0) + (u.referral_balance || 0);
    const totalPHP = (totalCoins * COIN_VALUE_PHP).toFixed(2);
    earnText += `${i + 1}. ${u.username || 'User'} - ${totalCoins.toFixed(2)} coins (${totalPHP} PHP)\n`;
  });

  const footer = `\n📅 ${new Date().toLocaleString()} ®2025\nContact: otico.isai2@gmail.com`;
  ctx.reply(refText + earnText + footer);
});

// ------------------- ADMIN DASHBOARD -------------------
function showAdminMenu(ctx) {
  ctx.reply('📊 Admin Dashboard:', Markup.inlineKeyboard([
    [Markup.button.callback('💰 Summary', 'admin_summary')],
    [Markup.button.callback('⏳ Pending Withdrawals', 'admin_pending')]
  ]));
}

async function handleAdminCallback(ctx) {
  const data = ctx.callbackQuery.data;

  if (data === 'admin_summary') return showSummary(ctx);
  if (data === 'admin_pending') return showPending(ctx);
  if (data === 'return_home') return showAdminMenu(ctx);

  if (data.startsWith('approve_') || data.startsWith('reject_')) {
    const requestId = data.split('_')[1];
    const requestRef = db.ref(`withdraw_requests/${requestId}`);
    const snapshot = await requestRef.get();
    if (!snapshot.exists()) return ctx.answerCbQuery('Request not found');

    const newStatus = data.startsWith('approve_') ? 'paid' : 'rejected';
    await requestRef.update({ status: newStatus });
    ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ Status updated: ${newStatus.toUpperCase()}`);
    ctx.answerCbQuery(`Request ${newStatus}`);
  }
}

async function showSummary(ctx) {
  const snapshot = await db.ref('withdraw_requests').get();
  const requests = snapshot.exists() ? snapshot.val() : {};

  let summary = { pending: 0, paid: 0, rejected: 0, pendingAmount: 0, paidAmount: 0, rejectedAmount: 0 };
  for (const key in requests) {
    const r = requests[key];
    if (r.status === 'pending') { summary.pending++; summary.pendingAmount += r.amountPHP; }
    else if (r.status === 'paid') { summary.paid++; summary.paidAmount += r.amountPHP; }
    else if (r.status === 'rejected') { summary.rejected++; summary.rejectedAmount += r.amountPHP; }
  }

  const footer = `\n\n📅 ${new Date().toLocaleString()} ®2025\nContact: otico.isai2@gmail.com`;
  const message = `
📊 Withdrawal Summary:

⏳ Pending: ${summary.pending} | Total: ${summary.pendingAmount.toFixed(2)} PHP
✅ Paid: ${summary.paid} | Total: ${summary.paidAmount.toFixed(2)} PHP
❌ Rejected: ${summary.rejected} | Total: ${summary.rejectedAmount.toFixed(2)} PHP
${footer}`;

  ctx.editMessageText(message, Markup.inlineKeyboard([
    [Markup.button.callback('🏠 Return Home', 'return_home')]
  ]));
}

async function showPending(ctx) {
  const snapshot = await db.ref('withdraw_requests').get();
  const requests = snapshot.exists() ? snapshot.val() : {};
  for (const key in requests) {
    const r = requests[key];
    if (r.status !== 'pending') continue;

    const text = `📄 Pending Withdrawal\nID: ${key}\nUser: ${r.username} (${r.userId})\nMethod: ${r.method}\nCoins: ${r.coins}\nAmount: ${r.amountPHP.toFixed(2)} PHP / ${r.amountUSDT.toFixed(4)} USDT\nAccount: ${r.accountInfo}`;
    const footer = `\n\n📅 ${new Date().toLocaleString()} ®2025\nContact: otico.isai2@gmail.com`;

    await ctx.reply(text + footer, Markup.inlineKeyboard([
      [Markup.button.callback('✅ Approve', `approve_${key}`), Markup.button.callback('❌ Reject', `reject_${key}`)],
      [Markup.button.callback('🏠 Return Home', 'return_home')]
    ]));
  }
}

// ------------------- AUTOMATIC NOTIFICATIONS -------------------
setInterval(async () => {
  const snapshot = await db.ref('users').get();
  if (!snapshot.exists()) return;

  const users = snapshot.val();
  const now = Date.now();

  for (const userId in users) {
    const user = users[userId];

    if (user.step === 'completed') {
      const lastBonus = user.lastBonusAd || 0;
      if (now - lastBonus >= BONUS_AD_COOLDOWN) {
        try {
          await bot.telegram.sendMessage(userId, '🎁 Bonus gift ads are available! Use /bonusads to claim 1.5 coins.');
        } catch(e) { console.log(`Failed to notify ${userId}: ${e.message}`); }
      }
    }

    if ((user.referral_balance || 0) > 0) {
      try {
        await bot.telegram.sendMessage(userId, `💰 You have referral rewards waiting! Use /claimreferral to claim your coins.`);
      } catch(e) { console.log(`Failed to notify ${userId}: ${e.message}`); }
    }
  }
}, 120000); // 2 minutes interval

// ------------------- LAUNCH BOT -------------------
bot.launch();
console.log('Bot is running...');
