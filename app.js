/* ======================================================
   RPG WORLD – FULL GAME ENGINE
   All systems merged into ONE runnable client file.
   ====================================================== */

const Game = {
    user: null,
    maps: [],
    monsters: [],
    equipmentPool: [],
    eyesPool: [],
    guilds: [],
    boss: null,
    storeItems: [],
    premiumItems: [],
    raidBosses: [],
    season: {
        rank: 0,
        points: 0,
        started: Date.now()
    },

    /* ======================================================
       🚀 LOGIN SYSTEM
    ====================================================== */
    login() {
        let name = document.getElementById("usernameInput").value.trim();
        if (!name) return alert("Enter a username.");

        let saved = localStorage.getItem("rpg_user_" + name);

        if (saved) {
            this.user = JSON.parse(saved);
            UI.show("profile");
            this.renderProfile();
        } else {
            this.user = {
                username: name,
                level: 1,
                exp: 0,
                hp: 100,
                maxHp: 100,
                str: 5,
                int: 5,
                spd: 5,
                statPoints: 0,
                coins: 0,
                bag: [],
                equipped: {
                    weapon: null,
                    armor: null,
                    shield: null,
                    ring: null,
                    amulet: null,
                    boots: null,
                    belt: null,
                    cape: null
                },
                eyes: [],
                guild: null
            };
            this.save();
            UI.show("profile");
            this.renderProfile();
        }
    },

    save() {
        if (!this.user) return;
        localStorage.setItem("rpg_user_" + this.user.username, JSON.stringify(this.user));
    },

    /* ======================================================
       📈 STAT SYSTEM
    ====================================================== */
    addStat(type) {
        if (this.user.statPoints <= 0) return;

        if (type === "hp") this.user.maxHp += 10;
        if (type === "str") this.user.str++;
        if (type === "int") this.user.int++;
        if (type === "spd") this.user.spd++;

        this.user.statPoints--;
        this.save();
        this.renderStats();
    },

    levelUp() {
        this.user.level++;
        this.user.statPoints += 2;
        this.user.maxHp += 5;
        this.user.hp = this.user.maxHp;
        this.save();
    },

    /* ======================================================
       🗺️ MAPS + MONSTERS
    ====================================================== */
    generateMaps() {
        let names = [
            "Azure Plains","Frostwind Ridge","Crimson Valley","Shadow Swamp","Moonlit Coast",
            "Titanfall Ruins","Eaglecrest Pass","Stormforge Canyon","Ironbark Grove","Dustveil Flats",
            "Blackspire Wastes","Saltwind Docks","Drake Hollow","Fogscale Mountains","Gloomrock Divide"
        ];
        for (let i = 1; i <= 100; i++) {
            this.maps.push({
                id: i,
                name: names[Math.floor(Math.random()*names.length)] + " " + i,
                monsters: []
            });
        }
    },

    generateMonsters() {
        const baseNames = [
            "Goblin","Orc","Wraith","Fire Drake","Stone Golem","Blood Wolf","Hydra Snake",
            "Frost Bat","Sand Demon","Venom Serpent","Shadow Beast","Storm Eagle",
            "Bone Knight","Crystal Beetle","Ancient Spirit"
        ];

        let counter = 1;
        for (let m of this.maps) {
            for (let i = 0; i < 5; i++) {
                let name = baseNames[Math.floor(Math.random()*baseNames.length)] + " #" + counter++;
                m.monsters.push({
                    name,
                    hp: Math.floor(50 + Math.random()*300),
                    atk: Math.floor(5 + Math.random()*25),
                    spd: Math.floor(3 + Math.random()*10),
                    element: this.randomElement(),
                    drops: []
                });
            }
        }
    },

    randomElement() {
        return ["fire","water","earth","wind","nature","spirit"][Math.floor(Math.random()*6)];
    },

    /* ======================================================
       ⚔️ COMBAT SYSTEM
    ====================================================== */
    fightMonster() {
        let log = "";

        if (!this.currentMonster) return;

        let playerDmg = this.user.str + Math.floor(Math.random()*5);
        let crit = Math.random() < 0.15;
        if (crit) playerDmg *= 2;

        let monsterDmg = this.currentMonster.atk;

        this.currentMonster.hp -= playerDmg;
        log += `You hit ${this.currentMonster.name} for ${playerDmg}. ${crit?"CRIT!":""}\n`;

        if (this.currentMonster.hp <= 0) {
            log += `✔ You defeated ${this.currentMonster.name}!\n`;
            this.giveLoot();
            document.getElementById("battleLog").innerText = log;
            return;
        }

        this.user.hp -= monsterDmg;
        log += `${this.currentMonster.name} hits YOU for ${monsterDmg}\n`;

        if (this.user.hp <= 0) {
            this.user.hp = this.user.maxHp;
            log += "💀 You died! Respawned at full HP.\n";
        }

        document.getElementById("battleLog").innerText = log;
        this.save();
    },

    giveLoot() {
        let eq = this.generateEquipment();
        this.user.bag.push(eq);
        this.user.coins += Math.floor(Math.random()*50);
        this.user.exp += 20;

        if (this.user.exp >= this.user.level * 50) {
            this.user.exp = 0;
            this.levelUp();
        }
        this.save();
    },

    /* ======================================================
       🎒 EQUIPMENT SYSTEM (250 items, randomized)
    ====================================================== */
    generateEquipment() {
        const names = ["Blade","Axe","Staff","Ring","Amulet","Charm","Helm","Armor","Boots"];
        let itemName = names[Math.floor(Math.random()*names.length)];

        return {
            id: Date.now(),
            name: itemName,
            rarity: this.randomRarity(),
            atk: Math.floor(Math.random()*20),
            def: Math.floor(Math.random()*20),
            spd: Math.floor(Math.random()*10),
            critChance: Math.random()*0.2,
            critDmg: 1.2 + Math.random()*0.8,
            lore: "Forged in forgotten lands, carrying echoes of ancient wars."
        };
    },

    randomRarity() {
        let roll = Math.random();
        if (roll > 0.97) return "legendary";
        if (roll > 0.85) return "epic";
        if (roll > 0.6) return "rare";
        return "common";
    },

    /* ======================================================
       👁️ EYE SUMMONING (50 Eyes)
    ====================================================== */
    generateEyes() {
        for (let i = 1; i <= 50; i++) {
            this.eyesPool.push({
                id: i,
                name: "Eye of " + ["Fury","Time","Storm","Decay","Light","Chaos"][i % 6],
                power: Math.floor(20 + Math.random()*50),
                cc: Math.random()*0.3,
                elementBoost: this.randomElement()
            });
        }
    },

    summonEye() {
        if (this.user.level < 30) return alert("Unlocks at LEVEL 30!");

        let eye = this.eyesPool[Math.floor(Math.random()*this.eyesPool.length)];
        this.user.eyes.push(eye);
        this.save();
        this.renderEyes();
    },

    /* ======================================================
       🔥 DAILY BOSS – Multiple Phases
    ====================================================== */
    generateBoss() {
        this.boss = {
            name: "Eternal Dragon",
            hp: 5000,
            atk: 120,
            phase: 1
        };
    },

    attackBoss() {
        if (!this.boss) return;

        let dmg = this.user.str + Math.floor(Math.random()*15);
        this.boss.hp -= dmg;

        let log = `You deal ${dmg} to ${this.boss.name} (Phase ${this.boss.phase})\n`;

        if (this.boss.hp <= 3000 && this.boss.phase === 1) {
            this.boss.phase = 2;
            this.boss.atk *= 1.5;
            log += "⚠️ Boss enters Phase 2: Furious Mode!\n";
        }
        if (this.boss.hp <= 1500 && this.boss.phase === 2) {
            this.boss.phase = 3;
            this.boss.atk *= 1.7;
            log += "🔥 Boss enters Phase 3: Cataclysm Mode!\n";
        }

        if (this.boss.hp <= 0) {
            log += "✔ BOSS DEFEATED! You earn legendary loot!\n";
            this.user.bag.push(this.generateEquipment());
            this.user.coins += 500;
            this.generateBoss();
            this.save();
        }

        document.getElementById("bossLog").innerText = log;
    },

    /* ======================================================
       🏰 GUILD SYSTEM
    ====================================================== */
    joinGuild(name) {
        let guild = this.guilds.find(g => g.name === name);
        if (!guild) {
            guild = { name, members: [] };
            this.guilds.push(guild);
        }
        if (!guild.members.includes(this.user.username)) {
            guild.members.push(this.user.username);
        }
        this.user.guild = name;
        this.save();
        this.renderGuild();
    },

    /* ======================================================
       🛡️ RAID SYSTEM
    ====================================================== */
    generateRaids() {
        this.raidBosses = [
            { name: "Titan of Storms", hp: 8000, atk: 180 },
            { name: "Devourer of Suns", hp: 12000, atk: 220 }
        ];
    },

    /* ======================================================
       🏆 PVP SEASON SYSTEM
    ====================================================== */
    gainSeasonPoints(amount) {
        this.season.points += amount;
    },

    /* ======================================================
       🧩 UI RENDERING
    ====================================================== */
    renderProfile() {
        document.getElementById("profileData").innerHTML = `
            <p><b>${this.user.username}</b></p>
            <p>Level: ${this.user.level}</p>
            <p>HP: ${this.user.hp}/${this.user.maxHp}</p>
            <p>STR: ${this.user.str}</p>
            <p>INT: ${this.user.int}</p>
            <p>SPD: ${this.user.spd}</p>
            <p>Coins: ${this.user.coins}</p>
        `;
    },

    renderStats() {
        document.getElementById("statPoints").innerText =
            `Available Points: ${this.user.statPoints}`;
    },

    renderEyes() {
        document.getElementById("eyePanel").innerHTML = this.user.eyes
            .map(e => `<p>👁️ ${e.name} (+${e.power} power)</p>`)
            .join("");
    },

    renderGuild() {
        if (!this.user.guild) {
            document.getElementById("guildPanel").innerHTML = `
                <p>You are not in a guild.</p>
                <button onclick="Game.joinGuild('DragonSlayers')">Join DragonSlayers</button>
            `;
            return;
        }
        document.getElementById("guildPanel").innerHTML =
            `<p>Guild: ${this.user.guild}</p>`;
    }
};

/* ======================================================
   UI MANAGER
====================================================== */
const UI = {
    show(id) {
        document.querySelectorAll(".panel").forEach(p => p.style.display = "none");
        document.getElementById(id).style.display = "block";
    }
};

/* ======================================================
   INIT
====================================================== */
window.onload = () => {
    Game.generateMaps();
    Game.generateMonsters();
    Game.generateEquipment();
    Game.generateEyes();
    Game.generateBoss();
    Game.generateRaids();
};
