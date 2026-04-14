const User = require('../models/User');

const userController = {
    async findByEmail(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const user = await User.findByEmail(email);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Return safe user info
            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url
                }
            });
        } catch (error) {
            console.error('FindUser error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async searchUsers(req, res) {
        try {
            const { query, role } = req.query;
            if (!query && !role) {
                return res.json({ users: [] });
            }

            let users;
            if (query) {
                users = await User.search(query);
            } else {
                users = await User.findByRole(role);
            }

            // Filter out requester
            users = users.filter(u => u.id !== req.user.id);

            // If role filter is provided in secondary query
            if (role) {
                users = users.filter(u => u.role === role);
            }

            res.json({ users });
        } catch (error) {
            console.error('SearchUsers error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async updateProfile(req, res) {
        try {
            const { name, avatar_url, bio } = req.body;
            const updates = {};
            if (name) updates.name = name;
            if (avatar_url !== undefined) updates.avatar_url = avatar_url;
            if (bio !== undefined) updates.bio = bio;

            await User.updateById(req.user.id, updates);
            const user = await User.findById(req.user.id);

            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    bio: user.bio
                }
            });
        } catch (error) {
            console.error('UpdateProfile error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getUserDetails(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    bio: user.bio,
                    last_seen: user.last_seen,
                    is_online: user.is_online
                }
            });
        } catch (error) {
            console.error('GetUserDetails error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async deleteAccount(req, res) {
        try {
            await User.deleteById(req.user.id);
            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('DeleteAccount error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = userController;
