const db = require('../config/database');

const User = {
    async create(userData) {
        const { email, password_hash, name, role } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
            [email, password_hash, name, role]
        );
        return result.insertId;
    },

    async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT id, email, name, role, is_cr, avatar_url, is_online, last_seen, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    async updateById(id, updates) {
        const fields = [];
        const values = [];

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = ?`);
            values.push(value);
        });

        values.push(id);

        await db.execute(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
    },

    async findByRole(role) {
        const [rows] = await db.execute(
            'SELECT id, email, name, role, is_cr, avatar_url, is_online, last_seen FROM users WHERE role = ?',
            [role]
        );
        return rows;
    },

    async setOnlineStatus(userId, isOnline) {
        await db.execute(
            'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [isOnline, userId]
        );
    }
};

module.exports = User;
