const db = require('../server/config/database');

async function cleanup() {
    try {
        console.log('Connecting to database to clear teacher accounts...');
        
        // Find users with non-numeric email prefixes (like csea1@despu.edu.in)
        // ^[0-9]+@ matches numeric-only prefixes. We want to delete those that do not match it.
        const [users] = await db.execute("SELECT id, email FROM users WHERE email NOT REGEXP '^[0-9]+@' AND email LIKE '%@despu.edu.in'");
        
        console.log(`Found ${users.length} incorrectly registered teacher accounts to delete.`);
        
        if (users.length > 0) {
            const ids = users.map(u => u.id);
            // Delete them in batches or via IN clause
            const [result] = await db.execute("DELETE FROM users WHERE email NOT REGEXP '^[0-9]+@' AND email LIKE '%@despu.edu.in'");
            console.log(`Successfully deleted ${result.affectedRows} accounts.`);
        } else {
            console.log('No teacher accounts found to delete.');
        }

    } catch (err) {
        console.error('Error during cleanup:', err.message);
    } finally {
        process.exit(0);
    }
}

cleanup();
