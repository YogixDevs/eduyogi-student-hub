// Eduyogi - Production Configuration
const CONFIG = {
    // API_URL: Automatically detects if running locally or in production
    API_BASE_URL: (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.')
    ) ? 'http://localhost:3000' : window.location.origin,

    VERSION: '1.2.0',
    ENV: window.location.hostname === 'localhost' ? 'development' : 'production'
};

export default CONFIG;
