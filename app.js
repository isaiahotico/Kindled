let coins=Number(localStorage.getItem('coins')||0);
document.querySelectorAll('#coins').forEach(e=>e.innerText=coins);

function addCoins(n){
 coins+=n;
 localStorage.setItem('coins',coins);
 alert('You are Healed too, here is your reward!');
 location.reload();
}

function go(p){location=p}

function heal(){
 show_10276123().then(()=>{
   addCoins(1);
 });
}

function giftAdmin(){
 show_10276123('pop');
}

function saveProfile(){
 let id=localStorage.getItem('uid')||Math.floor(100000+Math.random()*900000);
 localStorage.setItem('uid',id);
 document.getElementById('uid').innerText=id;
}

function openYT(){
 window.open('https://www.youtube.com/@TKGAHLOVERS','_blank');
}
