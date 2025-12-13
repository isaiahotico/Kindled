const guardians = [
  {name:"Water Guardian", lore:"Ancient lord of oceans, wounded by darkness."},
  {name:"Earth Guardian", lore:"Bearer of mountains, cracked but standing."},
  {name:"Air Guardian", lore:"Watcher of skies and winds."},
  {name:"Fire Guardian", lore:"Flame-born warrior of rebirth."},
  {name:"Nature Guardian", lore:"Spirit of forests and life."},
  {name:"Lightning Guardian", lore:"Swift judge of the heavens."},
  {name:"Crystal Guardian", lore:"Keeper of ancient knowledge."},
  {name:"Healer Guardian", lore:"Protector of balance."},
  {name:"Lava Guardian", lore:"Molten rage beneath worlds."},
  {name:"Government Guardian", lore:"Guardian of order and law."},
  {name:"Dark Guardian", lore:"Fallen lord seeking redemption."}
];

let gIndex = Number(localStorage.getItem("gIndex") || 0);
let hp = Number(localStorage.getItem("gHP") || 0);
let board = JSON.parse(localStorage.getItem("gBoard") || "{}");

function heal(uid){
  hp++;
  board[uid] = (board[uid] || 0) + 1;
  if(hp >= 50000){
    alert("🌟 Guardian Healed! Top 6 rewarded!");
    hp = 0;
    board = {};
    gIndex = (gIndex + 1) % guardians.length;
  }
  save();
}

function save(){
  localStorage.setItem("gIndex", gIndex);
  localStorage.setItem("gHP", hp);
  localStorage.setItem("gBoard", JSON.stringify(board));
}
