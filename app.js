// Earnings stored in localStorage
let earnings = parseFloat(localStorage.getItem('earnings')) || 0;
document.getElementById('earnings')?.innerText = earnings.toFixed(3);

// Watch ad with Monetag Rewarded Interstitial
function watchAd(adId) {
    show_10276123().then(() => {
        setTimeout(() => {
            earnings += 0.025; // Each ad gives 0.025 PHP
            localStorage.setItem('earnings', earnings);
            document.getElementById('earnings').innerText = earnings.toFixed(3);
            alert('You earned 0.025 PHP!');
        }, 10000); // Auto-confirm after 10 seconds
    }).catch(e => console.log('Ad error:', e));
}

// Request Withdrawal
function requestWithdraw(amount) {
    amount = parseFloat(amount);
    if(amount < 1 || amount > 99) return alert("Withdrawal must be 1-99 PHP!");
    let withdrawals = JSON.parse(localStorage.getItem('withdrawals')) || [];
    withdrawals.push({amount, approved: false});
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
    alert("Withdrawal request sent!");
}

// Owner auto-approve withdrawals
function ownerApprove(password) {
    if(password === "Propetas6") {
        let pending = JSON.parse(localStorage.getItem('withdrawals')) || [];
        pending.forEach(w => w.approved = true);
        localStorage.setItem('withdrawals', JSON.stringify(pending));
        alert("All withdrawals approved!");
        location.reload();
    } else {
        alert("Incorrect Password");
    }
}
