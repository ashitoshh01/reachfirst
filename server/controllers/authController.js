const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    async register(req, res) {
        try {
            const { email, password, confirm_password, name, division, college_year } = req.body;

            if (!email || !password || !name || !division || college_year === undefined || college_year === null) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (confirm_password && password !== confirm_password) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }

            if (!email.endsWith('@despu.edu.in')) {
                return res.status(400).json({ error: 'Please use a valid @despu.edu.in email address' });
            }

            const localPart = email.split('@')[0];
            let role = null;

            if (/^[0-9A-Za-z.-]+$/.test(localPart) && /\d/.test(localPart)) {
                role = 'student';
            } else if (/^[A-Za-z.-]+$/.test(localPart)) {
                role = 'teacher';
            } else {
                return res.status(400).json({ error: 'Invalid email format for role assignment' });
            }

            const normalizedDivision = String(division).trim().toUpperCase();
            const normalizedYear = Number.parseInt(college_year, 10);

            if (!normalizedDivision) {
                return res.status(400).json({ error: 'Division is required' });
            }

            if (!Number.isInteger(normalizedYear) || normalizedYear < 1 || normalizedYear > 4) {
                return res.status(400).json({ error: 'College year must be between 1 and 4' });
            }

            if (role === 'teacher' && !/^[A-Z]$/.test(normalizedDivision)) {
                return res.status(400).json({ error: 'Teacher division must be a single letter such as A or B' });
            }

            if (role === 'student' && !/^[A-Z]$/.test(normalizedDivision)) {
                return res.status(400).json({ error: 'Student division must be a single letter such as A or B' });
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const password_hash = await bcrypt.hash(password, 10);

            const userId = await User.create({
                email,
                password_hash,
                name,
                role,
                division: normalizedDivision,
                college_year: normalizedYear
            });

            const token = jwt.sign(
                { id: userId, email, role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    email,
                    name,
                    role,
                    division: normalizedDivision,
                    college_year: normalizedYear
                }
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
                    division: user.division,
                    college_year: user.college_year,
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
