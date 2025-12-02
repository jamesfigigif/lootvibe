const fetch = require('node-fetch');

async function testGenerateCode() {
    try {
        const response = await fetch('http://localhost:3001/api/affiliates/generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-1' })
        });

        const data = await response.json();
        console.log('Response:', response.status, data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testGenerateCode();
