import { supabase } from "./supabase.js";

const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id?.toString();

let userBalance = 0;

async function loadUser() {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (!data) {
        await supabase.from("users").insert([{ id: userId, balance: 0 }]);
        userBalance = 0;
    } else {
        userBalance = data.balance;
    }

    document.getElementById("balance").innerText = userBalance.toFixed(3);
}

loadUser();
startGame();

// ---------------- GAME ------------------

let values = [1,1,2,2,3,3];
values = values.sort(() => Math.random() - 0.5);

const gameArea = document.getElementById("game");
let revealed = [];

function startGame() {
    gameArea.innerHTML = "";
    revealed = [];

    values.forEach((v, i) => {
        let btn = document.createElement("button");
        btn.className = "tile";
        btn.dataset.value = v;
        btn.innerText = "?";

        btn.onclick = () => reveal(i, btn);
        gameArea.appendChild(btn);
    });
}

async function reveal(i, btn) {
    btn.innerText = values[i];
    revealed.push(values[i]);

    if (revealed.length === 6) {
        await rewardGame();
        setTimeout(startGame, 5000); // 5 seconds reset
    }
}

async function rewardGame() {
    userBalance += 0.026;

    document.getElementById("balance").innerText = userBalance.toFixed(3);

    await supabase.from("users")
        .update({ balance: userBalance })
        .eq("id", userId);

    await supabase.from("rewards_log").insert([
        { user_id: userId, type: "game", amount: 0.026 }
    ]);
}

// --------------- ADS --------------------

document.getElementById("watchAdBtn").onclick = () => {
    show_10276123().then(async () => {
        userBalance += 0.026;

        await supabase.from("users")
            .update({ balance: userBalance })
            .eq("id", userId);

        await supabase.from("rewards_log").insert([
            { user_id: userId, type: "ads", amount: 0.026 }
        ]);

        document.getElementById("balance").innerText = userBalance.toFixed(3);
    });
};

// Auto in-app interstitial ads
show_10276123({
    type: "inApp",
    inAppSettings: {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
    }
});

// --------------- WITHDRAW -----------------

document.getElementById("withdrawBtn").onclick = () => {
    let gcash = prompt("Enter GCash number:");
    let amount = userBalance;

    if (!gcash) return;

    supabase.from("withdrawals").insert([
        { user_id: userId, amount, gcash, status: "pending" }
    ]);

    supabase.from("users")
        .update({ balance: 0 })
        .eq("id", userId);

    alert("Withdrawal sent!");
    document.getElementById("balance").innerText = "0.00";
};
