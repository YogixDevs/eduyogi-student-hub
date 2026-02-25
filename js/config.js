// Eduyogi - Production Configuration
const CONFIG = {
    // API_URL: Automatically detects if running locally or in production
    API_BASE_URL: (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') || // Local network
        window.location.hostname.startsWith('10.') // Private network
    ) ? 'http://localhost:3000' : 'https://eduyogi-backend.onrender.com',

    VERSION: '1.2.0',
    ENV: window.location.hostname === 'localhost' ? 'development' : 'production'
};

export default CONFIG;
