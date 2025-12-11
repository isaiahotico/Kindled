/* ===== Navigation ===== */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e; 
});

function navigate(page) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    switch(page) {
        case 'withdrawals':
            showWithdrawalsPage();
            break;
        case 'ads':
            showAdsPage();
            break;
        default:
            content.innerHTML = 'Page not found!';
    }
}

/* ===== Floating Background Shapes ===== */
const colors = ['#ff0','#f0f','#0ff','#0f0','#f00','#00f','#fff'];
function createShape() {
    const shape = document.createElement('div');
    shape.classList.add('floating-shape');
    shape.style.background = colors[Math.floor(Math.random()*colors.length)];
    shape.style.left = Math.random()*100 + 'vw';
    shape.style.width = Math.random()*20+10+'px';
    shape.style.height = shape.style.width;
    document.getElementById('background').appendChild(shape);
    setTimeout(() => shape.remove(), 10000);
}
setInterval(createShape, 500);

/* ===== Withdrawals ===== */
let firstTimeWithdrawal = true;

function showWithdrawalsPage() {
    const content = document.getElementById('content');
    if(firstTimeWithdrawal) {
        content.innerHTML = `
            <h2 class="rainbow-text">First-Time Withdrawal</h2>
            <p>Watch this YouTube video before withdrawing:</p>
            <iframe id="youtubeVideo" width="100%" height="200" 
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" 
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            <p>Enter the code shown in the video:</p>
            <input id="videoCode" type="text" placeholder="Enter Code">
            <button onclick="verifyVideoCode()">Verify Code</button>
            <div id="withdrawStatus"></div>
        `;
    } else renderWithdrawalForm();
}

function verifyVideoCode() {
    const enteredCode = document.getElementById('videoCode').value.trim();
    const correctCode = "RUBY2025";
    if(enteredCode === correctCode) {
        firstTimeWithdrawal = false;
        document.getElementById('withdrawStatus').innerText = "✅ Code verified!";
        renderWithdrawalForm();
    } else {
        document.getElementById('withdrawStatus').innerText = "❌ Incorrect code.";
    }
}

function renderWithdrawalForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2 class="rainbow-text">Withdraw Ruby Coins</h2>
        <label>Amount (Ruby <img src="ruby-icon.png" width="20" /> ):</label>
        <input id="rubyAmount" type="number" min="500" max="10000">
        <p id="conversionPreview">Converted value: 0 PHP</p>
        <label>Select Crypto:</label>
        <select id="cryptoChoice">
            <option value="usdt">USDT (0.000085 per Ruby)</option>
            <option value="trx">TRX (0.003 per Ruby)</option>
            <option value="ltc">LTC (0.000001 per Ruby)</option>
        </select>
        <label>FaucetPay Account:</label>
        <input id="faucetpayAccount" type="text">
        <button onclick="startWithdrawal()">Process Withdrawal</button>
        <div id="withdrawStatus"></div>
        <button onclick="adminPanel()">Admin Panel</button>
    `;
}

/* Live conversion */
document.addEventListener('input', (e)=>{
    if(e.target.id==='rubyAmount'){
        const ruby = parseFloat(e.target.value) || 0;
        const phpValue = (ruby * 0.005).toFixed(3);
        document.getElementById('conversionPreview').innerText = `Converted value: ${phpValue} PHP`;
    }
});

function startWithdrawal() {
    const amount = document.getElementById('rubyAmount').value;
    const crypto = document.getElementById('cryptoChoice').value;
    const account = document.getElementById('faucetpayAccount').value;
    if(amount < 500) { alert('Minimum is 500 Ruby'); return; }
    if(!account) { alert('Enter your account'); return; }
    document.getElementById('withdrawStatus').innerText = `Processing ${amount} Ruby to ${crypto} account ${account}...`;
    setTimeout(() => {
        document.getElementById('withdrawStatus').innerText = `✅ Paid at ${new Date().toLocaleString()}`;
    }, 2000);
}

/* Admin Table */
let withdrawalData = [];
for(let i=1;i<=1000;i++) {
    withdrawalData.push({
        user: "User"+i,
        amount: Math.floor(Math.random()*9500)+500,
        crypto: ["USDT","TRX","LTC"][Math.floor(Math.random()*3)],
        account: "account"+i,
        status: ["Processing","Paid"][Math.floor(Math.random()*2)],
        timestamp: new Date().toLocaleString()
    });
}
let currentPage = 1;
const rowsPerPage = 10;

function adminPanel() {
    const password = prompt("Enter Admin Password:");
    if(password === 'siditsnicheahit') showAdminTable();
    else alert('Incorrect password');
}

function showAdminTable() {
    const content = document.getElementById('content');
    content.innerHTML = `<h2>Withdrawal Area (Admin)</h2>
                         <div id="adminTable"></div>
                         <div style="margin-top:10px;">
                             <button onclick="prevPage()">Prev</button>
                             <span id="pageInfo"></span>
                             <button onclick="nextPage()">Next</button>
                         </div>`;
    renderTablePage();
}

function renderTablePage() {
    const tableDiv = document.getElementById('adminTable');
    tableDiv.innerHTML = '';
    const start = (currentPage-1)*rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = withdrawalData.slice(start,end);

    let tableHTML = '<table><tr><th>User</th><th>Amount</th><th>Crypto</th><th>Account</th><th>Status</th><th>Timestamp</th></tr>';
    pageData.forEach(item => {
        tableHTML += `<tr>
            <td>${item.user}</td>
            <td>${item.amount}</td>
            <td>${item.crypto}</td>
            <td>${item.account}</td>
            <td>${item.status}</td>
            <td>${item.timestamp}</td>
        </tr>`;
    });
    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;
    document.getElementById('pageInfo').innerText = `Page ${currentPage} / ${Math.ceil(withdrawalData.length/rowsPerPage)}`;
}
function prevPage(){ if(currentPage>1){ currentPage--; renderTablePage(); } }
function nextPage(){ if(currentPage<Math.ceil(withdrawalData.length/rowsPerPage)){ currentPage++; renderTablePage(); } }

/* ===== ADS CORNER ===== */
function showAdsPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2 class="rainbow-text">ADS CORNER</h2>
        <button onclick="playAd(1)">Ad Button 1 (Monetag)</button>
        <button onclick="playAd(2)">Ad Button 2 (Monetag)</button>
        <button onclick="playAd(3)">Ad Button 3</button>
        <button onclick="playAd(4)">Ad Button 4</button>
        <div id="adsStatus"></div>
        <button id="installBtn" onclick="installPWA()">Install App</button>
    `;
}

/* Play Ads */
function playAd(button) {
    let adPromise;
    if(button <= 2) adPromise = show_10276123();
    else adPromise = show_10276123('pop');

    adPromise.then(() => {
        document.getElementById('adsStatus').innerText = '✅ You earned 1 Ruby!';
    }).catch(() => {
        document.getElementById('adsStatus').innerText = '⚠ Ad error, try again.';
    });
}

/* PWA Install */
function installPWA() {
    if(deferredPrompt){
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choice => {
            deferredPrompt = null;
        });
    } else alert('Installation not available.');
}
