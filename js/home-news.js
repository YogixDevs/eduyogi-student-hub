import { db } from './firebase-config.js';
import { collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const homeNewsContainer = document.getElementById('homeNewsContainer');
    if (!homeNewsContainer) return;

    fetchCategorizedNews(homeNewsContainer);
});

async function fetchCategorizedNews(container) {
    const categories = ['engineering', 'doctor', 'other'];
    const newsItems = [];

    try {
        // Fetch the most recent 100 news items once to avoid multiple queries and index requirements
        const q = query(
            collection(db, "news"),
            orderBy("createdAt", "desc"),
            limit(100)
        );

        const querySnapshot = await getDocs(q);
        const allDocs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Pick the latest one for each category
        for (const cat of categories) {
            const latestForCat = allDocs.find(item => item.category === cat);
            if (latestForCat) {
                newsItems.push(latestForCat);
            }
        }

        renderHomeNews(container, newsItems);
    } catch (error) {
        console.error("Error fetching homepage news:", error);
        container.innerHTML = '<p class="error-text">Failed to load latest news. Check console for details.</p>';
    }
}

function renderHomeNews(container, items) {
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-text">No recent updates available.</p>';
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'home-news-card fade-in visible';

        const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800';
        const categoryLabel = getCategoryLabel(item.category);

        card.innerHTML = `
            <div class="news-card-image">
                <img src="${imageUrl}" alt="${item.title}">
                <span class="news-category-tag">${categoryLabel}</span>
            </div>
            <div class="news-card-body">
                <h3>${item.title}</h3>
                <a href="news.html" class="read-more">View Post →</a>
            </div>
        `;
        container.appendChild(card);
    });

    // Ensure the container itself is visible if it has the fade-in class
    container.classList.add('visible');
}

function getCategoryLabel(cat) {
    const labels = {
        'engineering': 'Engineering',
        'doctor': 'Medical',
        'other': 'General'
    };
    return labels[cat] || 'News';
}

function truncateText(text, limit) {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
}
