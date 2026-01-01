const Group = require('../models/Group');
const Message = require('../models/Message');

const groupController = {
    async createGroup(req, res) {
        try {
            const { name, description, is_teacher_group } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Group name is required' });
            }

            const groupId = await Group.create({
                name,
                description,
                created_by: req.user.id,
                is_teacher_group: is_teacher_group || false
            });

            const group = await Group.findById(groupId);
            res.status(201).json({ group });
        } catch (error) {
            console.error('CreateGroup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getUserGroups(req, res) {
        try {
            const groups = await Group.getUserGroups(req.user.id);
            res.json({ groups });
        } catch (error) {
            console.error('GetUserGroups error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getGroupDetails(req, res) {
        try {
            const { groupId } = req.params;

            // Check if user is member
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const group = await Group.findById(groupId);
            const members = await Group.getMembers(groupId);

            res.json({ group, members });
        } catch (error) {
            console.error('GetGroupDetails error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async addMember(req, res) {
        try {
            const { groupId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Check if requester is member
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await Group.addMember(groupId, userId);
            res.json({ message: 'Member added successfully' });
        } catch (error) {
            console.error('AddMember error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async removeMember(req, res) {
        try {
            const { groupId, userId } = req.params;

            // Check if requester is member
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await Group.removeMember(groupId, userId);
            res.json({ message: 'Member removed successfully' });
        } catch (error) {
            console.error('RemoveMember error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async deleteGroup(req, res) {
        try {
            const { groupId } = req.params;

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Only creator can delete
            if (group.created_by !== req.user.id) {
                return res.status(403).json({ error: 'Only group creator can delete the group' });
            }

            await Group.delete(groupId);
            res.json({ message: 'Group deleted successfully' });
        } catch (error) {
            console.error('DeleteGroup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async sendGroupMessage(req, res) {
        try {
            const { groupId } = req.params;
            const { content, message_type } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Message content is required' });
            }

            // Check if user is member
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const messageId = await Message.create({
                sender_id: req.user.id,
                group_id: groupId,
                content,
                message_type: message_type || 'text'
            });

            const message = await Message.findById(messageId);
            res.json({ message });
        } catch (error) {
            console.error('SendGroupMessage error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getGroupMessages(req, res) {
        try {
            const { groupId } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            // Check if user is member
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const messages = await Message.getGroupMessages(groupId, limit, offset);
            res.json({ messages });
        } catch (error) {
            console.error('GetGroupMessages error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = groupController;
