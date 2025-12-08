# app.js
const grid = document.getElementById('grid');
const watchAdBtn = document.getElementById('watchAdBtn');
const resetBtn = document.getElementById('resetBtn');
const statusText = document.getElementById('status');
const earningsText = document.getElementById('earnings');
const menuBtn = document.getElementById('menuBtn');

let earnings = 0;
let selected = [];
let lock = false;
let gameTimer = null;

function shuffle(arr){return arr.sort(()=>Math.random()-0.5)}

function startGame(){
    clearTimeout(gameTimer);
    const base=[1,1,2,2,3,3];
    const values=shuffle(base);
    grid.innerHTML='';
    values.forEach(val=>{
        const tile=document.createElement('button');
        tile.className='tile';
        tile.dataset.value=val;
        tile.onclick=()=>reveal(tile);
        grid.appendChild(tile);
    });
    selected=[];
    statusText.innerText='';
    gameTimer=setTimeout(()=>startGame(),5*60*1000);
}

function reveal(tile){
    if(lock||tile.classList.contains('revealed'))return;
    tile.classList.add('revealed');
    tile.innerText=tile.dataset.value;
    selected.push(tile);
    if(selected.length===2){lock=true;setTimeout(()=>{checkMatch();lock=false},520)}
}

function checkMatch(){
    const[a,b]=selected;
    if(a.dataset.value!==b.dataset.value){a.classList.remove('revealed');b.classList.remove('revealed');a.innerText='';b.innerText=''}
    selected=[];
    if(document.querySelectorAll('.tile:not(.revealed)').length===0)finishGame();
}

function finishGame(){
    addReward();
    statusText.innerText='Game finished! You earned ₱0.026';
    setTimeout(()=>startGame(),5000);
}

function addReward(){earnings+=0.026;earningsText.innerText=`Earned: ₱${earnings.toFixed(3)}`}

menuBtn.onclick=()=>menuBtn.classList.toggle('active');
resetBtn.onclick=()=>startGame();

watchAdBtn.onclick=()=>{
    if(typeof show_10276123==='function'){
        show_10276123().then(()=>{addReward();statusText.innerText='Rewarded ad watched! +₱0.026'});
    }
}

if(typeof show_10276123==='function'){
    show_10276123({type:'inApp',inAppSettings:{frequency:2,capping:0.1,interval:30,timeout:5,everyPage:false}});
}

setInterval(()=>{if(window.showGiga)window.showGiga().then(()=>addReward())},5*60*1000);

startGame();