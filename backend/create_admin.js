require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'despu@despu.edu.in';
        const password = 'dddddddd';
        const name = 'DESPU';
        const role = 'admin'; // Ensuring role is 'admin'

        console.log(`Setting up admin user: ${email}`);

        // 1. Check if user already exists
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        // 2. Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        if (existing.length > 0) {
            console.log('User already exists. Updating credentials and role...');
            await db.execute(
                'UPDATE users SET password_hash = ?, role = ?, name = ? WHERE email = ?',
                [password_hash, role, name, email]
            );
            console.log('Admin user updated successfully.');
        } else {
            console.log('Creating new admin user...');
            await db.execute(
                'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
                [email, password_hash, name, role]
            );
            console.log('Admin user created successfully.');
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
