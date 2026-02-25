const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

let genAI;
let model;

const SYSTEM_PROMPT = `You are "Eduyogi AI", a professional and friendly career counselor for Indian students in PUC, 11th, and 12th standard.

Your expertise covers:
- Indian educational streams: Science (PCMB/PCMC), Commerce, Arts/Humanities.
- Career paths: Engineering (JEE), Medicine (NEET), CA/CS, Law (CLAT), Design (NID/UCEED), Pure Sciences, Fine Arts, and emerging fields like AI/Data Science.
- Top Indian institutions: IITs, NIITs, AIIMS, DU, NLUs, etc.
- Guidance on choosing the right stream after 10th and the right degree after 12th.

Constraints:
- ONLY provide career and educational guidance.
- If asked about unrelated topics (movies, politics, etc.), politely steer the conversation back to career guidance.
- Use a supportive, encouraging, and professional tone.
- Keep responses structured with clear sections or bullet points for readability.
- Be honest about the difficulty and competition in various fields in India.
- NEVER generate harmful, sexual, hateful, or dangerous content.

Goal: Help students discover their passions and make informed decisions about their future.`;

// Safety settings — block harmful content at lowest threshold
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

/**
 * Initializes the Gemini client.
 */
function initGemini() {
    if (model) return;

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ CRITICAL ERROR: GEMINI_API_KEY is missing in your .env file.');
        throw new Error('AI service configuration missing.');
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        safetySettings,
        systemInstruction: SYSTEM_PROMPT,
    });
}

/**
 * Generates a response from Google Gemini.
 * @param {string} message - The user's message.
 * @param {Array} history - The conversation history.
 * @returns {Promise<string>} - The AI's response.
 */
async function generateResponse(message, history = []) {
    try {
        initGemini();

        // Build chat history in Gemini format
        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;

        // Check if the response was blocked by safety filters
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            return "I'm sorry, but I can't respond to that type of message. Let's keep our conversation focused on career and educational guidance! 😊";
        }

        const text = response.text();

        if (!text) {
            return "I'm sorry, I couldn't generate a response. Could you please rephrase your question about career guidance?";
        }

        return text;
    } catch (error) {
        if (error.message === 'AI service configuration missing.') {
            throw error;
        }
        // Handle safety filter blocks that come as errors
        if (error.message && error.message.includes('SAFETY')) {
            return "I'm sorry, but I can't respond to that type of message. Let's keep our conversation focused on career and educational guidance! 😊";
        }
        console.error('❌ Gemini Error:', error.message);
        throw new Error('AI service error');
    }
}

module.exports = { generateResponse };
