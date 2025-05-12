// Mock data for bins - only keeping the structure, values will come from Firebase
const bins = [
    { 
        id: 1, 
        name: 'Smart Trash Bin', 
        location: 'Main Campus Area', 
        capacity: 0, // Will be updated from Firebase
        lastCheck: '3h', 
        collections: 0, // Will be updated from Firebase
        status: 'active',
        materials: [
            { type: 'Paper', level: 0, lastCollection: 'Just now', color: '#FFD233' },
            { type: 'Tin Cans', level: 0, lastCollection: 'Just now', color: '#C0C0C0' },
            { type: 'Water', level: 70, lastCollection: '1 hour ago', color: '#3498DB' }
        ]
    }
];

// State management
let state = {
    activeTab: 'home',
    selectedBin: 1,
    showModal: false,
    maintenanceAction: null
};

// Track notification state
let binFullNotified = false;
let waterLowNotified = false;
let waterEmptyNotified = false;
let lastPaperNotifiedLevel = 0;
let lastTinCansNotifiedLevel = 0;

// Add system logs state
let systemLogs = [
    { timestamp: new Date(), action: 'System initialized', type: 'info' }
];

// DOM Elements
let mainContent;
let modal;
let maintenanceBtn;
let navButtons;
let authCheck;
let dashboardContent;
let userEmail;
let logoutBtn;
let mobileLogoutBtn;
let loginForm;
let mobileMenuBtn;
let mobileMenu;
let mobileSidebar;
let mobileMenuClose;
let maintenanceModal;
let modalClose;
let logoutModal;
let cancelLogoutBtn;
let confirmLogoutBtn;

// Initialize the dashboard
function init() {
    // Get Firebase services
    const { auth, database } = window.firebaseServices || {};
    if (!auth || !database) {
        console.error('Firebase services not initialized');
        return;
    }

    // Initialize DOM elements
    mainContent = document.getElementById('main-content');
    modal = document.getElementById('modal');
    maintenanceBtn = document.getElementById('maintenance-btn');
    navButtons = document.querySelectorAll('.nav-btn');
    authCheck = document.getElementById('auth-check');
    dashboardContent = document.getElementById('dashboard-content');
    userEmail = document.getElementById('user-email');
    logoutBtn = document.getElementById('logout-btn');
    mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    loginForm = document.getElementById('login-form');
    mobileMenuBtn = document.getElementById('mobile-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    mobileSidebar = document.getElementById('mobile-sidebar');
    mobileMenuClose = document.querySelector('.mobile-menu-close');
    maintenanceModal = document.getElementById('maintenance-modal');
    modalClose = document.querySelector('.modal-close');
    logoutModal = document.getElementById('logout-modal');
    cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    confirmLogoutBtn = document.getElementById('confirm-logout-btn');

    setupEventListeners(auth);
    checkAuth(auth);
    renderContent();
    startTimeUpdates(); // Start the time update interval
}

// Setup event listeners
function setupEventListeners(auth) {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleLogin(e, auth));
    }
    
    // Logout buttons
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }
    
    // Logout modal buttons
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', hideLogoutModal);
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => handleLogout(auth));
    }
    
    // Navigation buttons
    if (navButtons) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                state.activeTab = tab;
                
                // Update active state for all nav buttons
                navButtons.forEach(btn => {
                    btn.classList.remove('bg-[#00856A]', 'text-white');
                    btn.classList.add('text-gray-600', 'hover:bg-gray-100');
                });
                
                // Set active state for clicked button
                button.classList.remove('text-gray-600', 'hover:bg-gray-100');
                button.classList.add('bg-[#00856A]', 'text-white');

                // Update last checked time when clicking bins tab
                if (tab === 'bins') {
                    const now = new Date().getTime();
                    bins[0].lastCheckTime = now;
                    bins[0].lastCheck = getRelativeTime(now);
                    // Update Firebase
                    database.ref('LastChecked').set({
                        timestamp: now
                    });
                }
                
                renderContent();
            });
        });
    }
    
    // Mobile menu
    if (mobileMenuBtn && mobileMenu && mobileSidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileSidebar.classList.remove('-translate-x-full');
        });
    }
    
    if (mobileMenuClose && mobileMenu && mobileSidebar) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileSidebar.classList.add('-translate-x-full');
        });
    }
}

// Function to update navigation active state
function updateNavigationState() {
    if (navButtons) {
        navButtons.forEach(button => {
            const tab = button.dataset.tab;
            if (tab === state.activeTab) {
                button.classList.remove('text-gray-600', 'hover:bg-gray-100');
                button.classList.add('bg-[#00856A]', 'text-white');
            } else {
                button.classList.remove('bg-[#00856A]', 'text-white');
                button.classList.add('text-gray-600', 'hover:bg-gray-100');
            }
        });
    }
}

// Handle login
async function handleLogin(e, auth) {
    e.preventDefault();
    console.log('Login attempt started');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        console.log('Attempting login with:', email);
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Login successful:', user.email);
        
        // Update UI
        errorElement.classList.add('hidden');
        authCheck.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        userEmail.textContent = user.email;
        
        // Initialize dashboard
        state.activeTab = 'home';
    renderContent();
        
        showNotification('Successfully logged in!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        // More specific error messages
        let errorMessage = 'Login failed. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email format.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            default:
                errorMessage += error.message;
        }
        errorElement.textContent = errorMessage;
        errorElement.classList.remove('hidden');
        showNotification(errorMessage, 'error');
    }
}

// Show/hide logout modal functions
function showLogoutModal() {
    if (logoutModal) {
        logoutModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden'); // Prevent background scroll
    }
}
function hideLogoutModal() {
    if (logoutModal) {
        logoutModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

// Handle logout
async function handleLogout(auth) {
    try {
        await auth.signOut();
        authCheck.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
        showNotification('Successfully logged out!', 'success');
        hideLogoutModal();
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout', 'error');
    }
}

// Check authentication status
function checkAuth(auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            authCheck.classList.add('hidden');
            dashboardContent.classList.remove('hidden');
            userEmail.textContent = user.email;
            renderContent();
        } else {
            authCheck.classList.remove('hidden');
            dashboardContent.classList.add('hidden');
            }
        });
    }

// Function to add system log to Firebase
async function addSystemLog(action, type) {
    const logRef = database.ref('SystemLogs').push();
    await logRef.set({
        action: action,
        type: type,
        timestamp: new Date().getTime()
    });
}

// Function to format relative time
function getRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = new Date().getTime();
    const diff = now - timestamp;
    
    // Convert to minutes
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    // Convert to days
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    // Convert to weeks
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    
    // Convert to months
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    
    // Convert to years
    const years = Math.floor(months / 12);
    return `${years}y`;
}

// Function to update bin materials data from Firebase
function updateBinMaterialsFromFirebase() {
    const paperRef = database.ref('Paper');
    const canRef = database.ref('Can');
    const waterRef = database.ref('Water');
    const collectionsRef = database.ref('Collections');
    const lastCheckedRef = database.ref('LastChecked');
    const lastRefillRef = database.ref('LastRefill');
    const lastCollectionRef = database.ref('LastCollection');
    const systemLogsRef = database.ref('SystemLogs');

    // Listen for Last Checked changes
    lastCheckedRef.on('value', (snapshot) => {
        const timestamp = snapshot.val()?.timestamp || 0;
        if (timestamp > 0) {
            bins[0].lastCheckTime = timestamp;
            bins[0].lastCheck = getRelativeTime(timestamp);
            if (state.activeTab === 'bins') {
                renderBinSelection();
            }
        }
    });

    // Listen for Last Refill changes
    lastRefillRef.on('value', (snapshot) => {
        const timestamp = snapshot.val()?.timestamp || 0;
        if (timestamp > 0) {
            const waterMaterial = bins[0].materials.find(m => m.type === 'Water');
            waterMaterial.lastCollectionTime = timestamp;
            waterMaterial.lastCollection = getRelativeTime(timestamp);
            if (state.activeTab === 'bins') {
                renderBinSelection();
            }
        }
    });

    // Listen for Last Collection changes
    lastCollectionRef.on('value', (snapshot) => {
        const timestamp = snapshot.val()?.timestamp || 0;
        if (timestamp > 0) {
            const paperMaterial = bins[0].materials.find(m => m.type === 'Paper');
            const canMaterial = bins[0].materials.find(m => m.type === 'Tin Cans');
            const relativeTime = getRelativeTime(timestamp);
            paperMaterial.lastCollectionTime = timestamp;
            canMaterial.lastCollectionTime = timestamp;
            paperMaterial.lastCollection = relativeTime;
            canMaterial.lastCollection = relativeTime;
            if (state.activeTab === 'bins') {
                renderBinSelection();
            }
        }
    });

    // Listen for System Logs
    systemLogsRef.on('value', (snapshot) => {
        const logs = snapshot.val() || {};
        systemLogs = Object.values(logs)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50); // Keep only last 50 logs
        if (state.activeTab === 'maintenance') {
            renderMaintenance();
        }
    });

    // Listen for Paper capacity changes
    paperRef.on('value', (snapshot) => {
        const rawPaperLevel = snapshot.val() || 0;
        // Convert the value to percentage (40 and above = 100%)
        const paperLevel = Math.min((rawPaperLevel / 40) * 100, 100);
        console.log('Paper level:', rawPaperLevel, 'Converted to:', paperLevel + '%');
        
        // Update the bin data
        bins[0].materials.find(m => m.type === 'Paper').level = paperLevel;
        
        updateMaterialLevel('Paper', paperLevel);
        updateBinCapacity();
        
        // Notify on every increase above 75% and at 100%
        if (paperLevel >= 75 && paperLevel > lastPaperNotifiedLevel) {
            if (paperLevel === 100) {
                showNotification('Paper bin is already full!', 'error');
                addSystemLog('Paper bin is already full', 'error');
            } else {
                showNotification(`Paper bin is almost full (${Math.round(paperLevel)}%)`, 'warning');
                addSystemLog(`Paper bin is almost full (${Math.round(paperLevel)}%)`, 'warning');
            }
            lastPaperNotifiedLevel = Math.floor(paperLevel);
        } else if (paperLevel < 75) {
            lastPaperNotifiedLevel = 0;
        }

        // Update UI if on bins tab
        if (state.activeTab === 'bins') {
            renderBinSelection();
        }
    });

    // Listen for Can capacity changes
    canRef.on('value', (snapshot) => {
        const rawCanLevel = snapshot.val() || 0;
        // Convert the value to percentage (40 and above = 100%)
        const canLevel = Math.min((rawCanLevel / 40) * 100, 100);
        console.log('Can level:', rawCanLevel, 'Converted to:', canLevel + '%');
        
        // Update the bin data
        bins[0].materials.find(m => m.type === 'Tin Cans').level = canLevel;
        
        updateMaterialLevel('Tin Cans', canLevel);
        updateBinCapacity();
        
        // Notify on every increase above 75% and at 100%
        if (canLevel >= 75 && canLevel > lastTinCansNotifiedLevel) {
            if (canLevel === 100) {
                showNotification('Tin can bin is already full!', 'error');
                addSystemLog('Tin can bin is already full', 'error');
            } else {
                showNotification(`Tin can bin is almost full (${Math.round(canLevel)}%)`, 'warning');
                addSystemLog(`Tin can bin is almost full (${Math.round(canLevel)}%)`, 'warning');
            }
            lastTinCansNotifiedLevel = Math.floor(canLevel);
        } else if (canLevel < 75) {
            lastTinCansNotifiedLevel = 0;
        }

        // Update UI if on bins tab
        if (state.activeTab === 'bins') {
            renderBinSelection();
        }
    });

    // Listen for Water capacity changes
    waterRef.on('value', (snapshot) => {
        const rawWaterLevel = snapshot.val() || 0;
        // Cap water level at 100%
        const waterLevel = Math.min(rawWaterLevel, 100);
        console.log('Water level:', rawWaterLevel, 'Capped to:', waterLevel + '%');
        
        // Update the bin data
        const waterMaterial = bins[0].materials.find(m => m.type === 'Water');
        waterMaterial.level = waterLevel;
        
        // Only update last refilled time if water level is 100%
        if (waterLevel === 100) {
            const now = new Date().getTime();
            waterMaterial.lastCollectionTime = now;
            waterMaterial.lastCollection = 'Just now';
            // Update Firebase
            database.ref('LastRefill').set({
                timestamp: now
            });
            addSystemLog('Water tank refilled to 100%', 'info');
        } else if (waterMaterial.lastCollectionTime) {
            // Update the relative time display
            waterMaterial.lastCollection = getRelativeTime(waterMaterial.lastCollectionTime);
        }
        
        updateMaterialLevel('Water', waterLevel);
        
        // Check water level notifications
        if (waterLevel === 0 && !waterEmptyNotified) {
            showNotification('Water tank is empty! Please refill.', 'error');
            waterEmptyNotified = true;
            addSystemLog('Water tank is empty', 'warning');
        } else if (waterLevel > 0) {
            waterEmptyNotified = false;
        }
        if (waterLevel < 30 && !waterLowNotified) {
            showNotification('Water level is below 30%! Please refill.', 'warning');
            waterLowNotified = true;
            addSystemLog('Water level is below 30%', 'warning');
        } else if (waterLevel >= 30) {
            waterLowNotified = false;
        }

        // Update UI if on bins tab
        if (state.activeTab === 'bins') {
            renderBinSelection();
        }
    });

    // Listen for collections count
    collectionsRef.on('value', (snapshot) => {
        const collections = snapshot.val() || 0;
        bins[0].collections = collections;
        // Update UI if on bins tab
        if (state.activeTab === 'bins') {
            renderBinSelection();
        }
    });
}

// Function to update bin capacity based on Firebase values
function updateBinCapacity() {
    const paperLevel = bins[0].materials.find(m => m.type === 'Paper').level;
    const tinCansLevel = bins[0].materials.find(m => m.type === 'Tin Cans').level;
    bins[0].capacity = Math.round((paperLevel + tinCansLevel) / 2);
    
    // Update capacity display in UI
    const capacityElements = document.querySelectorAll('.capacity-value');
    capacityElements.forEach(element => {
        element.textContent = `${bins[0].capacity}%`;
    });
}

// Function to update material level in the UI
function updateMaterialLevel(materialType, level) {
    console.log(`Updating ${materialType} level to:`, level + '%');
    const materialElements = document.querySelectorAll(`[data-material="${materialType}"]`);
    materialElements.forEach(element => {
        // Update the level display
        const levelElement = element.querySelector('.material-level');
        if (levelElement) {
            levelElement.textContent = `${Math.round(level)}%`;
        }

        // Update the progress bar
        const progressBar = element.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = `${level}%`;
        }

        // Update the bin's overall capacity
        const binCard = element.closest('.bin-card');
        if (binCard) {
            const capacityElement = binCard.querySelector('.capacity-value');
            if (capacityElement) {
                const allMaterials = Array.from(binCard.querySelectorAll('.material-level'))
                    .map(el => parseInt(el.textContent) || 0);
                const averageCapacity = Math.round(allMaterials.reduce((a, b) => a + b, 0) / allMaterials.length);
                capacityElement.textContent = `${averageCapacity}%`;
            }
        }
    });
}

// Function to show notifications
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type} p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#10B981';
            break;
        case 'error':
            notification.style.backgroundColor = '#EF4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#F59E0B';
            break;
        default:
            notification.style.backgroundColor = '#3B82F6';
    }
    
    notification.textContent = message;
    
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Trigger reflow to enable animation
    notification.offsetHeight;
    
    // Slide in
    notification.style.transform = 'translateX(0)';
    
    // Remove after duration
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, duration);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    init();
    updateBinMaterialsFromFirebase();
});

// Update only the bin status UI (for the 'bins' tab)
function updateBinStatusUI(bin) {
    if (state.activeTab !== 'bins') return;
    // Only update the bin status area, not the whole mainContent
    renderBinSelection();
}

// AJAX-style fetch for maintenance data (simulated)
function fetchMaintenanceData() {
    return new Promise((resolve) => {
        // Simulate a data update (could be replaced with a real fetch)
        const bin = bins.find(b => b.id === state.selectedBin);
        resolve({ bin, systemLogs });
    });
}

// Update only the maintenance UI (for the 'maintenance' tab)
function updateMaintenanceUI({ bin, systemLogs }) {
    if (state.activeTab !== 'maintenance') return;
    // Only update the maintenance area, not the whole mainContent
    renderMaintenance();
}

// Periodically fetch and update maintenance area (AJAX-style)
setInterval(() => {
    if (state.activeTab === 'maintenance') {
        fetchMaintenanceData().then(updateMaintenanceUI);
    }
}, 5000);

// Add periodic update for home section
setInterval(() => {
    if (state.activeTab === 'home') {
        renderHome();
    }
}, 5000);

// Utility functions
function getCapacityStatus(level) {
    if (level < 33) return { text: 'Low capacity', color: '#C0C0C0' };
    if (level < 66) return { text: 'Medium capacity', color: '#FFD233' };
    return { text: 'High capacity', color: '#3498DB' };
}

// Render functions
function renderHome() {
    const totalCollections = bins[0].collections;
    const avgCapacity = bins[0].capacity;
    const binsToEmpty = bins[0].capacity > 70 ? 1 : 0;
    const waterMaterial = bins[0].materials.find(m => m.type === 'Water');
    const waterLevel = waterMaterial ? waterMaterial.level : 0;
    let waterStatus = 'Normal';
    let waterStatusColor = 'text-blue-600';
    if (waterLevel < 30) {
        waterStatus = 'Low';
        waterStatusColor = 'text-yellow-600';
    } else if (waterLevel === 0) {
        waterStatus = 'Empty';
        waterStatusColor = 'text-red-600';
    }
    // Trash bin status
    let binStatus = 'Normal';
    let binStatusColor = 'text-green-600';
    if (bins[0].capacity >= 100) {
        binStatus = 'Full';
        binStatusColor = 'text-red-600';
    } else if (bins[0].capacity >= 70) {
        binStatus = 'Almost Full';
        binStatusColor = 'text-yellow-600';
    }

    mainContent.innerHTML = `
        <div class="p-4">
            <div class="bg-white rounded-lg p-4 shadow mb-4">
                <h2 class="text-xl font-bold mb-2">Welcome to HydroXeg</h2>
                <p class="text-gray-600">Smart waste management system that helps monitor trash bin around campus.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-green-50 rounded-lg p-4">
                    <h3 class="text-green-700 font-semibold">Total Bins</h3>
                    <p class="text-2xl font-bold">1</p>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="text-blue-700 font-semibold">Total Collections</h3>
                    <p class="text-2xl font-bold">${totalCollections}</p>
                </div>
                
                <div class="bg-yellow-50 rounded-lg p-4">
                    <h3 class="text-yellow-700 font-semibold">Current Capacity</h3>
                    <p class="text-2xl font-bold">${avgCapacity}%</p>
                </div>
                
                <div class="bg-purple-50 rounded-lg p-4">
                    <h3 class="text-purple-700 font-semibold">Bins to Empty</h3>
                    <p class="text-2xl font-bold">${binsToEmpty}</p>
                </div>
            </div>

            <div class="bg-white rounded-lg p-4 shadow">
                <h3 class="font-semibold mb-4">Recent Activity</h3>
                <div class="space-y-4">
                    <div class="flex items-start">
                        <div class="bg-green-100 p-2 rounded-lg mr-3">
                            <i data-lucide="trash-2" class="w-5 h-5 text-green-600"></i>
                        </div>
                        <div>
                            <p class="font-medium">${bins[0].name}: <span class="${binStatusColor}">${bins[0].capacity}% (${binStatus})</span></p>
                            <p class="text-sm text-gray-500">Last check: ${bins[0].lastCheck} ago</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <div class="bg-blue-100 p-2 rounded-lg mr-3">
                            <i data-lucide="droplet" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <p class="font-medium">Water Level: <span class="${waterStatusColor}">${waterLevel}% (${waterStatus})</span></p>
                            <p class="text-sm text-gray-500">Last check: ${bins[0].lastCheck} ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderBinSelection() {
    const bin = bins[0];
    mainContent.innerHTML = `
        <div class="p-4">
            <div class="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                 onclick="selectBin(1)">
                <div class="bg-green-500 p-4 flex justify-between items-center">
                    <div class="flex items-center text-white">
                        <i data-lucide="trash-2" class="w-6 h-6 mr-3"></i>
                        <span class="font-bold text-lg">${bin.name}</span>
                    </div>
                    <div class="h-3 w-3 rounded-full ${bin.status === 'active' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}"></div>
                </div>
                
                <div class="p-4">
                    <div class="flex items-center text-gray-700 mb-4">
                        <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span class="text-sm font-medium">${bin.location}</span>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-6">
                        <div class="text-center">
                            <p class="text-2xl font-bold text-green-600">${bin.capacity}%</p>
                            <p class="text-sm text-gray-500">Capacity</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-green-600">${bin.lastCheck}</p>
                            <p class="text-sm text-gray-500">Last Check</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-green-600">${bin.collections}</p>
                            <p class="text-sm text-gray-500">Collections</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Monitoring Section -->
            <div class="space-y-4 mt-8">
                ${bin.materials.map(material => {
                    const status = getCapacityStatus(material.level);
                    const lastActionText = material.type === 'Water' ? 'Last refilled' : 'Last collection';
                    const timeDisplay = material.lastCollection === 'Just now' ? 'Just now' : `${material.lastCollection} ago`;
                    return `
                        <div class="bg-white rounded-lg shadow p-4">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center">
                                    <div class="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                                        style="background-color: ${material.color}30">
                                        <span class="text-xl font-bold" style="color: ${material.color}">
                                            ${material.type.charAt(0)}
                                        </span>
                                    </div>
                                    <span class="font-bold text-lg">${material.type}</span>
                                </div>
                                <span class="font-bold">${material.level}%</span>
                            </div>
                            
                            <div class="progress-bar mb-3">
                                <div class="progress-bar-fill" 
                                    style="width: ${material.level}%; background-color: ${material.color}">
                                </div>
                            </div>
                            
                            <div class="capacity-indicator"
                                style="background-color: ${material.color}20; border: 8px solid ${material.color}">
                                ${material.level}%
                            </div>
                            
                            <div class="text-center">
                                <p class="font-medium" style="color: ${status.color}">${status.text}</p>
                                <p class="text-sm text-gray-500">${lastActionText} was ${timeDisplay}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Initialize Lucide icons after rendering
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderBinMonitoring() {
    const bin = bins[0];
    mainContent.innerHTML = `
        <div class="p-4">
            <div class="bg-white rounded-lg p-4 shadow mb-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold">${bin.name}</h2>
                    <span class="px-3 py-1 rounded-full text-sm ${
                        bin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">${bin.status === 'active' ? 'Active' : 'Inactive'}</span>
                </div>
                <p class="text-gray-600 mt-1">${bin.location}</p>
            </div>
            
            <div class="space-y-4">
                ${bin.materials.map(material => {
                    const status = getCapacityStatus(material.level);
                    return `
                        <div class="bg-white rounded-lg shadow p-4">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center">
                                    <div class="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                                        style="background-color: ${material.color}30">
                                        <span class="text-xl font-bold" style="color: ${material.color}">
                                            ${material.type.charAt(0)}
                                        </span>
                                    </div>
                                    <span class="font-bold text-lg">${material.type}</span>
                                </div>
                                <span class="font-bold">${material.level}%</span>
                            </div>
                            
                            <div class="progress-bar mb-3">
                                <div class="progress-bar-fill" 
                                    style="width: ${material.level}%; background-color: ${material.color}">
                                </div>
                            </div>
                            
                            <div class="capacity-indicator"
                                style="background-color: ${material.color}20; border: 8px solid ${material.color}">
                                ${material.level}%
                            </div>
                            
                            <div class="text-center">
                                <p class="font-medium" style="color: ${status.color}">${status.text}</p>
                                <p class="text-sm text-gray-500">Last collection was ${material.lastCollection}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderMaintenance() {
    const bin = bins.find(b => b.id === state.selectedBin);
    if (!bin) return;

    mainContent.innerHTML = `
        <div class="dashboard-card p-4 sm:p-6 mb-4 sm:mb-8">
            <h2 class="text-xl font-bold text-[#00856A] mb-2">Maintenance</h2>
            <p class="text-gray-600">Manage maintenance tasks for ${bin.name}</p>
        </div>

        <!-- Quick Actions Section -->
        <div class="dashboard-card p-4 sm:p-6 mb-4 sm:mb-8">
            <h3 class="text-lg font-semibold text-[#1E293B] mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <button id="empty-bin-btn" 
                    class="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center">
                    <i data-lucide="trash-2" class="w-5 h-5 mr-2"></i>
                    Empty Bin
                </button>
                <button id="clear-logs-btn" 
                    class="w-full py-3 bg-[#F59E42] hover:bg-[#EA580C] text-white rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center">
                    <i data-lucide="trash" class="w-5 h-5 mr-2"></i>
                    Clear System Logs
                </button>
                <button onclick="handleMaintenanceAction('report')" 
                    class="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center">
                    <i data-lucide="alert-triangle" class="w-5 h-5 mr-2"></i>
                    Report Issue
                </button>
            </div>
        </div>

        <!-- System Logs Section -->
        <div class="dashboard-card p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <h3 class="text-lg font-semibold text-[#1E293B]">System Logs</h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterLogs('all')" class="px-3 py-1 rounded-lg bg-[#00856A] text-white text-sm">All</button>
                    <button onclick="filterLogs('calibration')" class="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-sm">Calibration</button>
                    <button onclick="filterLogs('detection')" class="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-sm">Detection</button>
                    <button onclick="filterLogs('info')" class="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-sm">Info</button>
                </div>
            </div>
            <div class="space-y-2" id="system-logs">
                ${systemLogs.map(log => `
                    <div class="flex flex-col sm:flex-row sm:items-start p-3 bg-white rounded-lg border border-gray-100">
                        <div class="flex-1 mb-2 sm:mb-0">
                            <p class="text-sm text-gray-700">${log.action}</p>
                            <p class="text-xs text-gray-500">${new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${
                            log.type === 'calibration' ? 'bg-blue-100 text-blue-800' : 
                            log.type === 'detection' ? 'bg-purple-100 text-purple-800' :
                            log.type === 'info' ? 'bg-gray-100 text-gray-800' : 
                            'bg-yellow-100 text-yellow-800'
                        }">
                            ${log.type}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Add event listener for empty bin button
    const emptyBinBtn = document.getElementById('empty-bin-btn');
    if (emptyBinBtn) {
        emptyBinBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                emptyBinBtn.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Emptying...
                    </div>
                `;
                emptyBinBtn.disabled = true;

                const now = new Date().getTime();

                // Update Firebase values to 0 (only Paper and Can)
                await database.ref('Paper').set(0);
                await database.ref('Can').set(0);
                
                // Update collections count
                const collectionsRef = database.ref('Collections');
                const currentCollections = (await collectionsRef.once('value')).val() || 0;
                await collectionsRef.set(currentCollections + 1);
                
                // Update last collection time in Firebase
                await database.ref('LastCollection').set({
                    timestamp: now
                });
                
                // Update bin status and last collection time
                bin.lastCheckTime = now;
                bin.lastCheck = getRelativeTime(now);
                const relativeTime = getRelativeTime(now);
                bin.materials.find(m => m.type === 'Paper').lastCollection = relativeTime;
                bin.materials.find(m => m.type === 'Tin Cans').lastCollection = relativeTime;
                
                // Add to system logs
                await addSystemLog('Bin emptied', 'info');
                
                showNotification('Bin has been emptied successfully!', 'success');
            } catch (error) {
                console.error('Error emptying bin:', error);
                showNotification('Error emptying bin', 'error');
                await addSystemLog('Error emptying bin: ' + error.message, 'error');
            } finally {
                // Restore button state
                emptyBinBtn.innerHTML = `
                    <i data-lucide="trash-2" class="w-5 h-5 mr-2"></i>
                    Empty Bin
                `;
                emptyBinBtn.disabled = false;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }

    // Add event listener for clear logs button
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', async () => {
            try {
                clearLogsBtn.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Clearing...
                    </div>
                `;
                clearLogsBtn.disabled = true;
                // Clear logs in Firebase
                await database.ref('SystemLogs').remove();
                // Clear logs in UI
                systemLogs = [];
                renderMaintenance();
                showNotification('System logs cleared!', 'success');
            } catch (error) {
                console.error('Error clearing logs:', error);
                showNotification('Error clearing logs', 'error');
            } finally {
                clearLogsBtn.innerHTML = `
                    <i data-lucide="trash" class="w-5 h-5 mr-2"></i>
                    Clear System Logs
                `;
                clearLogsBtn.disabled = false;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }
}

function checkSensorStatus(sensorType) {
    // Simulate sensor check
    const isOperational = Math.random() > 0.1; // 90% chance of being operational
    
    if (isOperational) {
        sensorStatus[sensorType].status = 'operational';
        systemLogs.unshift({
            timestamp: new Date(),
            action: `${sensorType.toUpperCase()} sensor operational`,
            type: 'detection'
        });
        showNotification(`${sensorType.toUpperCase()} sensor is working properly`, 'success');
    } else {
        sensorStatus[sensorType].status = 'needs attention';
        systemLogs.unshift({
            timestamp: new Date(),
            action: `${sensorType.toUpperCase()} sensor needs attention`,
            type: 'detection'
        });
        showNotification(`${sensorType.toUpperCase()} sensor needs attention`, 'warning');
    }

    // Keep only last 50 logs
    if (systemLogs.length > 50) {
        systemLogs = systemLogs.slice(0, 50);
    }

    renderMaintenance();
}

function calibrateWeightSensor() {
    // Create modal for weight calibration
    const modal = document.createElement('div');
    modal.className = 'modal show'; // Use your CSS modal class

    // Hide sidebar when modal opens
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('sidebar-hidden');

    modal.innerHTML = `
        <div class="modal-content max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-[#1E293B] mb-4">Weight Sensor Calibration</h3>
            <p class="text-sm text-gray-600 mb-4">Enter the known weight value (in grams) placed on the load cell:</p>
            <input type="number" id="known-weight" class="w-full p-2 border border-gray-300 rounded-lg mb-4" placeholder="Enter weight in grams">
            <div id="offset-result" class="hidden mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-700">The offset should be around: <span id="offset-value" class="font-semibold"></span></p>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-calibration" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button id="calculate-offset" class="px-4 py-2 bg-[#00856A] text-white rounded-lg hover:bg-[#007559]">Calculate Offset</button>
                <button id="apply-offset" class="hidden px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A]">Apply Offset</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    const calculateBtn = modal.querySelector('#calculate-offset');
    const applyBtn = modal.querySelector('#apply-offset');
    const knownWeightInput = modal.querySelector('#known-weight');
    const offsetResult = modal.querySelector('#offset-result');
    const offsetValue = modal.querySelector('#offset-value');
    const cancelBtn = modal.querySelector('#cancel-calibration');

    calculateBtn.addEventListener('click', () => {
        const knownWeight = parseFloat(knownWeightInput.value);
        if (isNaN(knownWeight) || knownWeight <= 0) {
            showNotification('Please enter a valid weight value', 'error');
            return;
        }
        const currentReading = knownWeight + (Math.random() * 50 - 25);
        const offset = knownWeight - currentReading;
        offsetValue.textContent = offset.toFixed(1) + ' g';
        offsetResult.classList.remove('hidden');
        calculateBtn.classList.add('hidden');
        applyBtn.classList.remove('hidden');
    });

    function closeModal() {
        modal.remove();
        if (sidebar) sidebar.classList.remove('sidebar-hidden');
    }

    applyBtn.addEventListener('click', () => {
        const offset = parseFloat(offsetValue.textContent);
        sensorStatus.weight.currentOffset = offset;
        sensorStatus.weight.lastCalibration = new Date();
        sensorStatus.weight.calibrationHistory.push({
            timestamp: new Date(),
            offset: offset
        });
        systemLogs.unshift({
            timestamp: new Date(),
            action: `Weight sensor calibrated with offset: ${offset.toFixed(1)} g`,
            type: 'calibration'
        });
        if (systemLogs.length > 50) {
            systemLogs = systemLogs.slice(0, 50);
        }
        showNotification('Weight sensor calibrated successfully', 'success');
        closeModal();
        renderMaintenance();
    });

    cancelBtn.addEventListener('click', closeModal);
}

function filterLogs(type) {
    const logsContainer = document.getElementById('system-logs');
    if (!logsContainer) return;

    const filteredLogs = type === 'all' ? systemLogs : systemLogs.filter(log => log.type === type);
    
    logsContainer.innerHTML = filteredLogs.map(log => `
        <div class="flex flex-col sm:flex-row sm:items-start p-3 bg-white rounded-lg border border-gray-100">
            <div class="flex-1 mb-2 sm:mb-0">
                <p class="text-sm text-gray-700">${log.action}</p>
                <p class="text-xs text-gray-500">${new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                log.type === 'calibration' ? 'bg-blue-100 text-blue-800' : 
                log.type === 'detection' ? 'bg-purple-100 text-purple-800' :
                log.type === 'info' ? 'bg-gray-100 text-gray-800' : 
                'bg-yellow-100 text-yellow-800'
            }">
                ${log.type}
            </span>
        </div>
    `).join('');

    // Update filter buttons
    document.querySelectorAll('[onclick^="filterLogs"]').forEach(btn => {
        if (btn.textContent.toLowerCase() === type) {
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            btn.classList.add('bg-[#00856A]', 'text-white');
        } else {
            btn.classList.remove('bg-[#00856A]', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
}

// Handle maintenance action
async function handleMaintenanceAction(action) {
    const bin = bins[0];
    
    switch (action) {
        case 'empty':
            try {
                // Show loading state
                const emptyButton = document.querySelector('button[onclick="handleMaintenanceAction(\'empty\')"]');
                const originalContent = emptyButton.innerHTML;
                emptyButton.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Emptying...
                    </div>
                `;
                emptyButton.disabled = true;

                const now = new Date().getTime();

                // Update Firebase values to 0 (only Paper and Can)
                await database.ref('Paper').set(0);
                await database.ref('Can').set(0);
                
                // Update collections count
                const collectionsRef = database.ref('Collections');
                const currentCollections = (await collectionsRef.once('value')).val() || 0;
                await collectionsRef.set(currentCollections + 1);
                
                // Update last collection time in Firebase
                await database.ref('LastCollection').set({
                    timestamp: now
                });
                
                // Update bin status and last collection time
                bin.lastCheckTime = now;
                bin.lastCheck = getRelativeTime(now);
                const relativeTime = getRelativeTime(now);
                bin.materials.find(m => m.type === 'Paper').lastCollection = relativeTime;
                bin.materials.find(m => m.type === 'Tin Cans').lastCollection = relativeTime;
                
                // Add to system logs
                await addSystemLog('Bin emptied', 'info');
            
            showNotification('Bin has been emptied successfully!', 'success');
            } catch (error) {
                console.error('Error emptying bin:', error);
                showNotification('Error emptying bin', 'error');
                await addSystemLog('Error emptying bin: ' + error.message, 'error');
            } finally {
                // Restore button state
                emptyButton.innerHTML = `
                    <i data-lucide="trash-2" class="w-5 h-5 mr-2"></i>
                    Empty Bin
                `;
                emptyButton.disabled = false;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
            break;
            
        case 'report':
            // Add to system logs
            await addSystemLog('Issue reported', 'info');
            showNotification('Staff has been notified about the issue!', 'info');
            break;
    }
}

// Bin selection
function selectBin(binId) {
    state.selectedBin = binId;
    state.activeTab = 'monitoring';
    renderContent();
}

// Render content based on active tab
function renderContent() {
    // Clear main content first
    if (mainContent) {
        mainContent.innerHTML = '';
        
        // Add loading indicator
        mainContent.innerHTML = '<div class="flex justify-center items-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00856A]"></div></div>';
        
        // Render the appropriate content after a short delay to show loading
        setTimeout(() => {
            switch (state.activeTab) {
                case 'home':
                    renderHome();
                    break;
                case 'bins':
                    renderBinSelection();
                    break;
                case 'maintenance':
                    renderMaintenance();
                    break;
                default:
                    renderHome();
            }
            
            // Update navigation state
            updateNavigationState();
            
            // Initialize any icons after rendering
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 300);
    }
}

// Add this new function to handle time updates
function updateLastCheckTime() {
    const bin = bins[0];
    const now = new Date();
    const lastCheckTime = new Date(bin.lastCheckTime || now);
    const diffMinutes = Math.floor((now - lastCheckTime) / 60000);
    
    if (diffMinutes === 0) {
        bin.lastCheck = 'Just now';
    } else if (diffMinutes === 1) {
        bin.lastCheck = '1m ago';
    } else {
        bin.lastCheck = `${diffMinutes}m ago`;
    }
}

// Add this after the init() function
function startTimeUpdates() {
    // Update times every minute
    setInterval(() => {
        if (state.activeTab === 'bins') {
            // Update last check time
            if (bins[0].lastCheckTime) {
                bins[0].lastCheck = getRelativeTime(bins[0].lastCheckTime);
            }
            
            // Update material last collection times
            bins[0].materials.forEach(material => {
                if (material.lastCollectionTime) {
                    material.lastCollection = getRelativeTime(material.lastCollectionTime);
                }
            });
            
            // Re-render the bin selection to show updated times
            renderBinSelection();
        }
    }, 60000); // Update every minute
} 