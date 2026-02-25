// Eduyogi Firebase Configuration (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyADhNguDbIHXjBD6VX2t8pNjpjLuUpAxAM",
    authDomain: "eduyogi-4947e.firebaseapp.com",
    projectId: "eduyogi-4947e",
    storageBucket: "eduyogi-4947e.firebasestorage.app",
    messagingSenderId: "355721878077",
    appId: "1:355721878077:web:2c4daed1b675d3286ee854",
    measurementId: "G-J2MEF3LS6V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

// Export for other scripts/modules
export { app, auth, db, analytics, googleProvider };

console.log("🔥 Eduyogi Firebase Initialized with Analytics");
