require('dotenv').config();
const db = require('./src/config/database');

async function testMessagesTable() {
    try {
        console.log('Testing messages table...');
        const [rows] = await db.execute('DESCRIBE messages');
        console.log('Table structure:', rows.map(r => r.Field).join(', '));

        console.log('Trying to select...');
        const [msgs] = await db.execute('SELECT * FROM messages LIMIT 1');
        console.log('Select successful. Count:', msgs.length);

        console.log('Trying with JOIN query from Message.js...');
        const chatId = 1;
        const limit = 50;
        const offset = 0;
        // Replicating Message.js query exactly
        const [results] = await db.execute(`
            SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.chat_id = ?
            ORDER BY m.created_at ASC
            LIMIT ? OFFSET ?
        `, [chatId, limit, offset]); // Pass as numbers

        console.log('Join query successful. Results:', results.length);
        process.exit(0);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testMessagesTable();
