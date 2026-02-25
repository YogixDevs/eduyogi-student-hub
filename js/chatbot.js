// Eduyogi support - Frontend Logic (Phase 3B - Secure Integration)
import CONFIG from './config.js';
const API_URL = `${CONFIG.API_BASE_URL}/api/chat`;

// State (Local memory only, no Firestore persistence)
let conversationHistory = [];
let isWaiting = false;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const quickPrompts = document.getElementById('quickPrompts');

// 1. UI Helpers
const scrollToBottom = () => {
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Auto-resize textarea
chatInput?.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Send on Enter (Shift+Enter for new line)
chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chatSendBtn?.addEventListener('click', sendMessage);

// Quick prompts listener
document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        if (chatInput) {
            chatInput.value = prompt;
            sendMessage();
        }
    });
});

// 2. Main Message Handler
// 2. Main Message Handler (Streaming Update)
async function sendMessage() {
    const rawMessage = chatInput?.value?.trim();
    if (!rawMessage || isWaiting) return;

    // Frontend Sanitization
    const sanitizedMessage = rawMessage.replace(/<[^>]*>/g, '').substring(0, 500);

    // Update UI for Sent Message
    if (quickPrompts) quickPrompts.style.display = 'none';
    addMessage('user', sanitizedMessage);
    conversationHistory.push({ role: 'user', content: sanitizedMessage });

    // Clear and Reset Input
    if (chatInput) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
    }

    // Loading State
    isWaiting = true;
    if (chatSendBtn) chatSendBtn.disabled = true;
    showTypingIndicator();

    // Create container for support response
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🎓';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);

    let fullReply = '';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: sanitizedMessage,
                history: conversationHistory.slice(-10)
            })
        });

        removeTypingIndicator();

        if (!response.ok) {
            const errorData = await response.json();
            addMessage('ai', `⚠️ ${errorData.error || "The support service is a bit busy. Please try again later."}`);
            return;
        }

        // Handle Stream
        chatMessages?.appendChild(msgDiv);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullReply += chunk;

            // Format and update content incrementally
            contentDiv.innerHTML = formatMessage(fullReply);
            scrollToBottom();
        }

        conversationHistory.push({ role: 'model', content: fullReply });

    } catch (error) {
        removeTypingIndicator();
        console.error("Chatbot Stream Error:", error);
        addMessage('ai', "📡 **Connection Error.** Please ensure the backend is running and try again.");
    } finally {
        isWaiting = false;
        if (chatSendBtn) chatSendBtn.disabled = false;
        chatInput?.focus();
        scrollToBottom();
    }
}

// 3. UI Template Functions
function addMessage(type, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'ai' ? '🎓' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessage(content);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatMessages?.appendChild(msgDiv);
    scrollToBottom();
}

function formatMessage(text) {
    // Basic Markdown Parser (Production Ready)
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gm, '<h3 style="margin-bottom: 0.5rem; color: var(--accent-primary);">$1</h3>')
        .replace(/^[-•] (.*$)/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap list items
    html = html.replace(/(<li.*?>.*?<\/li>)+/gs, (match) => `<ul style="margin-bottom: 1rem;">${match}</ul>`);

    return `<div class="msg-text">${html}</div>`;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="message-avatar">🎓</div>
        <div class="typing-bubble">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    chatMessages?.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}
