const User = require('../models/User');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const socketHandler = (io) => {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Set user online
        await User.setOnlineStatus(socket.userId, true);

        // Join user's personal room
        socket.join(`user_${socket.userId}`);

        // Broadcast online status to all users
        socket.broadcast.emit('user_online', { userId: socket.userId });

        // Join chat room
        socket.on('join_chat', (chatId) => {
            socket.join(`chat_${chatId}`);
            console.log(`User ${socket.userId} joined chat ${chatId}`);
        });

        // Leave chat room
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat_${chatId}`);
            console.log(`User ${socket.userId} left chat ${chatId}`);
        });

        // Join group room
        socket.on('join_group', (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`User ${socket.userId} joined group ${groupId}`);
        });

        // Leave group room
        socket.on('leave_group', (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`User ${socket.userId} left group ${groupId}`);
        });

        // Send message (broadcast to chat participants)
        socket.on('send_message', async (data) => {
            const { chatId, groupId, message } = data;

            if (chatId) {
                // Broadcast to chat room
                io.to(`chat_${chatId}`).emit('message_received', message);
            } else if (groupId) {
                // Broadcast to group room
                io.to(`group_${groupId}`).emit('message_received', message);
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { chatId, groupId, isTyping } = data;

            if (chatId) {
                socket.to(`chat_${chatId}`).emit('user_typing', {
                    userId: socket.userId,
                    isTyping
                });
            } else if (groupId) {
                socket.to(`group_${groupId}`).emit('user_typing', {
                    userId: socket.userId,
                    isTyping
                });
            }
        });

        // Message read receipt
        socket.on('message_read', async (data) => {
            const { messageId, chatId } = data;

            await Message.setStatus(messageId, socket.userId, 'read');

            // Notify sender
            socket.to(`chat_${chatId}`).emit('message_status_updated', {
                messageId,
                userId: socket.userId,
                status: 'read'
            });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.userId}`);
            await User.setOnlineStatus(socket.userId, false);

            // Broadcast offline status
            socket.broadcast.emit('user_offline', { userId: socket.userId });
        });
    });
};

module.exports = socketHandler;
