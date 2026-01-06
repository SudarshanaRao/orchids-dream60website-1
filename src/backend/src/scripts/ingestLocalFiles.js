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

const { connectDB } = require('../config/db');
const SupportChatKnowledgeChunk = require('../models/SupportChatKnowledgeChunk');
const { chunkText, normalizeText } = require('../utils/supportChatAi');

const FILES_TO_INGEST = [
    { name: 'Rules', path: 'src/components/Rules.tsx', url: 'https://test.dream60.com/rules' },
    { name: 'Participation', path: 'src/components/Participation.tsx', url: 'https://test.dream60.com/participation' },
    { name: 'Terms', path: 'src/components/TermsAndConditions.tsx', url: 'https://test.dream60.com/terms' },
    { name: 'Privacy', path: 'src/components/PrivacyPolicy.tsx', url: 'https://test.dream60.com/privacy' },
    { name: 'Support', path: 'src/components/Support.tsx', url: 'https://test.dream60.com/support' },
    { name: 'WinningTips', path: 'src/components/WinningTips.tsx', url: 'https://test.dream60.com/winning-tips' },
    { name: 'ViewGuide', path: 'src/components/ViewGuide.tsx', url: 'https://test.dream60.com/view-guide' },
    { name: 'Contact', path: 'src/components/Contact.tsx', url: 'https://test.dream60.com/contact' },
    { name: 'Home', path: 'src/pages/Home.tsx', url: 'https://test.dream60.com/' },
];

const cleanTsx = (content) => {
    // Remove imports
    let text = content.replace(/import[\s\S]*?;/g, '');
    // Remove exports
    text = text.replace(/export\s+default\s+function\s+\w+/g, '');
    text = text.replace(/export\s+function\s+\w+/g, '');
    // Remove JSX tags but keep content
    text = text.replace(/<[^>]+>/g, ' ');
    // Remove curly braces content (props, etc)
    text = text.replace(/\{[^}]+\}/g, ' ');
    return normalizeText(text);
};

const main = async () => {
    await connectDB();
    await SupportChatKnowledgeChunk.syncIndexes();

    console.log(`🔎 Ingesting ${FILES_TO_INGEST.length} local files into SupportChatKnowledgeChunk...`);
    
    // Clear existing chunks to avoid duplication
    await SupportChatKnowledgeChunk.deleteMany({});

    for (const fileInfo of FILES_TO_INGEST) {
        const fullPath = path.resolve(__dirname, '../../../../', fileInfo.path);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${fullPath}`);
            continue;
        }

        console.log(`➡️  Processing ${fileInfo.name} (${fileInfo.path})`);
        const rawContent = fs.readFileSync(fullPath, 'utf8');
        const text = cleanTsx(rawContent);
        const chunks = chunkText(text);

        const docs = chunks.map((content, idx) => ({
            sourceUrl: fileInfo.url,
            chunkIndex: idx,
            content: `Content from ${fileInfo.name} page:\n${content}`,
        }));

        if (docs.length > 0) {
            await SupportChatKnowledgeChunk.insertMany(docs, { ordered: false });
            console.log(`✅ Stored ${docs.length} chunks for ${fileInfo.name}`);
        } else {
            console.warn(`⚠️ No content extracted from ${fileInfo.name}`);
        }
    }

    console.log('✅ Local ingestion complete.');
    process.exit(0);
};

main().catch((err) => {
    console.error('❌ Local ingestion failed:', err);
    process.exit(1);
});
