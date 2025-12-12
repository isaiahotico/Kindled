// Utilities
function navigate(page) { window.location.href = page; }
function getCoin() { return parseInt(localStorage.getItem('coins')||'0'); }
function setCoin(val) { localStorage.setItem('coins', val); updateCoinDisplay(); }
function updateCoinDisplay() { document.querySelectorAll('#coin').forEach(el => el.textContent = getCoin()); }

// Coin + 10s Ad Reward
function watchAd(adNumber){
    alert("Ad started. Wait 10s to earn coin + 1 HP");
    setTimeout(()=>{
        let coins = getCoin() + 1;
        setCoin(coins);
        healGuardian(1);
        alert("Congratulations You earn 1 coin and 1 HP!");
    },10000);
}

// Guardian System
let guardians = JSON.parse(localStorage.getItem('guardians') || `[
  {"name":"Water Guardian","hp":50000,"lore":"Aqualore the Tideheart"},
  {"name":"Earth Guardian","hp":50000,"lore":"Terradon the Mountain Father"},
  {"name":"Air Guardian","hp":50000,"lore":"Zephyra the Sky Whisper"},
  {"name":"Fire Guardian","hp":50000,"lore":"Ignivar the Blazeborn"},
  {"name":"Nature Guardian","hp":50000,"lore":"Sylphora the Everleaf"},
  {"name":"Lightning Guardian","hp":50000,"lore":"Voltaris the Storm Emperor"},
  {"name":"Crystal Guardian","hp":50000,"lore":"Lumina the Prism Queen"},
  {"name":"Healer Guardian","hp":50000,"lore":"Seraphin the Lightbinder"},
  {"name":"Lava Guardian","hp":50000,"lore":"Magmora the Infernal Forge"},
  {"name":"Government Guardian","hp":50000,"lore":"Regalus the Orderkeeper"},
  {"name":"Dark Guardian","hp":50000,"lore":"Umbros the Void Sentinel"}
]`);

function healGuardian(points=1){
    let idx = parseInt(localStorage.getItem('currentGuardian')||'0');
    guardians[idx].hp -= points;
    if(guardians[idx].hp<0) guardians[idx].hp=0;
    localStorage.setItem('guardians',JSON.stringify(guardians));
    updateGuardianUI();
}

function updateGuardianUI(){
    if(document.getElementById('guardian-info')) {
        let idx = parseInt(localStorage.getItem('currentGuardian')||'0');
        let g = guardians[idx];
        document.getElementById('guardian-info').innerHTML = `${g.name}: HP ${g.hp}`;
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    updateCoinDisplay();
    updateGuardianUI();
});
