const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Security Middleware
// Security Middleware (Configured to allow necessary scripts and eval)
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com", "https://cdn.jsdelivr.net", "https://*.googleapis.com"],
            "connect-src": ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebase.com"],
            "img-src": ["'self'", "data:", "https://*.googleusercontent.com"],
            "frame-src": ["'self'", "https://*.firebaseapp.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));

app.use(cors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are Eduyogi Support, a professional career counselor for Indian students. Help them with streams, careers, and colleges. Keep your responses concise, helpful, and direct. Do not refer to yourself as an AI or a robot."
});

// Chat Route (Streaming)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessageStream(message);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();
    } catch (error) {
        console.error('❌ Gemini Streaming Error:', error.message || error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get streaming response'
            });
        } else {
            res.end();
        }
    }
});

app.get('/api/health', (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

module.exports = app;
