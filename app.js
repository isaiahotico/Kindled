/* ======================================================
   GLOBAL DATABASES
====================================================== */

const Elements = ["Fire","Water","Earth","Wind","Nature","Spirit"];

const Weakness = {
    Fire: "Water",
    Water: "Earth",
    Earth: "Wind",
    Wind: "Nature",
    Nature: "Fire",
    Spirit: "None"
};

const Maps = Array.from({length:100},(_,i)=>({
    name:`Region ${i+1} - ${["Forest","Ruins","Caves","Island","Fields","Swamp"][i%6]}`
}));

const Monsters = Array.from({length:500},(_,i)=>({
    name:`Monster #${i+1}`,
    level: Math.floor(Math.random()*500)+1
}));

let EquipmentBaseNames = [
   "Blade of Dawn","Frostbane","Thunder Spear","Crystal Edge",
   "Titan Helm","Spirit Robe","Venom Shield","Elder Ring"
];

let EquipmentCatalog = [];
for (let i=0;i<250;i++){
    EquipmentCatalog.push({
        name: EquipmentBaseNames[i % EquipmentBaseNames.length] + " +" + (i+1),
        type: ["weapon","armor","ring","amulet","shield","boots","belt","gloves"][i % 8],
        lore: "An ancient artifact forged in forgotten lands.",
    });
}

/* ======================================================
   PLAYER SYSTEM
====================================================== */

let Player = {
    name: "Player",
    level: 1,
    xp: 0,
    coins: 0,
    powerPoints: 0,

    stats: {
        hp: 100,
        str: 5,
        int: 5,
        spd: 5
    },

    inventory: [],
    equipped: {
        weapon:null, armor:null, ring:null, amulet:null,
        shield:null, boots:null, belt:null, gloves:null
    },

    eyes: [],

    allocatePoints() {
        this.stats.str += 1;
        this.stats.hp += 5;
        this.powerPoints--;
        UI.update();
    }
};

/* ======================================================
   INVENTORY & RANDOM EQUIPMENT
====================================================== */

function rollEquipment(base) {
    return {
        ...base,
        rarity: ["Common","Uncommon","Rare","Epic","Legendary"][Math.floor(Math.random()*5)],
        stats: {
            atk: Math.floor(Math.random()*50),
            def: Math.floor(Math.random()*50),
            crit: Math.random()*0.3,
            critDmg: 1.5 + Math.random()*1.5,
            spd: Math.floor(Math.random()*10),
            elem: Elements[Math.floor(Math.random()*6)]
        }
    };
}

/* ======================================================
   COMBAT SYSTEM
====================================================== */

const Combat = {
    fightMonster(mon) {
        let log = "";
        let p = {...Player.stats};
        let mHP = 50 + mon.level*5;

        while (p.hp > 0 && mHP > 0) {
            // Player attack
            let dmg = p.str + Math.floor(Math.random()*10);
            if (Math.random() < 0.2) {
                dmg *= 2;
                log += "⚡ Critical Hit!\n";
            }
            mHP -= dmg;
            log += `You dealt ${dmg} damage.\n`;

            if (mHP <= 0) break;

            // Monster attack
            let mdmg = mon.level/3;
            p.hp -= mdmg;
            log += `${mon.name} hits you for ${mdmg}.\n`;
        }

        if (p.hp > 0) {
            let drop = rollEquipment(EquipmentCatalog[Math.floor(Math.random()*250)]);
            Player.inventory.push(drop);
            Player.coins += 5;
            log += `\n🎉 Victory! You got ${drop.name} & 5 coins!`;
        } else {
            log += "\n💀 You were defeated!";
        }

        alert(log);
        UI.update();
    },

    fightBoss() {
        alert("Boss fight placeholder — backend required!");
    }
};

/* ======================================================
   SHOP SYSTEM
====================================================== */

const Shop = {
    items: [],

    refresh() {
        this.items = [];
        for (let i=0;i<20;i++){
            this.items.push(rollEquipment(EquipmentCatalog[Math.floor(Math.random()*250)]));
        }
        UI.drawShop();
    }
};

Shop.refresh();

/* ======================================================
   EYE SYSTEM (Naruto-inspired)
====================================================== */

const Eyes = {
    summon() {
        Player.eyes.push({
            name:"Ancient Eye " + (Player.eyes.length+1),
            power: Math.floor(Math.random()*500),
            element: Elements[Math.floor(Math.random()*6)]
        });
        UI.update();
    }
};

/* ======================================================
   GUILDS, PVP, RAIDS
====================================================== */

const Guild = { create(){ alert("Guild system requires backend."); } };
const PVP = { queue(){ alert("PvP queue requires backend."); } };
const Raid = { join(){ alert("Raids require backend."); } };

/* ======================================================
   UI SYSTEM
====================================================== */

const UI = {
    openPanel(id){
        document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
        document.getElementById('panel-'+id).style.display='block';
    },

    drawInventory() {
        let html = "";
        Player.inventory.forEach(item=>{
            html += `<div class='item-card'>
                <b>${item.name}</b><br>
                <span>${item.rarity}</span><br>
                ATK: ${item.stats.atk} | DEF: ${item.stats.def}<br>
                Crit: ${(item.stats.crit*100).toFixed(1)}%<br>
                Speed: ${item.stats.spd}<br>
                Element: ${item.stats.elem}
            </div>`;
        });
        document.getElementById("inventory-list").innerHTML = html;
    },

    drawMaps() {
        let html="";
        Maps.forEach((m,i)=>{
            html += `<div class='map-button' onclick='UI.enterMap(${i})'>${m.name}</div>`;
        });
        document.getElementById("map-list").innerHTML = html;
    },

    enterMap(i){
        let monster = Monsters[Math.floor(Math.random()*Monsters.length)];
        Combat.fightMonster(monster);
    },

    drawShop() {
        let html = "";
        Shop.items.forEach(item=>{
            html += `<div class='shop-item'>
                <b>${item.name}</b><br>
                Price: 50 coins<br>
                <button onclick='UI.buyItem(${JSON.stringify(item)})'>Buy</button>
            </div>`;
        });
        document.getElementById("shop-list").innerHTML = html;
    },

    buyItem(item){
        if (Player.coins >= 50){
            Player.coins -= 50;
            Player.inventory.push(item);
            UI.update();
        } else alert("Not enough coins!");
    },

    update() {
        document.getElementById("profile-data").innerText =
`Level: ${Player.level}
XP: ${Player.xp}
Coins: ${Player.coins}
HP: ${Player.stats.hp}
STR: ${Player.stats.str}
INT: ${Player.stats.int}
SPD: ${Player.stats.spd}
Eyes: ${Player.eyes.length}`;
        
        this.drawInventory();
        this.drawMaps();
        this.drawShop();
    }
};

UI.update();
