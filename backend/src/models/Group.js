const db = require('../config/database');

const Group = {
    async create(groupData) {
        const { name, description, created_by, is_teacher_group } = groupData;
        const [result] = await db.execute(
            'INSERT INTO `groups` (name, description, created_by, is_teacher_group) VALUES (?, ?, ?, ?)',
            [name, description, created_by, is_teacher_group || false]
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
        (SELECT created_at FROM messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM \`groups\` g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY last_message_time DESC
    `, [userId]);

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
      SELECT u.id, u.name, u.email, u.avatar_url, u.is_online, gm.is_admin
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `, [groupId]);

        return members;
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
    }
};

module.exports = Group;
