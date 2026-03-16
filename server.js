require('dotenv').config();
const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Import backend components
const socketHandler = require('./server/socket');
const authRoutes = require('./server/routes/auth');
const chatRoutes = require('./server/routes/chats');
const groupRoutes = require('./server/routes/groups');
const classRoutes = require('./server/routes/classes');
const automationRoutes = require('./server/routes/automation');
const userRoutes = require('./server/routes/users');
const uploadRoutes = require('./server/routes/upload');

nextApp.prepare().then(() => {
    const app = express();
    const server = http.createServer(app);

    // Socket.io initialization
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }
    });

    // Security Middleware
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));

    // Rate Limiting
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    // General Middleware
    app.use(cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Static uploads
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // API Routes
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/chats', chatRoutes);
    app.use('/api/groups', groupRoutes);
    app.use('/api/classes', classRoutes);
    app.use('/api/automation', automationRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/upload', uploadRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', message: 'Unified server is running' });
    });

    // Socket.io
    socketHandler(io);

    // Next.js handles all other routes
    // Let Next.js handle everything that isn't an API route
    app.use((req, res) => {
        return handle(req, res);
    });

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Unified Server Error:', err);
        if (res.headersSent) {
            return next(err);
        }
        res.status(500).json({ error: 'Internal server error' });
    });

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
        console.log(`🚀 Unified server running on port ${PORT}`);
        console.log(`📡 Socket.io server ready`);
    });
}).catch((ex) => {
    console.error('Server failed to start:', ex.stack);
    process.exit(1);
});
