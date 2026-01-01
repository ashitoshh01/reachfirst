const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;

            // Validate input
            if (!email || !password || !name || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (!['student', 'teacher', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Create user
            const userId = await User.create({
                email,
                password_hash,
                name,
                role
            });

            // Generate token
            const token = jwt.sign(
                { id: userId, email, role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: { id: userId, email, name, role }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update online status
            await User.setOnlineStatus(user.id, true);

            // Generate token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    is_cr: user.is_cr,
                    avatar_url: user.avatar_url
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getMe(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            console.error('GetMe error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async logout(req, res) {
        try {
            await User.setOnlineStatus(req.user.id, false);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = authController;
