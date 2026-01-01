const db = require('../config/database');

const Class = {
    async create(classData) {
        const { name, description, created_by } = classData;
        const [result] = await db.execute(
            'INSERT INTO classes (name, description, created_by) VALUES (?, ?, ?)',
            [name, description, created_by]
        );
        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM classes WHERE id = ?', [id]);
        return rows[0];
    },

    async getAll() {
        const [rows] = await db.execute('SELECT * FROM classes ORDER BY name');
        return rows;
    },

    async assignCR(classId, userId) {
        await db.execute(
            'INSERT INTO class_cr_mapping (class_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
            [classId, userId]
        );

        // Set user as CR
        await db.execute('UPDATE users SET is_cr = TRUE WHERE id = ?', [userId]);
    },

    async removeCR(classId, userId) {
        await db.execute(
            'DELETE FROM class_cr_mapping WHERE class_id = ? AND user_id = ?',
            [classId, userId]
        );

        // Check if user is CR for any other class
        const [remaining] = await db.execute(
            'SELECT 1 FROM class_cr_mapping WHERE user_id = ?',
            [userId]
        );

        // If not CR for any class, remove CR flag
        if (remaining.length === 0) {
            await db.execute('UPDATE users SET is_cr = FALSE WHERE id = ?', [userId]);
        }
    },

    async getCRs(classId) {
        const [crs] = await db.execute(`
      SELECT u.id, u.name, u.email, u.avatar_url
      FROM users u
      JOIN class_cr_mapping ccm ON u.id = ccm.user_id
      WHERE ccm.class_id = ?
    `, [classId]);

        return crs;
    },

    async getAllCRs(classIds) {
        if (!classIds || classIds.length === 0) return [];

        const placeholders = classIds.map(() => '?').join(',');
        const [crs] = await db.execute(`
      SELECT DISTINCT u.id, u.name, u.email, u.avatar_url
      FROM users u
      JOIN class_cr_mapping ccm ON u.id = ccm.user_id
      WHERE ccm.class_id IN (${placeholders})
    `, classIds);

        return crs;
    }
};

module.exports = Class;
