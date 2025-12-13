const guardians=[
{name:"Water Guardian",lore:"Ancient lord of oceans.",maxHP:50000},
{name:"Earth Guardian",lore:"Bearer of mountains.",maxHP:50000},
{name:"Air Guardian",lore:"Watcher of skies.",maxHP:50000},
{name:"Fire Guardian",lore:"Flame-born warrior.",maxHP:50000},
{name:"Nature Guardian",lore:"Spirit of forests.",maxHP:50000},
{name:"Lightning Guardian",lore:"Swift judge of heavens.",maxHP:50000},
{name:"Crystal Guardian",lore:"Keeper of knowledge.",maxHP:50000},
{name:"Healer Guardian",lore:"Protector of balance.",maxHP:50000},
{name:"Lava Guardian",lore:"Molten rage.",maxHP:50000},
{name:"Government Guardian",lore:"Guardian of order.",maxHP:50000},
{name:"Dark Guardian",lore:"Fallen lord.",maxHP:50000}];

let gIndex = Number(localStorage.getItem("gIndex")||0);
let hp = Number(localStorage.getItem("gHP")||0);
let board = JSON.parse(localStorage.getItem("gBoard")||"{}");

function rotateGuardian(){ gIndex=(gIndex+1)%guardians.length; hp=0; board={}; saveState(); updateUI(); }

function rewardTopUsers(){
  let top=Object.entries(board).sort((a,b)=>b[1]-a[1]).slice(0,6);
  top.forEach(([uid,points])=>{
    let reward=Math.floor(Math.random()*1001)+2000;
    let coins=Number(localStorage.getItem("coins_"+uid)||0);
    coins+=reward;
    localStorage.setItem("coins_"+uid,coins);
    if(uid==localStorage.getItem("uid")){
      alert(`🎉 You received ${reward} coins!`);
      let userCoins=Number(localStorage.getItem("coins")||0);
      localStorage.setItem("coins",userCoins+reward);
    }
  });
}

function saveState(){localStorage.setItem("gIndex",gIndex); localStorage.setItem("gHP",hp); localStorage.setItem("gBoard",JSON.stringify(board));}
