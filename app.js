// ---------------- Global Variables ----------------
let coins = 0;

// Sounds
const coinSound = new Audio('https://freesound.org/data/previews/341/341695_3248244-lq.mp3');
const clickSound = new Audio('https://freesound.org/data/previews/66/66717_931655-lq.mp3');

// ---------------- Coin Update ----------------
function updateCoins(amount=0){
    coins += amount;
    document.getElementById('coins').innerText = `Coins: ${coins}`;
    if(amount>0) coinSound.play();
    createStarEffect();
}

// ---------------- Star Effect ----------------
function createStarEffect(){
    let star = document.createElement('div');
    star.className = 'star';
    star.style.width = star.style.height = Math.random()*15 + 10 + 'px';
    star.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
    star.style.left = Math.random()*window.innerWidth + 'px';
    star.style.top = Math.random()*window.innerHeight + 'px';
    document.body.appendChild(star);
    setTimeout(()=>star.remove(), 2000);
}

// ---------------- Happy Face Effect ----------------
function createHappyFace(x, y){
    for(let i=0;i<5;i++){
        let face = document.createElement('div');
        face.className = 'happyFace';
        face.innerText = '😊';
        face.style.left = x + Math.random()*30 - 15 + 'px';
        face.style.top = y + Math.random()*30 - 15 + 'px';
        document.body.appendChild(face);
        face.animate([
            { transform: 'translate(0,0)', opacity:1 },
            { transform: `translate(${Math.random()*50-25}px, ${-50+Math.random()*-30}px)`, opacity:0 }
        ], { duration: 700, easing: 'ease-out' });
        setTimeout(()=>face.remove(),700);
    }
}

// ---------------- Button Click Effects ----------------
document.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
        clickSound.play();
        updateCoins(1);
        createExplosion(e.clientX, e.clientY);
        createHappyFace(e.clientX, e.clientY);
        const leftMove = (Math.random()-0.5)*50;
        const topMove = (Math.random()-0.5)*50;
        btn.style.transform = `translate(${leftMove}px, ${topMove}px) scale(1.2) rotate(${Math.random()*360}deg)`;
        setTimeout(()=>{ btn.style.transform = 'translate(0,0) scale(1) rotate(0deg)'; }, 400);
        randomBackgroundColor();
    });
});

// ---------------- Explosion Effect ----------------
function createExplosion(x, y){
    for(let i=0;i<10;i++){
        let shape = document.createElement('div');
        shape.className = 'shape';
        shape.style.width = shape.style.height = Math.random()*15+5 + 'px';
        shape.style.background = `hsl(${Math.random()*360},100%,50%)`;
        shape.style.left = x + 'px';
        shape.style.top = y + 'px';
        document.body.appendChild(shape);
        const angle = Math.random()*2*Math.PI;
        const distance = Math.random()*100;
        shape.animate([
            { transform: 'translate(0px,0px)', opacity: 1 },
            { transform: `translate(${distance*Math.cos(angle)}px, ${distance*Math.sin(angle)}px)`, opacity:0 }
        ], { duration: 500, easing: 'ease-out' });
        setTimeout(()=>shape.remove(),500);
    }
}

// ---------------- Random Background Color ----------------
function randomBackgroundColor(){
    const colors = ['#222','#2a2','#22a','#a22','#aa2','#2aa','#2a22','#22aa'];
    document.body.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
}

// ---------------- Background Shapes ----------------
function createBackgroundShapes(){
    for(let i=0;i<15;i++){
        let shape = document.createElement('div');
        shape.className = 'shape';
        shape.style.width = shape.style.height = Math.random()*25 + 10 + 'px';
        shape.style.background = `hsl(${Math.random()*360},100%,50%)`;
        shape.style.left = Math.random()*window.innerWidth + 'px';
        shape.style.top = Math.random()*window.innerHeight + 'px';
        document.body.appendChild(shape);
        setTimeout(()=>shape.remove(), 4000);
    }
}
setInterval(createBackgroundShapes, 800);

// ---------------- Admin Password Check ----------------
function checkAdminPass(inputId, correctPass, redirectPage){
    const pass = document.getElementById(inputId).value;
    if(pass === correctPass){
        window.location.href = redirectPage;
    } else {
        alert('Incorrect password!');
    }
}

// ---------------- Ads Simulation ----------------
function watchAd(buttonNum){
    if(buttonNum===1 || buttonNum===2){
        setTimeout(()=>updateCoins(1),15000);
    }
    alert(`Watching ad button ${buttonNum}`);
}
