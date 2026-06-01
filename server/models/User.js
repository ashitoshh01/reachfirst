const db = require('../config/database');

const User = {
    async create(userData) {
        const { email, password_hash, name, role, division, college_year } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, name, role, division, college_year) VALUES (?, ?, ?, ?, ?, ?)',
            [email, password_hash, name, role, division, college_year]
        );
        return result.insertId;
    },

    async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT id, email, name, role, division, college_year, is_cr, avatar_url, bio, is_online, last_seen, created_at FROM users WHERE id = ?', [id]);
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

    async deleteById(id) {
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
    },

    async findByRole(role) {
        const [rows] = await db.execute(
            'SELECT id, email, name, role, division, college_year, is_cr, avatar_url, bio, is_online, last_seen FROM users WHERE role = ?',
            [role]
        );
        return rows;
    },

    async setOnlineStatus(userId, isOnline) {
        await db.execute(
            'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [isOnline, userId]
        );
    },

    async search(query, limit = 50) {
        const queryStr = String(query).trim();
        const safeLimit = parseInt(limit, 10) || 50;
        const [rows] = await db.execute(
            `SELECT id, email, name, role, division, college_year, avatar_url, is_online 
             FROM users 
             WHERE (email LIKE ? OR name LIKE ?) 
             ORDER BY name ASC 
             LIMIT ${safeLimit}`,
            [`${queryStr}%`, `${queryStr}%`]
        );
        return rows;
    }
};

module.exports = User;
