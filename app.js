// app.js - 6-color game logic + Monetag ads + GCash withdrawal

const COLORS = ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
const BOARD_SIZE = 18;
let board = [];
let first = null, second = null;
let matched = 0;
let coins = 0, php = 0;
const REWARD_PHP = 0.012;

function updateUI(){
  document.getElementById('coins').textContent = 'Coins: ' + coins;
  document.getElementById('phpBalance').textContent = 'PHP: ' + php.toFixed(3);
  document.getElementById('dispPhp').textContent = php.toFixed(3);
}

function createBoard(){
  const pairsNeeded = BOARD_SIZE / 2;
  let pairs = [];
  for(let i=0;i<pairsNeeded;i++){
    const color = COLORS[i % COLORS.length];
    pairs.push(color, color);
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  board = pairs;
  matched = 0;
  renderBoard();
}

function renderBoard(){
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  board.forEach((color, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = idx;
    tile.dataset.color = color;
    tile.style.background = '#222';
    tile.addEventListener('click', onTileClick);
    boardEl.appendChild(tile);
  });
  document.getElementById('message').textContent = '';
}

function onTileClick(e){
  const t = e.currentTarget;
  if(t.classList.contains('matched') || t===first || t===second) return;
  revealTile(t);
  if(!first){ first = t; return; }
  second = t;
  checkMatch();
}

function revealTile(tile){ tile.style.background = tile.dataset.color; }
function hideTile(tile){ tile.style.background = '#222'; }

function checkMatch(){
  if(first.dataset.color === second.dataset.color){
    first.classList.add('matched'); second.classList.add('matched');
    matched += 2; first = second = null;
    if(matched===BOARD_SIZE){ document.getElementById('message').textContent='Board cleared! 🎉'; }
  } else {
    setTimeout(()=>{ hideTile(first); hideTile(second); first=second=null; },700);
  }
}

// Monetag Ad wrapper
function playAdAndReward(){
  if(typeof show_10276123==='undefined'){ alert('Ad SDK not ready'); return; }
  show_10276123().then(()=>{
    coins+=1; php+=REWARD_PHP; updateUI();
  }).catch(err=>console.log('Ad error',err));
}

// Event listeners
document.addEventListener('DOMContentLoaded',()=>{
  createBoard(); updateUI();
  document.getElementById('shuffleBtn').addEventListener('click',createBoard);
  document.getElementById('resetBtn').addEventListener('click',()=>{ coins=0; php=0; createBoard(); updateUI(); });
  document.getElementById('clickAd1').addEventListener('click',playAdAndReward);
  document.getElementById('clickAd2').addEventListener('click',playAdAndReward);
  document.getElementById('withdrawBtn').addEventListener('click',()=>{
    const num=document.getElementById('gcashNumber').value.trim();
    if(!num){ alert('Enter valid Gcash number'); return; }
    document.getElementById('dispNumber').textContent=num;
    alert(`Withdrawal request sent!\nNumber: ${num}\nAmount: PHP ${php.toFixed(3)}`);
  });
});
