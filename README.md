# 🎓 Eduyogi — Smart Career Guidance Platform

AI-powered career counseling for PUC, 11th & 12th students. Discover your dream career, find the best colleges, and get personalized guidance.

## 📁 Project Structure

```
eduyogi/
├── index.html          → Home page
├── chatbot.html        → Eduyogi support
├── news.html           → Latest News (admin can publish)
├── css/                → Stylesheets
├── js/                 → Frontend logic
└── server/             → Node.js backend (Support proxy)
```

## 🚀 Quick Setup

### 1. Backend Server

```bash
cd server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm install
npm start
```

Get a free Gemini API key: [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Add a Web App
3. Copy the config into `js/firebase-config.js`
4. Enable **Authentication** → Email/Password + Google
5. Enable **Firestore Database** → Start in test mode

### 3. Admin Access

Edit `js/firebase-config.js` and add your email to `ADMIN_EMAILS`:
```js
const ADMIN_EMAILS = ['your-email@gmail.com'];
```

### 4. Open Website

Open `index.html` in your browser (or use Live Server in VS Code).

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Backend | Node.js + Express |
| AI | Google Gemini 2.0 Flash |
| Database | Firebase Firestore |
| Auth | Firebase Auth |

## 📄 Pages

- **Home** — About Eduyogi, mentors, features
- **Eduyogi support** — Chat with support for career guidance
- **Latest News** — Admin publishes education news

---

Made with ❤️ for Indian Students
