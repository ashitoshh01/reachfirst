const db = require('../config/database');

const Automation = {
    async createConfig(teacherId) {
        const [result] = await db.execute(
            'INSERT INTO automation_config (teacher_id) VALUES (?)',
            [teacherId]
        );
        return result.insertId;
    },

    async getTeacherConfig(teacherId) {
        const [rows] = await db.execute(
            'SELECT * FROM automation_config WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 1',
            [teacherId]
        );
        return rows[0];
    },

    async approve(automationId, adminId) {
        await db.execute(
            'UPDATE automation_config SET is_approved = TRUE, approved_by = ? WHERE id = ?',
            [adminId, automationId]
        );
    },

    async setActive(automationId, isActive) {
        await db.execute(
            'UPDATE automation_config SET is_active = ? WHERE id = ?',
            [isActive, automationId]
        );
    },

    async setTargetClasses(automationId, classIds) {
        // Clear existing targets
        await db.execute(
            'DELETE FROM automation_target_classes WHERE automation_id = ?',
            [automationId]
        );

        // Add new targets
        if (classIds && classIds.length > 0) {
            const values = classIds.map(classId => [automationId, classId]);
            await db.query(
                'INSERT INTO automation_target_classes (automation_id, class_id) VALUES ?',
                [values]
            );
        }
    },

    async getTargetClasses(automationId) {
        const [rows] = await db.execute(
            'SELECT class_id FROM automation_target_classes WHERE automation_id = ?',
            [automationId]
        );
        return rows.map(row => row.class_id);
    },

    async getPendingApprovals() {
        const [rows] = await db.execute(`
      SELECT ac.*, u.name as teacher_name, u.email as teacher_email
      FROM automation_config ac
      JOIN users u ON ac.teacher_id = u.id
      WHERE ac.is_approved = FALSE
      ORDER BY ac.created_at DESC
    `);
        return rows;
    },

    async getKeywords() {
        const [rows] = await db.execute(
            'SELECT keyword FROM automation_keywords WHERE is_active = TRUE'
        );
        return rows.map(row => row.keyword);
    },

    async addKeyword(keyword) {
        await db.execute(
            'INSERT INTO automation_keywords (keyword) VALUES (?)',
            [keyword]
        );
    }
};

module.exports = Automation;
