const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'full-test.log');
const logStream = fs.createWriteStream(logFile);

console.log('--- 🧪 Eduyogi Full Stack Diagnostic ---');
logStream.write('--- 🧪 Eduyogi Full Stack Diagnostic ---\n');

// 1. Start Server
const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env }
});

server.stdout.on('data', (data) => {
    const msg = `[SERVER]: ${data}`;
    process.stdout.write(msg);
    logStream.write(msg);
});

server.stderr.on('data', (data) => {
    const msg = `[SERVER-ERROR]: ${data}`;
    process.stderr.write(msg);
    logStream.write(msg);
});

// 2. Wait and Run Test
setTimeout(async () => {
    console.log('\n📡 Running Verification Test...');
    logStream.write('\n📡 Running Verification Test...\n');

    try {
        const chatRes = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello Eduyogi! Give me a 1-sentence career tip.',
                history: []
            })
        });

        const chatData = await chatRes.json();
        const resMsg = `\n[TEST-RESULT]: Status ${chatRes.status}, Body: ${JSON.stringify(chatData)}\n`;
        process.stdout.write(resMsg);
        logStream.write(resMsg);

    } catch (e) {
        const errMsg = `\n[TEST-ERROR]: ${e.message}\n`;
        process.stderr.write(errMsg);
        logStream.write(errMsg);
    }

    // 3. Cleanup
    console.log('\n🛑 Shutdown Diagnostic...');
    logStream.write('\n🛑 Shutdown Diagnostic...\n');
    server.kill();
    setTimeout(() => process.exit(), 1000);

}, 5000);
