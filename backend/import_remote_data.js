const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');


const TABLES = [
    'users',
    'groups',
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

async function importData() {
    console.log('🚀 Starting data import to REMOTE database...');
    console.log(`Target Host: ${process.env.DB_HOST}`);

    if (process.env.DB_HOST === 'localhost') {
        console.warn('⚠️  WARNING: You are importing into LOCALHOST. Are you sure? (Waiting 2s)');
        await new Promise(r => setTimeout(r, 2000));
    }

    const connectionConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined
    };

    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to server successfully (no database selected).');
    } catch (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n❌ AUTHENTICATION FAILED:');
            console.error('   - Check your Username and Password.');
            console.error('   - CHECK YOUR IP ALLOWLIST: Your IP ' + (err.message.match(/@'([^']+)'/) ? err.message.match(/@'([^']+)'/)[1] : 'unknown') + ' might be blocked.');
        }
        throw err;
    }

    const dbName = process.env.DB_NAME || 'academic_messaging';
    console.log(`Checking database '${dbName}'...`);

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'.`);

    // Fix schema mismatches: Add 'bio' column if missing
    try {
        await connection.query("ALTER TABLE users ADD COLUMN bio TEXT");
        console.log('✅ Added missing column: bio');
    } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  (Bio column check passed or harmless error)');
        }
    }

    try {
        const dumpPath = path.join(__dirname, 'data_dump.json');
        if (!fs.existsSync(dumpPath)) {
            throw new Error('data_dump.json not found! Run export_local_data.js first.');
        }

        const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

        // Disable foreign key checks to prevent ordering issues during bulk insert
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TABLES) {
            const rows = data[table];
            if (!rows || rows.length === 0) {
                console.log(`Skipping empty table: ${table}`);
                continue;
            }

            console.log(`Importing ${rows.length} records into \`${table}\`...`);

            // Get columns from the first row
            const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');

            for (const row of rows) {
                const values = Object.values(row);
                // Create placeholders (?, ?, ?)
                const placeholders = values.map(() => '?').join(', ');

                const sql = `INSERT IGNORE INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
                await connection.query(sql, values);
            }
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n✅ Data import completed successfully!');

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await connection.end();
    }
}

importData();
