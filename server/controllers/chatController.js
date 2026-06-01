const Chat = require('../models/Chat');
const Message = require('../models/Message');
const AutomationService = require('../services/automationService');

const chatController = {
    async createOrGetChat(req, res) {
        try {
            const { otherUserId } = req.body;

            if (!otherUserId) {
                return res.status(400).json({ error: 'Other user ID is required' });
            }

            const chat = await Chat.createOrGet(req.user.id, otherUserId);
            res.json({ chat });
        } catch (error) {
            console.error('CreateOrGetChat error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getUserChats(req, res) {
        try {
            const chats = await Chat.getUserChats(req.user.id);
            res.json({ chats });
        } catch (error) {
            console.error('GetUserChats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getChatMessages(req, res) {
        try {
            const { chatId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const messages = await Message.getChatMessages(chatId, limit, offset);
            res.json({ messages });
        } catch (error) {
            console.error('GetChatMessages error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { content, message_type } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Message content is required' });
            }

            const messageId = await Message.create({
                sender_id: req.user.id,
                chat_id: chatId,
                content,
                message_type: message_type || 'text'
            });

            const message = await Message.findById(messageId);

            res.json({ message });
        } catch (error) {
            console.error('SendMessage error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async markAsRead(req, res) {
        try {
            const { messageId } = req.params;

            await Message.setStatus(messageId, req.user.id, 'read');
            res.json({ message: 'Message marked as read' });
        } catch (error) {
            console.error('MarkAsRead error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async markChatAsRead(req, res) {
        try {
            const { chatId } = req.params;
            await Message.markChatMessagesAsRead(chatId, req.user.id);
            res.json({ message: 'Chat marked as read' });
        } catch (error) {
            console.error('MarkChatAsRead error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getChatMedia(req, res) {
        try {
            const { chatId } = req.params;
            const media = await Message.getChatMedia(chatId);
            res.json({ media });
        } catch (error) {
            console.error('GetChatMedia error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = chatController;
