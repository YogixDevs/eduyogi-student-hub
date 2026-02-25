// Eduyogi - Navigation & Identity Layer (Phase 3A)
import { auth, db, googleProvider } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // === UI Elements ===
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const authOverlay = document.getElementById('authOverlay');
    const btnSignin = document.getElementById('btnSignin');
    const modalClose = document.getElementById('modalClose');
    const authForm = document.getElementById('authForm');
    const btnGoogle = document.getElementById('btnGoogle');
    const authToggleLink = document.getElementById('authToggleLink');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authNameGroup = document.getElementById('authNameGroup');
    const authToggleText = document.getElementById('authToggleText');
    const authError = document.getElementById('authError');
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    const btnLogout = document.getElementById('btnLogout');
    const adminLoginLink = document.getElementById('adminLoginLink');

    let isSignUp = false;

    // === Navigation UI Logic ===
    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
        });
    }

    // Active link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) link.classList.add('active');
    });

    // === Auth Modal Logic ===
    const openModal = () => authOverlay?.classList.add('open');
    const closeModal = () => {
        authOverlay?.classList.remove('open');
        if (authError) {
            authError.textContent = '';
            authError.classList.remove('show');
        }
    };

    const toggleMode = () => {
        isSignUp = !isSignUp;
        authTitle.textContent = isSignUp ? 'Create Account' : 'Welcome Back';
        authSubtitle.textContent = isSignUp ? 'Join Eduyogi and start your career journey' : 'Sign in to continue your journey';
        authSubmitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        authNameGroup.style.display = isSignUp ? 'block' : 'none';
        authToggleText.innerHTML = isSignUp
            ? 'Already have an account? <a id="authToggleLink">Sign In</a>'
            : 'Don\'t have an account? <a id="authToggleLink">Sign Up</a>';

        // Re-attach listener to the new link
        document.getElementById('authToggleLink').addEventListener('click', toggleMode);
    };

    adminLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    const linkLogin = document.getElementById('linkLogin');

    btnSignin?.addEventListener('click', openModal);
    linkLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    modalClose?.addEventListener('click', closeModal);
    authToggleLink?.addEventListener('click', toggleMode);
    authOverlay?.addEventListener('click', (e) => { if (e.target === authOverlay) closeModal(); });

    // === Firebase Auth Logic ===

    // 1. Email/Password Auth
    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authName')?.value?.trim();

        try {
            authError.classList.remove('show');
            authSubmitBtn.disabled = true;
            authSubmitBtn.textContent = 'Processing...';

            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            closeModal();
        } catch (error) {
            console.error("Auth Error:", error);
            authError.textContent = error.message.replace('Firebase: ', '');
            authError.classList.add('show');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        }
    });

    // 2. Google Sign-In
    btnGoogle?.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            closeModal();
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error("Google Auth Error:", error);
                authError.textContent = "Google sign-in failed. Please try again.";
                authError.classList.add('show');
            }
        }
    });

    // 3. Logout
    btnLogout?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            userDropdown?.classList.remove('open');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });

    // User Dropdown Toggle
    userAvatar?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('open');
    });
    document.addEventListener('click', () => userDropdown?.classList.remove('open'));

    // === Auth State & Profile Management ===
    onAuthStateChanged(auth, async (user) => {
        const signinBtn = document.getElementById('btnSignin');
        const userProfile = document.querySelector('.user-profile');
        const userAvatarEl = document.getElementById('userAvatar');
        const userNameEl = document.getElementById('dropdownUserName');
        const userEmailEl = document.getElementById('dropdownUserEmail');
        const adminElements = document.querySelectorAll('.admin-only');

        if (user) {
            console.log("👤 User Authenticated:", user.email);

            // UI Update
            if (signinBtn) signinBtn.style.display = 'none';
            if (linkLogin) linkLogin.style.display = 'none';
            if (userProfile) userProfile.classList.add('show');

            const initials = (user.displayName || user.email || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            if (userAvatarEl) userAvatarEl.textContent = initials;
            if (userNameEl) userNameEl.textContent = user.displayName || 'Eduyogi Student';
            if (userEmailEl) userEmailEl.textContent = user.email;

            // Firestore Profile Management
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);

                let userData;
                if (!userSnap.exists()) {
                    // Create profile if missing
                    // Auto-assign admin role for the provided admin email
                    const isAdmin = user.email === 'eduyogiiiii@gmail.com';

                    userData = {
                        name: user.displayName || 'Eduyogi Student',
                        email: user.email,
                        role: isAdmin ? 'admin' : 'user',
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userDocRef, userData);
                    console.log(`🆕 New ${userData.role.toUpperCase()} Profile Created in Firestore`);
                } else {
                    userData = userSnap.data();
                }

                console.log("🛡️ User Role:", userData.role);

                // Admin UI Gating
                const btnAdminDashboard = document.getElementById('btnAdminDashboard');
                if (btnAdminDashboard) {
                    btnAdminDashboard.style.display = userData.role === 'admin' ? '' : 'none';
                    btnAdminDashboard.onclick = () => window.location.href = 'admin.html';
                }

                adminElements.forEach(el => {
                    if (el.id !== 'btnAdminDashboard') {
                        el.style.display = userData.role === 'admin' ? '' : 'none';
                    }
                });

                // Dispatch global event for other modules
                document.dispatchEvent(new CustomEvent('eduyogi-auth', {
                    detail: { user, role: userData.role }
                }));

            } catch (err) {
                console.error("Firestore Profile Error:", err);
            }
        } else {
            console.log("🚪 User Signed Out");
            if (signinBtn) signinBtn.style.display = '';
            if (linkLogin) linkLogin.style.display = '';
            if (userProfile) userProfile.classList.remove('show');
            adminElements.forEach(el => el.style.display = 'none');

            document.dispatchEvent(new CustomEvent('eduyogi-auth', {
                detail: { user: null, role: null }
            }));
        }
    });

    // Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(el => observer.observe(el));
});
