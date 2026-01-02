const db = require('../config/database');

const Chat = {
    async createOrGet(user1Id, user2Id) {
        // Ensure user1_id is always the smaller id for consistency
        const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

        try {
            // Check if chat already exists
            const [existing] = await db.execute(
                'SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?',
                [smallerId, largerId]
            );

            if (existing.length > 0) {
                return existing[0];
            }

            // Create new chat
            const [result] = await db.execute(
                'INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)',
                [smallerId, largerId]
            );

            return {
                id: result.insertId,
                user1_id: smallerId,
                user2_id: largerId
            };
        } catch (error) {
            // Handle race condition where chat was created between check and insert
            if (error.code === 'ER_DUP_ENTRY') {
                const [existing] = await db.execute(
                    'SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?',
                    [smallerId, largerId]
                );
                return existing[0];
            }
            throw error;
        }
    },

    async getUserChats(userId) {
        const [chats] = await db.execute(`
      SELECT 
        c.id,
        c.created_at,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        u.name as other_user_name,
        u.avatar_url as other_user_avatar,
        u.is_online as other_user_online,
        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM chats c
      JOIN users u ON (u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END)
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId]);

        return chats;
    },

    async getById(chatId) {
        const [rows] = await db.execute('SELECT * FROM chats WHERE id = ?', [chatId]);
        return rows[0];
    }
};

module.exports = Chat;
