let rubyCount = 0;
let withdrawals = [];
let ytLink = '';
let ytCode = '';

function navigateTo(page){window.location.href=page;}
document.body.addEventListener('click',()=>{
    const colors=['#333','#4CAF50','#FF69B4'];
    document.body.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
});
setInterval(()=>{
    const container=document.getElementById('effects-container');
    if(!container) return;
    const shape=document.createElement('div');
    shape.classList.add('shape');
    shape.style.left=Math.random()*window.innerWidth+'px';
    shape.style.backgroundColor='#'+Math.floor(Math.random()*16777215).toString(16);
    container.appendChild(shape);
    setTimeout(()=>container.removeChild(shape),5000);
},800);

function adminPanel(){if(prompt("Enter Admin password:")==="siditsnicheahit"){navigateTo('withdrawal-area.html');}else alert("Wrong password");}
function adminLink(){if(prompt("Enter Admin password:")==="Propetas6"){navigateTo('withdrawal-link.html');}else alert("Wrong password");}

/* Ads */
function watchAd(reward=1){
    show_10276123().then(()=>{rubyCount+=reward; updateRubyDisplay(); alert(`You earned ${reward} ruby!`);});
}
function watchAdMonetag(zone, reward=1){
    show_10276123().then(()=>{rubyCount+=reward; updateRubyDisplay(); alert(`You earned ${reward} ruby!`);});
}
function watchAdRewarded(reward=1){
    show_10276123('pop').then(()=>{rubyCount+=reward; updateRubyDisplay(); alert(`You earned ${reward} ruby!`);}).catch(e=>{});
}
function updateRubyDisplay(){const el=document.getElementById('ruby-count'); if(el) el.textContent=rubyCount;}

/* Withdrawals Page */
function processWithdrawal(){
    const amount=parseInt(document.getElementById('amount').value);
    const crypto=document.getElementById('crypto').value;
    const account=document.getElementById('account').value;
    const codeInput=document.getElementById('yt-code').value;

    if(!ytLink){alert("Admin hasn't set the YouTube link yet."); return;}
    if(codeInput!==ytCode){alert("Wrong code from YouTube video."); return;}
    if(amount<500 || amount>10000){alert("Invalid amount"); return;}
    if(rubyCount<amount){alert("Not enough rubies"); return;}
    rubyCount-=amount;
    updateRubyDisplay();

    withdrawals.push({account, crypto, amount, status:"processing", time:new Date().toLocaleString()});
    document.getElementById('withdraw-msg').textContent=`Withdrawal request submitted! Amount: ${amount} Rubies`;
}

/* Admin pages */
function renderAdminTable(){
    const container=document.getElementById('admin-table-container');
    if(!container) return;
    container.innerHTML='';
    withdrawals.forEach((w,i)=>{
        const div=document.createElement('div');
        div.classList.add('withdraw-item');
        div.innerHTML=`${i+1}. Account: ${w.account} | Crypto: ${w.crypto} | Amount: ${w.amount} | Status: <span>${w.status}</span> | Time: ${w.time} <button onclick="approve(${i})">Approve</button>`;
        container.appendChild(div);
    });
}
function approve(i){withdrawals[i].status='paid'; renderAdminTable();}
renderAdminTable();

/* Admin Link Page */
function saveYTLink(){ytLink=document.getElementById('yt-link').value; ytCode=document.getElementById('yt-admin-code').value; document.getElementById('yt-link-msg').textContent='Saved!';}

/* Install PWA */
function installPWA(){alert("PWA install triggered!");}
