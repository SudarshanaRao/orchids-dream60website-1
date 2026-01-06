const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

// Load .env
const loadEnv = () => {
    const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../../.env'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            dotenv.config({ path: p });
            break;
        }
    }
};
loadEnv();

const { generateAnswerFromContext } = require('../utils/supportChatAi');

const testAi = async () => {
    console.log('🧪 Testing AI generation...');
    console.log('Provider:', process.env.SUPPORT_CHAT_PROVIDER);
    
    const query = 'How do prize claims work?';
    const context = 'In Dream60, prize claims for Amazon vouchers are processed within 24 hours after an auction ends. Winners must provide their UPI ID and verify their details in the Prize Showcase section.';
    const conversation = [];

    try {
        const reply = await generateAnswerFromContext({ query, context, conversation });
        console.log('🤖 Bot Reply:', reply);
    } catch (err) {
        console.error('❌ AI Generation failed:', err.message);
    }
};

testAi();
