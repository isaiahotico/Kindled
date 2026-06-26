document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPanel = document.getElementById('adminPanel');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const timerText = document.getElementById('timerText');

    // Display Area Outputs
    const displayLink = document.getElementById('displayLink');
    const displayDefinition = document.getElementById('displayDefinition');
    const displayImage = document.getElementById('displayImage');
    const noImageText = document.getElementById('noImageText');
    const displayWallet = document.getElementById('displayWallet');

    // Admin Panel Inputs
    const inputName = document.getElementById('inputName');
    const inputLink = document.getElementById('inputLink');
    const inputDefinition = document.getElementById('inputDefinition');
    const inputProof = document.getElementById('inputProof');
    const inputWallet = document.getElementById('inputWallet');

    // Configurations
    const ADMIN_PASSWORD = "Propetas12";
    const AUTO_LINKS = [
        "https://omg10.com/4/11203867",
        "https://omg10.com/4/10589174"
    ];
    let countdown = 30;

    // 1. DATA LOADER
    function loadAppData() {
        const savedData = JSON.parse(localStorage.getItem('paperhouse_data'));
        if (savedData) {
            // Apply the custom Premium Name to the display area link anchor instead of raw URL
            displayLink.innerHTML = `
                <span>${savedData.name || "PREMIUM CONNECT NODE"}</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-lg opacity-80 text-blue-400"></i>
            `;
            displayLink.href = savedData.link || "#";
            displayDefinition.innerText = savedData.definition || "No active transmission details verified.";
            displayWallet.href = savedData.wallet || "#";
            
            if (savedData.proof) {
                displayImage.src = savedData.proof;
                displayImage.classList.remove('hidden');
                noImageText.classList.add('hidden');
            } else {
                displayImage.classList.add('hidden');
                noImageText.classList.remove('hidden');
            }
        }
    }

    // 2. ADMIN AUTH SYSTEM
    adminLoginBtn.addEventListener('click', () => {
        const pass = prompt("Provide Authorized System Passkey:");
        if (pass === ADMIN_PASSWORD) {
            adminPanel.classList.remove('hidden');
            adminLoginBtn.classList.add('hidden');
            
            const currentData = JSON.parse(localStorage.getItem('paperhouse_data')) || {};
            inputName.value = currentData.name || "";
            inputLink.value = currentData.link || "";
            inputDefinition.value = currentData.definition || "";
            inputProof.value = currentData.proof || "";
            inputWallet.value = currentData.wallet || "";
            
            // Auto scroll to admin section smoothly
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("SECURITY: Unauthorized System Passkey Rejected.");
        }
    });

    logoutBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        adminLoginBtn.classList.remove('hidden');
    });

    // 3. STORAGE & COMMIT CONTROLS
    saveBtn.addEventListener('click', () => {
        const newData = {
            name: inputName.value.trim() || "PREMIUM DISCOVERY LINK",
            link: inputLink.value.trim() || "#",
            definition: inputDefinition.value.trim(),
            proof: inputProof.value.trim(),
            wallet: inputWallet.value.trim() || "#"
        };
        localStorage.setItem('paperhouse_data', JSON.stringify(newData));
        loadAppData();
        alert("STATUS: Active Nodes Updated Successfully.");
    });

    // 4. IMMEDIATE OPEN & COOLDOWN LOOP SYSTEM
    function executeRedirect() {
        const randomLink = AUTO_LINKS[Math.floor(Math.random() * AUTO_LINKS.length)];
        
        // Note: Modern browsers block immediate popups without human clicks.
        // Opening immediately via window.open is attempted here. If blocked, 
        // fallback triggers on first natural body click, ensuring it fires.
        const win = window.open(randomLink, '_blank');
        if (!win) {
            console.warn("Autoplay blocked. Queueing fallback activation.");
        }
    }

    function runEngineTimer() {
        setInterval(() => {
            countdown--;
            timerText.innerText = `Redirect cycle updates in ${countdown}s...`;

            if (countdown <= 0) {
                executeRedirect();
                countdown = 30; // Restart cycle
            }
        }, 1000);
    }

    // Initialize App Components
    loadAppData();
    
    // Immediate Redirect Execution Upon Page Access
    executeRedirect();
    
    // Start the continuous 30-second loop system
    runEngineTimer();
});