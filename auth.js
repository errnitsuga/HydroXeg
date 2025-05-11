// Authentication state observer
firebaseServices.auth.onAuthStateChanged((user) => {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (user) {
        // User is signed in
        authButtons.style.display = 'none';
        userProfile.style.display = 'block';
        document.getElementById('user-email').textContent = user.email;
    } else {
        // User is signed out
        authButtons.style.display = 'block';
        userProfile.style.display = 'none';
    }
});

// Sign up function
async function signUp(email, password) {
    try {
        const userCredential = await firebaseServices.auth.createUserWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign in function
async function signIn(email, password) {
    try {
        const userCredential = await firebaseServices.auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign out function
async function signOut() {
    try {
        await firebaseServices.auth.signOut();
    } catch (error) {
        throw error;
    }
}

// Password reset function
async function resetPassword(email) {
    try {
        await firebaseServices.auth.sendPasswordResetEmail(email);
    } catch (error) {
        throw error;
    }
}

// Export functions
window.authFunctions = {
    signUp,
    signIn,
    signOut,
    resetPassword
}; 