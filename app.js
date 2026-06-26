document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPanel = document.getElementById('adminPanel');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const timerText = document.getElementById('timerText');

    // Display Area Selectors
    const displayLink = document.getElementById('displayLink');
    const displayDefinition = document.getElementById('displayDefinition');
    const displayImage = document.getElementById('displayImage');
    const noImageText = document.getElementById('noImageText');
    const displayWallet = document.getElementById('displayWallet');

    // Admin Input Selectors
    const inputLink = document.getElementById('inputLink');
    const inputDefinition = document.getElementById('inputDefinition');
    const inputProof = document.getElementById('inputProof');
    const inputWallet = document.getElementById('inputWallet');

    // Configuration
    const ADMIN_PASSWORD = "Propetas12";
    const AUTO_LINKS = [
        "https://omg10.com/4/11203867",
        "https://omg10.com/4/10589174"
    ];
    let countdown = 30;

    // 1. DATA INITIALIZATION
    function loadAppData() {
        const savedData = JSON.parse(localStorage.getItem('paperhouse_data'));
        if (savedData) {
            displayLink.innerText = savedData.link || "No Link Set";
            displayDefinition.innerText = savedData.definition || "No definition provided.";
            displayWallet.href = savedData.wallet || "#";
            
            if (savedData.proof) {
                displayImage.src = savedData.proof;
                displayImage.classList.remove('hidden');
                noImageText.classList.add('hidden');
            }
        }
    }

    // 2. ADMIN LOGIN LOGIC
    adminLoginBtn.addEventListener('click', () => {
        const pass = prompt("Enter Admin Password:");
        if (pass === ADMIN_PASSWORD) {
            adminPanel.classList.remove('hidden');
            adminLoginBtn.classList.add('hidden');
            // Fill inputs with current data
            const currentData = JSON.parse(localStorage.getItem('paperhouse_data')) || {};
            inputLink.value = currentData.link || "";
            inputDefinition.value = currentData.definition || "";
            inputProof.value = currentData.proof || "";
            inputWallet.value = currentData.wallet || "";
        } else {
            alert("Unauthorized Access!");
        }
    });

    logoutBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        adminLoginBtn.classList.remove('hidden');
    });

    // 3. SAVE LOGIC
    saveBtn.addEventListener('click', () => {
        const newData = {
            link: inputLink.value,
            definition: inputDefinition.value,
            proof: inputProof.value,
            wallet: inputWallet.value
        };
        localStorage.setItem('paperhouse_data', JSON.stringify(newData));
        loadAppData();
        alert("Data updated successfully!");
    });

    // 4. AUTO-OPEN & COOLDOWN LOGIC
    function startAutoSystem() {
        setInterval(() => {
            countdown--;
            timerText.innerText = `Next auto-link opening in ${countdown}s...`;

            if (countdown <= 0) {
                const randomLink = AUTO_LINKS[Math.floor(Math.random() * AUTO_LINKS.length)];
                
                // Note: Most modern browsers block window.open unless triggered by a real click.
                // This logic attempts to open, but might be blocked by browser settings.
                window.open(randomLink, '_blank');
                
                countdown = 30; // Reset
            }
        }, 1000);
    }

    // Initialize App
    loadAppData();
    startAutoSystem();
});