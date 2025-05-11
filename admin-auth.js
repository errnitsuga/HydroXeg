// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// DOM Elements
const adminModal = document.getElementById('admin-modal');
const adminForm = document.getElementById('admin-form');
const adminLoginBtn = document.getElementById('admin-login-btn');
const mobileAdminLoginBtn = document.getElementById('mobile-admin-login-btn');

// Show admin modal
function showAdminModal() {
    adminModal.classList.remove('hidden');
    adminModal.classList.add('flex');
}

// Hide admin modal
function hideAdminModal() {
    adminModal.classList.remove('flex');
    adminModal.classList.add('hidden');
}

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Redirect to dashboard on successful login
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Event listeners
if (adminLoginBtn) {
adminLoginBtn.addEventListener('click', showAdminModal);
}
if (mobileAdminLoginBtn) {
mobileAdminLoginBtn.addEventListener('click', showAdminModal);
}
if (adminForm) {
adminForm.addEventListener('submit', handleAdminLogin);
}

// Check if user is already logged in
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Only redirect if on index page and trying to access dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            // User is logged in and trying to access dashboard - allow it
            return;
        }
    } else {
        // If on dashboard and not logged in, redirect to index
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
    }
});

// Firebase Admin Authentication
const adminAuth = {
    // Admin login function
    async login(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Check if user has admin custom claim
            const idTokenResult = await user.getIdTokenResult();
            
            if (!idTokenResult.claims.admin) {
                await firebase.auth().signOut();
                throw new Error('Unauthorized access. Admin only.');
            }
            
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Admin logout function
    async logout() {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Check if user is admin
    async checkAdminStatus() {
        const user = firebase.auth().currentUser;
        if (!user) return false;

        const idTokenResult = await user.getIdTokenResult();
        return idTokenResult.claims.admin === true;
    }
};

// Admin Modal Functions
function showAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('admin-form').reset();
}

// Handle admin form submission
document.getElementById('admin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        await adminAuth.login(email, password);
        hideAdminModal();
        
        // Update UI to show admin status
        document.getElementById('admin-status').classList.remove('hidden');
        document.getElementById('admin-login-btn').classList.add('hidden');
    } catch (error) {
        alert(error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}); 