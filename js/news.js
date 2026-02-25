// Eduyogi - News & Admin Panel Logic (Phase 3C - Updated for Categories)
import { auth, db } from './firebase-config.js';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const newsFeed = document.getElementById('newsFeed');
const newsSkeleton = document.getElementById('newsSkeleton');
const adminPanel = document.getElementById('adminPanel');
const newsForm = document.getElementById('newsForm');
const publishBtn = document.getElementById('publishBtn');
const tabButtons = document.querySelectorAll('.tab-btn');

let currentRole = null;
let currentCategory = 'all';
let unsubscribe = null;

// 1. News Rendering Logic
function renderNewsItem(id, data, isAdmin) {
    const article = document.createElement('article');
    article.className = 'glass-card news-card fade-in visible';

    const imageUrl = data.imageUrl || 'https://images.unsplash.com/photo-1504711432869-efd597cdd0dc?auto=format&fit=crop&q=80&w=800';

    // Nice category tag
    const categoryLabels = {
        'engineering': 'Engineering News',
        'doctor': 'Doctor News',
        'other': 'General News'
    };
    const categoryLabel = categoryLabels[data.category] || 'News';

    article.innerHTML = `
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.title}" class="news-image">` : ''}
        <div class="news-content">
            <div class="news-meta">
                <span class="news-tag">${categoryLabel}</span>
                <span class="news-date">${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now'}</span>
                ${isAdmin ? `<button class="btn-delete" data-id="${id}" title="Delete Post">🗑️</button>` : ''}
            </div>
            <h3>${data.title}</h3>
            <p>${data.content}</p>
        </div>
    `;

    if (isAdmin) {
        article.querySelector('.btn-delete').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this news post?')) {
                try {
                    await deleteDoc(doc(db, "news", id));
                } catch (error) {
                    console.error("Delete Error:", error);
                    alert("Failed to delete post.");
                }
            }
        });
    }

    return article;
}

// 2. Real-time News Listener
const initNewsFeed = (isAdmin, category = 'all') => {
    // Unsubscribe from previous listener if active
    if (unsubscribe) unsubscribe();

    // Fetch ALL news and filter on client to avoid composite index requirements
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    unsubscribe = onSnapshot(q, (snapshot) => {
        if (newsSkeleton) newsSkeleton.style.display = 'none';
        newsFeed.innerHTML = '';

        const docs = snapshot.docs;
        const filteredDocs = category === 'all'
            ? docs
            : docs.filter(d => d.data().category === category);

        if (filteredDocs.length === 0) {
            newsFeed.innerHTML = `<div class="empty-state">No news articles in this category yet. Check back later!</div>`;
            return;
        }

        filteredDocs.forEach((doc) => {
            newsFeed.appendChild(renderNewsItem(doc.id, doc.data(), isAdmin));
        });
    }, (error) => {
        console.error("Firestore Listener Error:", error);
        if (newsFeed) newsFeed.innerHTML = '<div class="error-message">Failed to load news. Check console for details.</div>';
    });
};

// 3. Tab Interaction
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        initNewsFeed(currentRole === 'admin', currentCategory);
    });
});

// 4. Admin Publishing Logic
newsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const category = document.getElementById('newsCategory').value;
    const imageUrl = document.getElementById('newsImage').value.trim();

    if (!title || !content) return;

    try {
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = 'Publishing...';
        }

        await addDoc(collection(db, "news"), {
            title,
            content,
            category,
            imageUrl: imageUrl || null,
            createdAt: serverTimestamp(),
            authorId: auth.currentUser?.uid || 'anonymous'
        });

        newsForm.reset();
        alert("News published successfully! 🚀");

    } catch (error) {
        console.error("Publish Error:", error);
        alert("Failed to publish.");
    } finally {
        if (publishBtn) {
            publishBtn.disabled = false;
            publishBtn.textContent = '🚀 Publish';
        }
    }
});

// 5. Auth Integration
document.addEventListener('eduyogi-auth', (e) => {
    const { role } = e.detail;
    currentRole = role;

    if (adminPanel) {
        adminPanel.style.display = (role === 'admin') ? 'block' : 'none';
    }

    initNewsFeed(role === 'admin', currentCategory);
});

// Initial load
if (!auth.currentUser) {
    initNewsFeed(false, currentCategory);
}
