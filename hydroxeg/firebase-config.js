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
function showNotification(message, type = 'info') {
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
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Wait for DOM to be loaded before setting up Firebase connection status
document.addEventListener('DOMContentLoaded', () => {
    // Check Firebase connection status
    database.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log('Connected to Firebase');
            showNotification('Connected to Firebase', 'success');
        } else {
            console.log('Disconnected from Firebase');
            showNotification('Disconnected from Firebase', 'error');
        }
    });
});

// Export services
window.firebaseServices = {
    auth,
    database
}; 