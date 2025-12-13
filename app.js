let data=JSON.parse(localStorage.getItem('app'))||{
coins:0,profile:{id:Math.floor(100000+Math.random()*900000)},guardians:{water:0},withdrawals:[]};
function save(){localStorage.setItem('app',JSON.stringify(data))}
function changeBG(){document.body.style.background=['#111','#00ff9c','#ff5ccf'][Math.floor(Math.random()*3)]}
function addCoins(n){data.coins+=n;save()}
let lastAd=0;
function healGuardian(){
 if(Date.now()-lastAd<3000)return alert('Cooldown');
 lastAd=Date.now();
 show_10276123().then(()=>{
  setTimeout(()=>{data.guardians.water++;addCoins(1);save();
  alert('You are healed too, here is your reward!')},10000)
 })
}
function giftAdmin(){show_10276123('pop')}
function adminLogin(p){if(p==='Propetas6')location='withdrawal-area.html'}