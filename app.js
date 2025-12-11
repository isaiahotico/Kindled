let coins=0;

// Update coins display with star effect
function updateCoins(amount=0){
    coins+=amount;
    const coinEl = document.getElementById('coins');
    coinEl.innerText=`Coins: ${coins}`;
    const star = document.createElement('span');
    star.innerText='★';
    star.classList.add('coin-star');
    document.body.appendChild(star);
    star.style.position='absolute';
    star.style.left=Math.random()*window.innerWidth+'px';
    star.style.top=Math.random()*window.innerHeight+'px';
    setTimeout(()=>star.remove(),1000);
}

// Button click effects
document.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', e=>{
        const happy = document.createElement('div');
        happy.innerText='😊';
        happy.style.position='absolute';
        happy.style.left=e.clientX+'px';
        happy.style.top=e.clientY+'px';
        happy.style.fontSize='12px';
        happy.style.color='yellow';
        document.body.appendChild(happy);
        let dy=-1; let opacity=1;
        function animate(){
            dy+=0.05; opacity-=0.02;
            happy.style.top=parseFloat(happy.style.top)+dy+'px';
            happy.style.opacity=opacity;
            if(opacity>0) requestAnimationFrame(animate);
            else happy.remove();
        }
        animate();
        // Bounce background
        const classes = ['clicked-green','clicked-pink','clicked-charcoal'];
        document.body.classList.add(classes[Math.floor(Math.random()*3)]);
        setTimeout(()=>document.body.classList.remove('clicked-green','clicked-pink','clicked-charcoal'),300);
    });
});

// Admin password check
function checkAdminPass(inputId, correctPass, redirectPage){
    const pass=document.getElementById(inputId).value;
    if(pass===correctPass) window.location.href=redirectPage;
    else alert('Incorrect password!');
}

// Watch Ads
function watchAd(buttonNum){
    if(buttonNum===1||buttonNum===2){
        updateCoins(1);
        alert('You earned 1 coin!');
    }
    // Monetag SDK integration
    if(buttonNum===1||buttonNum===2){
        show_10276123().then(()=>{}).catch(()=>{});
    } else {
        show_10276123('pop').then(()=>{}).catch(()=>{});
    }
}

// Background shapes/stars
function spawnRandomShape(){
    const shape = document.createElement('div');
    shape.innerText='✦';
    shape.style.position='absolute';
    shape.style.left=Math.random()*window.innerWidth+'px';
    shape.style.top=Math.random()*window.innerHeight+'px';
    shape.style.color=`hsl(${Math.random()*360},100%,50%)`;
    shape.style.fontSize='10px';
    document.body.appendChild(shape);
    setTimeout(()=>shape.remove(),2000);
}
setInterval(spawnRandomShape,200);
