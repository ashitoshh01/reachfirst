require('dotenv').config();
const db = require('./src/config/database');

async function addBioColumn() {
    try {
        console.log('Adding bio column to users table...');

        try {
            await db.execute('ALTER TABLE users ADD COLUMN bio TEXT');
            console.log('✓ Bio column added successfully');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ Bio column already exists');
            } else {
                throw err;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Failed to update schema:', error);
        process.exit(1);
    }
}

addBioColumn();
