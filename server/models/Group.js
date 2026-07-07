const db = require('../config/database');

const Group = {
    async create(groupData) {
        const { name, description, created_by, is_teacher_group, is_class_group, class_teacher_id } = groupData;
        const [result] = await db.execute(
            'INSERT INTO `groups` (name, description, created_by, is_teacher_group, is_class_group, class_teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, created_by, is_teacher_group || false, is_class_group || false, class_teacher_id || null]
        );

        // Add creator as admin member
        await db.execute(
            'INSERT INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, TRUE)',
            [result.insertId, created_by]
        );

        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM `groups` WHERE id = ?', [id]);
        return rows[0];
    },

    async getUserGroups(userId) {
        const [groups] = await db.execute(`
      SELECT 
        g.*,
        (SELECT content FROM messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT message_type FROM messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT file_name FROM messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message_file_name,
        (SELECT created_at FROM messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.group_id = g.id 
         AND m.sender_id != ? 
         AND NOT EXISTS (
           SELECT 1 FROM message_status ms 
           WHERE ms.message_id = m.id AND ms.user_id = ? AND ms.status = 'read'
         )) as unread_count
      FROM \`groups\` g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY last_message_time DESC
    `, [userId, userId, userId]);

        return groups;
    },

    async addMember(groupId, userId, isAdmin = false) {
        await db.execute(
            'INSERT INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, ?)',
            [groupId, userId, isAdmin]
        );
    },

    async removeMember(groupId, userId) {
        await db.execute(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
    },

    async getMembers(groupId) {
        const [members] = await db.execute(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.is_online, u.role, u.is_cr, gm.is_admin
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `, [groupId]);

        return members;
    },

    async isAdmin(groupId, userId) {
        const [rows] = await db.execute(
            'SELECT is_admin FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        return rows.length > 0 && rows[0].is_admin;
    },

    async makeAdmin(groupId, userId) {
        await db.execute(
            'UPDATE group_members SET is_admin = TRUE WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
    },

    async removeAdmin(groupId, userId) {
        await db.execute(
            'UPDATE group_members SET is_admin = FALSE WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
    },

    async isMember(groupId, userId) {
        const [rows] = await db.execute(
            'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        return rows.length > 0;
    },

    async delete(groupId) {
        await db.execute('DELETE FROM `groups` WHERE id = ?', [groupId]);
    },

    // ========== Automation Methods ==========

    async setAutomation(groupId, enabled) {
        await db.execute(
            'UPDATE `groups` SET automation_enabled = ? WHERE id = ?',
            [enabled ? 1 : 0, groupId]
        );
    },

    async getAutomationEnabled(groupId) {
        const [rows] = await db.execute(
            'SELECT automation_enabled FROM `groups` WHERE id = ?',
            [groupId]
        );
        return rows.length > 0 && !!rows[0].automation_enabled;
    },

    /**
     * Get all class groups where a specific teacher is the class_teacher
     */
    async getClassGroupsByTeacher(teacherId) {
        const [rows] = await db.execute(
            'SELECT * FROM `groups` WHERE class_teacher_id = ? AND is_class_group = 1',
            [teacherId]
        );
        return rows;
    },

    /**
     * Get all teacher groups with automation enabled
     */
    async getTeacherGroupsWithAutomation() {
        const [rows] = await db.execute(
            'SELECT * FROM `groups` WHERE is_teacher_group = 1 AND automation_enabled = 1'
        );
        return rows;
    },

    /**
     * Set a group as a class group with a class teacher
     */
    async setClassGroup(groupId, classTeacherId) {
        await db.execute(
            'UPDATE `groups` SET is_class_group = 1, class_teacher_id = ? WHERE id = ?',
            [classTeacherId, groupId]
        );
    },

    async unsetClassGroup(groupId) {
        await db.execute(
            'UPDATE `groups` SET is_class_group = 0, class_teacher_id = NULL WHERE id = ?',
            [groupId]
        );
    },

    /**
     * Find all class groups for teachers who are members of a given teacher group
     */
    async getClassGroupsForTeacherGroupMembers(teacherGroupId) {
        const [rows] = await db.execute(`
            SELECT g.*, ct.name as class_teacher_name
            FROM \`groups\` g
            JOIN users ct ON g.class_teacher_id = ct.id
            WHERE g.is_class_group = 1
            AND g.class_teacher_id IN (
                SELECT gm.user_id FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = ? AND u.role = 'teacher'
            )
        `, [teacherGroupId]);
        return rows;
    },
    async countUserAdminGroups(userId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM group_members WHERE user_id = ? AND is_admin = TRUE',
            [userId]
        );
        return rows[0].count;
    }
};

module.exports = Group;
