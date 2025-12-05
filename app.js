const REWARD_PHP = 0.012;
let coins = 0;
let php = 0;

function updateUI(){
  document.getElementById("coins").textContent = "Coins: " + coins;
  document.getElementById("phpBalance").textContent = "PHP: " + php.toFixed(3);
  document.getElementById("dispPhp").textContent = php.toFixed(3);
}

// PLAY AD + REWARD
function playAdAndReward(){
  if (typeof show_10276123 === "undefined"){
    alert("Ad SDK not ready yet.");
    return;
  }

  show_10276123()
    .then(() => {
      php += REWARD_PHP;
      coins += 1;
      updateUI();
    })
    .catch(err => console.log("Ad error: ", err));
}

// CLICK AD BUTTONS
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("clickAd1").addEventListener("click", playAdAndReward);
  document.getElementById("clickAd2").addEventListener("click", playAdAndReward);
});

// WITHDRAW
document.getElementById("withdrawBtn").addEventListener("click", () => {
  const number = document.getElementById("gcashNumber").value.trim();

  if (!number){
    alert("Enter a valid Gcash number.");
    return;
  }

  document.getElementById("dispNumber").textContent = number;

  alert(
    "Withdrawal Request Sent!\n" +
    "Number: " + number + "\n" +
    "Amount: PHP " + php.toFixed(3)
  );
});
