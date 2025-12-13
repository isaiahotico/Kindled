// User setup
let username = localStorage.getItem('username');
if(!username){
    username = prompt("Enter your name:");
    localStorage.setItem('username', username);
}

// Earnings
let earnings = parseFloat(localStorage.getItem('earnings')) || 0;
document.getElementById('earnings')?.innerText = earnings.toFixed(3);

// Update leaderboard
function updateLeaderboard(){
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    let user = leaderboard.find(u => u.name === username);
    if(user) user.earnings = earnings;
    else leaderboard.push({name: username, earnings: earnings});
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Watch combined 3-4 ads in single click
function watchCombinedAds(){
    let adPromises = [
        show_10276123(),
        show_10276123('pop'),
        show_10276123({type:'inApp', inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}})
    ];
    Promise.allSettled(adPromises).then(()=>{
        setTimeout(()=>{
            earnings += 0.025 * adPromises.length; // total earnings per click
            localStorage.setItem('earnings', earnings);
            document.getElementById('earnings').innerText = earnings.toFixed(3);
            updateLeaderboard();
            alert(`You earned ${(0.025 * adPromises.length).toFixed(3)} PHP!`);
        },10000);
    }).catch(e=>console.log('Ads error:',e));
}

// Withdrawals
function requestWithdraw(amount,gcash){
    amount = parseFloat(amount);
    if(amount < 1 || amount > 99) return alert("Withdrawal must be 1-99 PHP!");
    let withdrawals = JSON.parse(localStorage.getItem('withdrawals')) || [];
    withdrawals.push({amount,approved:false,user:username,gcash:gcash});
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
    alert("Withdrawal request sent!");
}

// Owner auto-approve
function ownerApprove(password){
    if(password==="Propetas6"){
        let pending = JSON.parse(localStorage.getItem('withdrawals')) || [];
        pending.forEach(w=>w.approved=true);
        localStorage.setItem('withdrawals', JSON.stringify(pending));
        alert("All withdrawals approved!");
        location.reload();
    } else alert("Incorrect Password");
}

// Footer: date & time
function updateFooter(){
    const footer = document.getElementById('footer');
    if(!footer) return;
    setInterval(()=>{
        const now = new Date();
        footer.innerText = now.toLocaleString();
    },1000);
}
