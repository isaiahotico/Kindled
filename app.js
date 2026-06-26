document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPanel = document.getElementById('adminPanel');
    const formTitle = document.getElementById('formTitle');
    const saveBtn = document.getElementById('saveBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const timerText = document.getElementById('timerText');

    // Admin Panel Inputs
    const inputName = document.getElementById('inputName');
    const inputLink = document.getElementById('inputLink');
    const inputDefinition = document.getElementById('inputDefinition');
    const inputProofFile = document.getElementById('inputProofFile'); // New: File input
    const proofImagePreview = document.getElementById('proofImagePreview'); // New: Image preview container
    const proofImagePreviewImg = proofImagePreview.querySelector('img'); // New: Image element inside preview
    const inputWallet = document.getElementById('inputWallet');

    // Display Area Containers
    const paginatedItemsContainer = document.getElementById('paginatedItemsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Pagination Controls
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    const totalPagesDisplay = document.getElementById('totalPagesDisplay');
    const adminItemList = document.getElementById('adminItemList');
    const noItemsAdmin = document.getElementById('noItemsAdmin');


    // Configurations
    const ADMIN_PASSWORD = "Propetas12";
    const AUTO_LINKS = [
        "https://omg10.com/4/11203867",
        "https://omg10.com/4/10589174"
    ];
    const ITEMS_PER_PAGE = 10;
    const MAX_IMAGE_SIZE_MB = 2; // Maximum image file size in MB

    let allItems = [];
    let currentPage = 1;
    let editingItemId = null; // Track which item is being edited
    let currentProofDataURL = null; // Store Base64 for the item being edited/added
    let autoRedirectCountdown = 30;

    // --- Core Functions ---

    // 1. DATA MANAGEMENT & STORAGE
    function saveAllItems() {
        localStorage.setItem('paperhouse_items', JSON.stringify(allItems));
    }

    function loadAllItems() {
        const savedItems = JSON.parse(localStorage.getItem('paperhouse_items'));
        if (savedItems) {
            allItems = savedItems;
        } else {
            // Default item if no items exist
            allItems.push({
                id: Date.now(),
                name: "INITIAL SYSTEM DATA NODE",
                link: "#",
                definition: "Welcome to PAPERHOUSE INC. Please log in as admin to configure your first premium link targets.",
                proof: "",
                wallet: "#"
            });
            saveAllItems();
        }
    }

    // 2. RENDERING FUNCTIONS

    // Render the current page of items for the user display
    function renderPaginatedItems() {
        loadingIndicator.classList.add('hidden'); // Hide loading indicator once items are ready
        paginatedItemsContainer.innerHTML = ''; // Clear previous items

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const itemsToDisplay = allItems.slice(startIndex, endIndex);

        if (itemsToDisplay.length === 0 && allItems.length > 0 && currentPage > 1) {
            // If no items on current page but there are items overall, go back to last page
            currentPage--;
            renderPaginatedItems();
            return;
        }

        if (itemsToDisplay.length === 0) {
            paginatedItemsContainer.innerHTML = `
                <div class="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 italic">
                    <i class="fa-solid fa-folder-open text-4xl mb-4"></i>
                    <p>No premium link targets have been configured yet.</p>
                    <p class="text-sm mt-2">Log in as admin to add new items.</p>
                </div>
            `;
            return;
        }

        itemsToDisplay.forEach(item => {
            const itemHtml = `
                <div class="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <!-- Proof Visual Area -->
                    <div class="relative h-64 bg-slate-950/60 flex flex-col items-center justify-center border-b border-slate-800 overflow-hidden">
                        ${item.proof ? `<img src="${item.proof}" alt="Premium Document Proof" class="w-full h-full object-cover transition-all duration-300 hover:scale-105">` : `
                            <div class="text-center p-6">
                                <i class="fa-regular fa-image text-4xl text-slate-700 mb-3 animate-pulse"></i>
                                <p class="text-sm text-slate-500 tracking-wider">SECURE VISUAL EVIDENCE ARCHIVE</p>
                            </div>
                        `}
                        <div class="absolute top-4 left-4 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-green-500"></i> PROOF CREDENTIALS
                        </div>
                    </div>

                    <!-- Dynamic Meta Content -->
                    <div class="p-8">
                        <span class="text-xs uppercase font-bold tracking-widest text-blue-500 mb-2 block">TOP WORLD VERIFIED TARGET</span>
                        
                        <h2 class="mb-4">
                            <a href="${item.link}" target="_blank" class="text-3xl font-extrabold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-2 group decoration-2 underline-offset-4 hover:underline">
                                <span>${item.name || "PREMIUM CONNECT NODE"}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-lg opacity-0 group-hover:opacity-100 transition-opacity text-blue-400"></i>
                            </a>
                        </h2>

                        <div class="bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80 mb-6">
                            <h3 class="text-xs font-black tracking-widest text-slate-500 mb-3 uppercase flex items-center gap-2">
                                <i class="fa-solid fa-quote-left text-slate-700"></i> Definition / System Log
                            </h3>
                            <p class="text-slate-400 leading-relaxed text-sm">
                                ${item.definition || "No active transmission details verified."}
                            </p>
                        </div>

                        <!-- Mid-Content Inline Banner (Ad #2) -->
                        <div class="ad-banner bg-slate-950/40 rounded-xl border border-slate-800/60 p-3 mb-6">
                            <div class="text-center text-[10px] text-slate-600 font-mono w-full">
                                ADVERTISEMENT #2 (MID-DECK RUNNER)
                                <div class="h-14 bg-slate-950/80 flex items-center justify-center mt-1 border border-slate-800/80 rounded">Standard Native Asset Panel</div>
                            </div>
                        </div>

                        <a href="${item.wallet}" target="_blank" class="group relative flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black text-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all active:scale-[0.99] overflow-hidden">
                            <div class="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:animate-shine"></div>
                            <i class="fa-solid fa-wallet mr-3 text-lg"></i> INITIALIZE WALLET DISBURSEMENT
                        </a>
                    </div>
                </div>
            `;
            paginatedItemsContainer.innerHTML += itemHtml;
        });
        updatePaginationControls();
    }

    // Render the list of items in the admin panel
    function renderAdminItemList() {
        adminItemList.innerHTML = '';
        if (allItems.length === 0) {
            noItemsAdmin.classList.remove('hidden');
            return;
        } else {
            noItemsAdmin.classList.add('hidden');
        }

        allItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-center p-3 border-b border-slate-800 last:border-b-0';
            itemDiv.innerHTML = `
                <span class="text-sm font-medium text-slate-300 truncate mr-2">${item.name}</span>
                <div class="flex gap-2">
                    <button data-id="${item.id}" class="edit-item-btn bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-md">Edit</button>
                    <button data-id="${item.id}" class="delete-item-btn bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-md">Delete</button>
                </div>
            `;
            adminItemList.appendChild(itemDiv);
        });

        // Add event listeners for new buttons
        adminItemList.querySelectorAll('.edit-item-btn').forEach(button => {
            button.addEventListener('click', (e) => editItem(e.target.dataset.id));
        });
        adminItemList.querySelectorAll('.delete-item-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteItem(e.target.dataset.id));
        });
    }

    // Update pagination button states and page numbers
    function updatePaginationControls() {
        const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
        currentPageDisplay.innerText = currentPage;
        totalPagesDisplay.innerText = totalPages === 0 ? 1 : totalPages; // Ensure it's at least 1 page

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // 3. ADMIN PANEL LOGIC

    adminLoginBtn.addEventListener('click', () => {
        const pass = prompt("Provide Authorized System Passkey:");
        if (pass === ADMIN_PASSWORD) {
            adminPanel.classList.remove('hidden');
            adminLoginBtn.classList.add('hidden');
            resetAdminForm(); // Prepare form for adding new item
            renderAdminItemList();
            adminPanel.scrollIntoView({ behavior: 'smooth' }); // Auto scroll
        } else {
            alert("SECURITY: Unauthorized System Passkey Rejected.");
        }
    });

    logoutBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        adminLoginBtn.classList.remove('hidden');
        resetAdminForm();
    });

    cancelEditBtn.addEventListener('click', resetAdminForm);

    // Save/Update Item
    saveBtn.addEventListener('click', () => {
        const newItem = {
            name: inputName.value.trim() || "PREMIUM DISCOVERY LINK",
            link: inputLink.value.trim(),
            definition: inputDefinition.value.trim(),
            proof: currentProofDataURL || "", // Use Base64 string or empty
            wallet: inputWallet.value.trim()
        };

        if (!newItem.link) {
            alert("ERROR: Target Link URL is required.");
            return;
        }

        if (editingItemId) {
            // Update existing item
            const itemIndex = allItems.findIndex(item => item.id == editingItemId);
            if (itemIndex !== -1) {
                allItems[itemIndex] = { ...allItems[itemIndex], ...newItem, id: editingItemId };
                alert("STATUS: Item Updated Successfully.");
            }
        } else {
            // Add new item
            newItem.id = Date.now(); // Unique ID for new item
            allItems.push(newItem);
            alert("STATUS: New Item Added Successfully.");
        }

        saveAllItems();
        resetAdminForm();
        renderAdminItemList();
        renderPaginatedItems(); // Re-render main display
    });

    // Edit Item function
    function editItem(id) {
        const itemToEdit = allItems.find(item => item.id == id);
        if (itemToEdit) {
            editingItemId = itemToEdit.id;
            inputName.value = itemToEdit.name;
            inputLink.value = itemToEdit.link;
            inputDefinition.value = itemToEdit.definition;
            inputWallet.value = itemToEdit.wallet;
            currentProofDataURL = itemToEdit.proof; // Load existing Base64

            // Display current proof image in preview
            if (itemToEdit.proof) {
                proofImagePreviewImg.src = itemToEdit.proof;
                proofImagePreview.classList.remove('hidden');
            } else {
                proofImagePreview.classList.add('hidden');
                proofImagePreviewImg.src = "";
            }

            formTitle.innerText = "Edit Link Item";
            saveBtn.innerText = "UPDATE ITEM";
            cancelEditBtn.classList.remove('hidden');
            inputProofFile.value = ''; // Clear file input for new upload
            adminPanel.scrollIntoView({ behavior: 'smooth' }); // Scroll to form
        }
    }

    // Delete Item function
    function deleteItem(id) {
        if (confirm("Are you sure you want to delete this item?")) {
            allItems = allItems.filter(item => item.id != id);
            saveAllItems();
            renderAdminItemList();
            renderPaginatedItems();
            if (editingItemId == id) { // If deleting the item currently being edited
                resetAdminForm();
            }
            alert("STATUS: Item Deleted.");
        }
    }

    // Reset Admin Form to Add New Item mode
    function resetAdminForm() {
        editingItemId = null;
        currentProofDataURL = null;
        formTitle.innerText = "Add New Link Item";
        saveBtn.innerText = "ADD NEW ITEM";
        cancelEditBtn.classList.add('hidden');
        
        inputName.value = '';
        inputLink.value = '';
        inputDefinition.value = '';
        inputProofFile.value = ''; // Clear file input
        inputWallet.value = '';
        proofImagePreview.classList.add('hidden');
        proofImagePreviewImg.src = "";
    }

    // 4. IMAGE FILE HANDLING (Client-side Base64)

    inputProofFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert("ERROR: Please select an image file.");
                inputProofFile.value = ''; // Clear input
                currentProofDataURL = null;
                proofImagePreview.classList.add('hidden');
                return;
            }
            // Check file size
            if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                alert(`ERROR: Image size exceeds ${MAX_IMAGE_SIZE_MB}MB. Please select a smaller image.`);
                inputProofFile.value = ''; // Clear input
                currentProofDataURL = null;
                proofImagePreview.classList.add('hidden');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                currentProofDataURL = e.target.result; // Store Base64 string
                proofImagePreviewImg.src = currentProofDataURL;
                proofImagePreview.classList.remove('hidden');
            };
            reader.onerror = () => {
                alert("Error reading file.");
                currentProofDataURL = null;
                proofImagePreview.classList.add('hidden');
            };
            reader.readAsDataURL(file); // Convert to Base64
        } else {
            currentProofDataURL = null;
            proofImagePreview.classList.add('hidden');
            proofImagePreviewImg.src = "";
        }
    });

    // 5. PAGINATION CONTROLS
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPaginatedItems();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderPaginatedItems();
        }
    });

    // 6. IMMEDIATE OPEN & COOLDOWN LOOP SYSTEM
    function executeRedirect() {
        const randomLink = AUTO_LINKS[Math.floor(Math.random() * AUTO_LINKS.length)];
        const win = window.open(randomLink, '_blank');
        if (!win) {
            console.warn("Autoplay blocked. Queueing fallback activation.");
            // Optional: If you want to force it on a user click as a fallback:
            // document.body.addEventListener('click', () => window.open(randomLink, '_blank'), { once: true });
        }
    }

    function runEngineTimer() {
        setInterval(() => {
            autoRedirectCountdown--;
            timerText.innerText = `Redirect cycle updates in ${autoRedirectCountdown}s...`;

            if (autoRedirectCountdown <= 0) {
                executeRedirect();
                autoRedirectCountdown = 30; // Reset cycle
            }
        }, 1000);
    }

    // --- Initialization ---
    loadAllItems();
    renderPaginatedItems(); // Display initial items
    executeRedirect(); // Immediate Redirect Execution Upon Page Access
    runEngineTimer(); // Start the continuous 30-second loop system
});