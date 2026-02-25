const fs = require('fs');
const path = require('path');

console.log('--- SYSTEM INFO ---');
console.log('Platform:', process.platform);
console.log('Node Version:', process.version);
console.log('CWD:', process.cwd());

console.log('\n--- DIRECTORY LISTING (CWD) ---');
console.log(fs.readdirSync('.'));

console.log('\n--- SERVICES FOLDER ---');
try {
    console.log(fs.readdirSync('./services'));
} catch (e) {
    console.log('Error reading services:', e.message);
}

const target = './services/aiService.js';
console.log('\n--- TARGET CHECK ---');
console.log('Target:', target);
console.log('Resolved Absolute:', path.resolve(target));
console.log('File Exists?', fs.existsSync(target));

try {
    const mod = require(target);
    console.log('✅ Successfully required:', Object.keys(mod));
} catch (e) {
    console.log('❌ Require failed:', e.message);
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('Nested error:', e.stack);
    }
}
