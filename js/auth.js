// Firebase Authentication for PPPL Email Signature Generator
// Restricts access to @pppl.gov email addresses only

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcMWqkWygWFQFBxR3KGnLm2M8bqmrGIvo",
    authDomain: "pppl-75-anni-email-sig.firebaseapp.com",
    projectId: "pppl-75-anni-email-sig",
    storageBucket: "pppl-75-anni-email-sig.firebasestorage.app",
    messagingSenderId: "583804198362",
    appId: "1:583804198362:web:7b1c6c12cf3f3e4062b4e3",
    measurementId: "G-RNEFPTYJ81"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Allowed email domain
const ALLOWED_DOMAIN = 'pppl.gov';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const googleSignInBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userEmailSpan = document.getElementById('user-email');
const loginError = document.getElementById('login-error');

// Check if email is from allowed domain
function isAllowedEmail(email) {
    if (!email) return false;
    const domain = email.split('@')[1];
    return domain === ALLOWED_DOMAIN;
}

// Show login screen
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    appContent.style.display = 'none';
}

// Show app content and populate form fields
function showAppContent(user) {
    loginScreen.style.display = 'none';
    appContent.style.display = 'block';
    userEmailSpan.textContent = user.email;

    // Auto-populate form fields from Google profile
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');

    if (nameField && user.displayName) {
        nameField.value = user.displayName;
    }

    if (emailField && user.email) {
        emailField.value = user.email;
    }

    // Trigger preview update if the function exists
    if (typeof updatePreview === 'function') {
        updatePreview();
    }
}

// Handle sign in
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    // Restrict to Google Workspace domain
    provider.setCustomParameters({
        hd: ALLOWED_DOMAIN
    });

    try {
        loginError.textContent = '';
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Double-check the email domain (security measure)
        if (!isAllowedEmail(user.email)) {
            await auth.signOut();
            loginError.textContent = 'Access restricted to @pppl.gov email addresses only.';
            return;
        }

        showAppContent(user);
    } catch (error) {
        console.error('Sign-in error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            loginError.textContent = 'Sign-in was cancelled.';
        } else if (error.code === 'auth/unauthorized-domain') {
            loginError.textContent = 'This domain is not authorized. Please contact the administrator.';
        } else {
            loginError.textContent = 'Sign-in failed. Please try again.';
        }
    }
}

// Handle sign out
async function signOut() {
    try {
        await auth.signOut();
        showLoginScreen();
    } catch (error) {
        console.error('Sign-out error:', error);
    }
}

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user && isAllowedEmail(user.email)) {
        showAppContent(user);
    } else {
        if (user) {
            // User is signed in but not from allowed domain
            auth.signOut();
            loginError.textContent = 'Access restricted to @pppl.gov email addresses only.';
        }
        showLoginScreen();
    }
});

// Event listeners
googleSignInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOut);
