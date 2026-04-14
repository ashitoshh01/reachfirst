const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');

const groupController = {
    async createGroup(req, res) {
        try {
            const { name, description, is_teacher_group, memberIds } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Group name is required' });
            }

            const groupId = await Group.create({
                name,
                description,
                created_by: req.user.id,
                is_teacher_group: is_teacher_group || false
            });

            // Add selected members if any
            if (memberIds && Array.isArray(memberIds)) {
                const uniqueMemberIds = [...new Set(memberIds)];
                for (const userId of uniqueMemberIds) {
                    if (userId !== req.user.id) {
                        try {
                            await Group.addMember(groupId, userId);
                        } catch (err) {
                            console.error(`Failed to add user ${userId} to group ${groupId}`, err);
                        }
                    }
                }
            }

            const group = await Group.findById(groupId);
            res.status(201).json({ group });
        } catch (error) {
            console.error('CreateGroup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async createTeacherGroup(req, res) {
        try {
            const { name, description, teacherIds } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Group name is required' });
            }

            if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
                return res.status(400).json({ error: 'Teacher IDs are required' });
            }

            // Verify all teacherIds are valid teachers
            for (const teacherId of teacherIds) {
                const user = await User.findById(teacherId);
                if (!user || user.role !== 'teacher') {
                    return res.status(400).json({ error: `Invalid teacher ID: ${teacherId}` });
                }
            }

            const groupId = await Group.create({
                name,
                description,
                created_by: req.user.id,
                is_teacher_group: true
            });

            // Add all teachers to the group (filtering out the creator if duplicated)
            const uniqueTeacherIds = [...new Set(teacherIds)];
            for (const teacherId of uniqueTeacherIds) {
                if (teacherId !== req.user.id) {
                    await Group.addMember(groupId, teacherId);
                }
            }

            const group = await Group.findById(groupId);
            res.status(201).json({ group });
        } catch (error) {
            console.error('CreateTeacherGroup error:', error);
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

            // Only members can view private group details
            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            const members = await Group.getMembers(groupId);

            res.json({ 
                group: {
                    ...group,
                    total_members: members.length
                }, 
                members 
            });
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

            // Check if requester is admin (or themselves leaving)
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin && req.user.id !== parseInt(userId)) {
                return res.status(403).json({ error: 'Only admins can remove members' });
            }

            await Group.removeMember(groupId, userId);
            res.json({ message: 'Member removed successfully' });
        } catch (error) {
            console.error('RemoveMember error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async makeAdmin(req, res) {
        try {
            const { groupId, userId } = req.params;

            // Check if requester is admin
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can assign new admins' });
            }

            await Group.makeAdmin(groupId, userId);
            res.json({ message: 'User is now an admin' });
        } catch (error) {
            console.error('MakeAdmin error:', error);
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
