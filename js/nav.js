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
    const authSignupFields = document.getElementById('authSignupFields');

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
        if (authSignupFields) authSignupFields.style.display = isSignUp ? 'block' : 'none';
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

    // Use event delegation for buttons that might exist in both desktop and mobile menus
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnSignin') || e.target.closest('#linkLogin') || e.target.closest('.btn-login') || e.target.closest('.btn-signin')) {
            if (e.target.tagName === 'A' || e.target.closest('a')) e.preventDefault();
            openModal();
        }
    });

    modalClose?.addEventListener('click', closeModal);
    authToggleLink?.addEventListener('click', toggleMode);
    authOverlay?.addEventListener('click', (e) => { if (e.target === authOverlay) closeModal(); });

    // === Mobile Auth Integration ===
    const setupMobileNav = () => {
        const navAuth = document.querySelector('.nav-auth');
        if (navAuth && navLinks && !navLinks.querySelector('.nav-auth-mobile')) {
            const mobileAuth = navAuth.cloneNode(true);
            mobileAuth.classList.remove('nav-auth');
            mobileAuth.classList.add('nav-auth-mobile');

            // Ensure buttons have the right classes for mobile styling
            const mobileLogin = mobileAuth.querySelector('#linkLogin');
            const mobileSignin = mobileAuth.querySelector('#btnSignin');
            if (mobileLogin) mobileLogin.className = 'btn-login';
            if (mobileSignin) mobileSignin.className = 'btn-signin';

            navLinks.appendChild(mobileAuth);
        }
    };
    setupMobileNav();

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

                // Collect additional fields for new users
                const studying = document.getElementById('authStudying')?.value?.trim();
                const subjects = document.getElementById('authSubjects')?.value?.trim();
                const district = document.getElementById('authDistrict')?.value?.trim();
                const city = document.getElementById('authCity')?.value?.trim();
                const pincode = document.getElementById('authPincode')?.value?.trim();

                const userDocRef = doc(db, "users", userCredential.user.uid);
                const isAdmin = email === 'eduyogiiiii@gmail.com';

                const userData = {
                    name: name || 'Eduyogi Student',
                    email: email,
                    role: isAdmin ? 'admin' : 'user',
                    studying: studying || '',
                    subjects: subjects || '',
                    district: district || '',
                    city: city || '',
                    pincode: pincode || '',
                    createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, userData);
                console.log(`🆕 New ${userData.role.toUpperCase()} Profile Created with expanded metadata`);
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

    // 3. Logout (Unified Event Delegation)
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#btnLogout') || e.target.closest('.btn-logout')) {
            try {
                await signOut(auth);
                userDropdown?.classList.remove('open');
                // Ensure mobile menu closes on logout
                if (navLinks?.classList.contains('open')) {
                    navLinks.classList.remove('open');
                    if (navToggle) navToggle.textContent = '☰';
                }
            } catch (error) {
                console.error("Logout Error:", error);
            }
        }
    });

    // Close mobile menu when a link is clicked
    navLinks?.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navLinks.classList.remove('open');
            if (navToggle) navToggle.textContent = '☰';
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
        const signinBtns = document.querySelectorAll('#btnSignin, .btn-signin');
        const loginLinks = document.querySelectorAll('#linkLogin, .btn-login');
        const userProfiles = document.querySelectorAll('.user-profile');
        const userAvatars = document.querySelectorAll('.user-avatar');
        const userNames = document.querySelectorAll('#dropdownUserName, .user-name');
        const userEmails = document.querySelectorAll('#dropdownUserEmail, .user-email');
        const adminElements = document.querySelectorAll('.admin-only');

        if (user) {
            console.log("👤 User Authenticated:", user.email);

            // UI Update
            signinBtns.forEach(btn => btn.style.display = 'none');
            loginLinks.forEach(link => link.style.display = 'none');
            userProfiles.forEach(p => p.classList.add('show'));

            const initials = (user.displayName || user.email || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            userAvatars.forEach(av => av.textContent = initials);
            userNames.forEach(name => name.textContent = user.displayName || 'Eduyogi Student');
            userEmails.forEach(email => email.textContent = user.email);

            // Firestore Profile Management
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);

                let userData;
                if (!userSnap.exists()) {
                    // Profile creation for Google Sign-in or cases where setDoc failed in submit
                    const isAdmin = user.email === 'eduyogiiiii@gmail.com';
                    userData = {
                        name: user.displayName || 'Eduyogi Student',
                        email: user.email,
                        role: isAdmin ? 'admin' : 'user',
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userDocRef, userData);
                } else {
                    userData = userSnap.data();
                }

                // Admin UI Gating
                adminElements.forEach(el => {
                    el.style.display = userData.role === 'admin' ? '' : 'none';
                    if (el.id === 'btnAdminDashboard' || el.classList.contains('btn-admin')) {
                        el.onclick = () => window.location.href = 'admin.html';
                    }
                });

                document.dispatchEvent(new CustomEvent('eduyogi-auth', {
                    detail: { user, role: userData.role }
                }));

            } catch (err) {
                console.error("Firestore Profile Error:", err);
            }
        } else {
            console.log("🚪 User Signed Out");
            signinBtns.forEach(btn => btn.style.display = '');
            loginLinks.forEach(link => link.style.display = '');
            userProfiles.forEach(p => p.classList.remove('show'));
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
