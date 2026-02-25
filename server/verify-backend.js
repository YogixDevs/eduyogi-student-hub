async function verify() {
    console.log('--- 🧪 Eduyogi Manual Verification ---');

    try {
        console.log('1. Checking Health Endpoint...');
        const healthRes = await fetch('http://localhost:3000/api/health');
        const healthData = await healthRes.json();
        console.log('   Result:', JSON.stringify(healthData));

        console.log('\n2. Testing Chat API (OpenAI Integration)...');
        const chatRes = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello Eduyogi! Give me a 1-sentence career tip.',
                history: []
            })
        });

        const chatData = await chatRes.json();
        if (chatRes.ok && chatData.success) {
            console.log('   ✅ SUCCESS!');
            console.log('   🎓 AI Reply:', chatData.reply);
        } else {
            console.log('   ❌ FAILED!');
            console.log('   Error:', chatData.error);
        }

    } catch (e) {
        console.error('❌ Verification Error:', e.message);
    }
}

verify();
