const db = require('../config/database');

const Message = {
    async getChatMedia(chatId) {
        const [rows] = await db.execute(
            `SELECT * FROM messages 
             WHERE chat_id = ? AND message_type IN ('image', 'video', 'file') 
             ORDER BY created_at DESC 
             LIMIT 6`,
            [chatId]
        );
        return rows;
    },

    async create(messageData) {
        const { sender_id, chat_id, group_id, content, message_type, is_automated } = messageData;

        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, chat_id, group_id, content, message_type, is_automated) VALUES (?, ?, ?, ?, ?, ?)',
            [
                sender_id,
                chat_id || null,
                group_id || null,
                content,
                message_type || 'text',
                is_automated || false
            ]
        );

        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [id]);
        return rows[0];
    },

    async getChatMessages(chatId, limit = 50, offset = 0) {
        // Ensure limit/offset are integers
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;

        const [messages] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, [chatId]);

        return messages;
    },

    async getGroupMessages(groupId, limit = 50, offset = 0) {
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;

        const [messages] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ?
      ORDER BY m.created_at ASC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, [groupId]);

        return messages;
    },

    async setStatus(messageId, userId, status) {
        await db.execute(
            'INSERT INTO message_status (message_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, updated_at = CURRENT_TIMESTAMP',
            [messageId, userId, status, status]
        );
    },

    async getStatus(messageId, userId) {
        const [rows] = await db.execute(
            'SELECT status FROM message_status WHERE message_id = ? AND user_id = ?',
            [messageId, userId]
        );
        return rows[0]?.status;
    }
};

module.exports = Message;
