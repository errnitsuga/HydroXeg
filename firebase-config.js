// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlGnpgZpYwQP4Oy_IsUQWN3e4MNfaRzkQ",
    authDomain: "hydroxeg.firebaseapp.com",
    databaseURL: "https://hydroxeg-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hydroxeg",
    storageBucket: "hydroxeg.firebasestorage.app",
    messagingSenderId: "836530751977",
    appId: "1:836530751977:web:6f4efe0258727650c82378"
};

// Initialize Firebase
let app;
try {
    app = firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    if (error.code === 'app/duplicate-app') {
        app = firebase.app();
        console.log('Using existing Firebase app');
    } else {
        throw error;
    }
}

// Initialize services
const auth = firebase.auth();
const database = firebase.database();

// Function to show notifications
function showNotification(message, type = 'info', duration = 3000) {
    // Only show notification if document.body exists
    if (!document.body) {
        console.log('Notification:', message);
        return;
    }

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Function to refresh dashboard data
function refreshDashboardData() {
    console.log('Refreshing dashboard data...');
    // Get all bin data
    database.ref('bins').once('value')
        .then((snapshot) => {
            const binsData = snapshot.val();
            console.log('Received bins data:', binsData);
            if (binsData) {
                // Update bin cards
                updateBinCards(binsData);
                // Update statistics
                updateStatistics(binsData);
            } else {
                console.log('No bins data available');
            }
        })
        .catch((error) => {
            console.error('Error refreshing dashboard data:', error);
            showNotification('Error loading bin data', 'error');
        });
}

// Function to check bin capacity and show notifications
function checkBinCapacity(binId, binData) {
    if (!binData.materials) return;
    
    Object.entries(binData.materials).forEach(([material, level]) => {
        if (level >= 100) {
            showNotification(`${material} bin is already full!`, 'error');
        } else if (level >= 75 && level < 100) {
            showNotification(`${material} bin is almost full (${level}%)`, 'warning');
        }
    });
}

// Function to update bin cards
function updateBinCards(binsData) {
    console.log('Updating bin cards...');
    const binCardsContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    if (!binCardsContainer) {
        console.error('Bin cards container not found');
        return;
    }

    // Clear existing bin cards
    binCardsContainer.innerHTML = '';

    // Create new bin cards for each bin
    Object.entries(binsData).forEach(([binId, binData]) => {
        console.log('Creating card for bin:', binId, binData);
        const binCard = createBinCard(binId, binData);
        binCardsContainer.appendChild(binCard);
        // Check capacity and show notifications
        checkBinCapacity(binId, binData);
    });
}

// Function to create a bin card
function createBinCard(binId, binData) {
    const card = document.createElement('div');
    card.className = 'bin-card bg-white rounded-lg shadow-md p-6';
    
    // Calculate overall capacity
    const overallCapacity = calculateOverallCapacity(binData);
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">Smart Trash Bin ${binId}</h3>
                <p class="text-sm text-gray-600">${binData.location || 'Main Campus Area'}</p>
            </div>
            <span class="px-3 py-1 text-sm font-medium ${binData.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'} rounded-full">
                ${binData.status || 'Active'}
            </span>
        </div>
        
        <div class="space-y-4">
            ${Object.entries(binData.materials || {}).map(([material, level]) => `
                <div class="material-item" data-material="${material}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium text-gray-700">${material}</span>
                        <span class="material-level text-sm font-medium text-gray-600">${level}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="progress-bar h-full ${getMaterialColor(material)}" style="width: ${level}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Overall Capacity</span>
                <span class="capacity-value text-sm font-medium text-gray-800">${overallCapacity}%</span>
            </div>
        </div>
    `;
    
    return card;
}

// Function to calculate overall capacity
function calculateOverallCapacity(binData) {
    if (!binData.materials) return 0;
    const levels = Object.values(binData.materials);
    return Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length);
}

// Function to get material color
function getMaterialColor(material) {
    const colors = {
        'Paper': 'bg-[#FFD233]',
        'Tin Cans': 'bg-[#C0C0C0]',
        'Water': 'bg-[#3498DB]',
        'Plastic': 'bg-[#2ECC71]',
        'Glass': 'bg-[#9B59B6]'
    };
    return colors[material] || 'bg-[#00856A]';
}

// Function to update statistics
function updateStatistics(binsData) {
    console.log('Updating statistics...');
    const bins = Object.values(binsData);
    
    // Update total bins
    const totalBinsElement = document.querySelector('.stat-value:nth-child(2)');
    if (totalBinsElement) {
        totalBinsElement.textContent = bins.length;
    }

    // Update total collections
    const totalCollections = bins.reduce((sum, bin) => sum + (bin.collections || 0), 0);
    const totalCollectionsElement = document.querySelector('.stat-value:nth-child(3)');
    if (totalCollectionsElement) {
        totalCollectionsElement.textContent = totalCollections;
    }

    // Update average capacity
    const averageCapacity = Math.round(bins.reduce((sum, bin) => {
        return sum + calculateOverallCapacity(bin);
    }, 0) / bins.length);
    const averageCapacityElement = document.querySelector('.stat-value:nth-child(4)');
    if (averageCapacityElement) {
        averageCapacityElement.textContent = `${averageCapacity}%`;
    }

    // Update bins to empty
    const binsToEmpty = bins.filter(bin => calculateOverallCapacity(bin) >= 80).length;
    const binsToEmptyElement = document.querySelector('.stat-value:nth-child(5)');
    if (binsToEmptyElement) {
        binsToEmptyElement.textContent = binsToEmpty;
    }
}

// Function to update user email display
function updateUserEmailDisplay(email) {
    // Update desktop view
    const desktopEmailElement = document.getElementById('user-email');
    if (desktopEmailElement) {
        desktopEmailElement.textContent = email;
    }

    // Update mobile view
    const mobileEmailElement = document.getElementById('mobile-user-email');
    if (mobileEmailElement) {
        mobileEmailElement.textContent = email;
    }
}

// Wait for DOM to be loaded before setting up Firebase connection status
document.addEventListener('DOMContentLoaded', () => {
    let lastConnectionState = null;
    let connectionTimeout;

    // Show initial connecting message
    showNotification('Connecting to Firebase...', 'info', 2000);

    // Check Firebase connection status
    database.ref('.info/connected').on('value', (snap) => {
        // Clear any existing timeout
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
        }

        const isConnected = snap.val() === true;
        
        // Only show notification if connection state has changed
        if (lastConnectionState !== isConnected) {
            console.log(isConnected ? 'Connected to Firebase' : 'Disconnected from Firebase');
            
            connectionTimeout = setTimeout(() => {
                if (isConnected) {
            showNotification('Connected to Firebase', 'success');
                    // Refresh data when connected
                    refreshDashboardData();
                } else {
                    showNotification('Disconnected from Firebase', 'error');
                }
            }, 1000);
            
            lastConnectionState = isConnected;
        }
    });

    // Set up real-time listeners for data changes
    database.ref('bins').on('value', (snapshot) => {
        console.log('Real-time update received');
        const binsData = snapshot.val();
        if (binsData) {
            console.log('Updating with real-time data:', binsData);
            
            // Check for capacity changes and show notifications
            Object.entries(binsData).forEach(([binId, binData]) => {
                if (binData.materials) {
                    Object.entries(binData.materials).forEach(([material, level]) => {
                        // Show notification for any level above threshold
                        if (level >= 100) {
                            showNotification(`${material} bin is already full!`, 'error');
                        } else if (level >= 75 && level < 100) {
                            showNotification(`${material} bin is almost full (${level}%)`, 'warning');
                        }
                    });
                }
            });
            
            updateBinCards(binsData);
            updateStatistics(binsData);
        } else {
            console.log('No real-time data available');
        }
    });

    // Initial data load
    refreshDashboardData();

    // Set up periodic refresh (every 30 seconds) as a backup
    setInterval(refreshDashboardData, 30000);

    // Set up auth state listener to update email display
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateUserEmailDisplay(user.email);
        } else {
            updateUserEmailDisplay('');
        }
    });
});

// Export services
window.firebaseServices = {
    auth,
    database
}; 