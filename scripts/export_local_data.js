const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');


const TABLES = [
    'users',
    'groups', // Order matters due to foreign keys
    'classes',
    'chats',
    'group_members',
    'messages',
    'message_status',
    'class_cr_mapping',
    'automation_config',
    'automation_target_classes',
    'automation_keywords'
];

async function exportData() {
    console.log('📦 Starting data export from LOCAL database...');

    // Force local connection settings for export
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'academic_messaging',
        port: process.env.DB_PORT || 3306
    });

    try {
        const data = {};

        for (const table of TABLES) {
            console.log(`Reading table: ${table}...`);
            const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
            data[table] = rows;
            console.log(`  - Found ${rows.length} records.`);
        }

        const outputPath = path.join(__dirname, 'data_dump.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`\n✅ Data exported successfully to: ${outputPath}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await connection.end();
    }
}

exportData();
