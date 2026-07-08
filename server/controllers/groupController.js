const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const AutomationService = require('../services/automationService');

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

    async markGroupAsRead(req, res) {
        try {
            const { groupId } = req.params;
            await Message.markGroupMessagesAsRead(groupId, req.user.id);
            res.json({ message: 'Group marked as read' });
        } catch (error) {
            console.error('MarkGroupAsRead error:', error);
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

            const targetUser = await User.findById(userId);
            const isTargetAdmin = await Group.isAdmin(groupId, userId);
            if (targetUser && targetUser.role === 'student' && isTargetAdmin) {
                const adminCount = await Group.countUserAdminGroups(userId);
                if (adminCount <= 1) {
                    await User.updateById(userId, { is_cr: false });
                }
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

    async makeCR(req, res) {
        try {
            const { groupId, userId } = req.params;

            // Check if requester is admin
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can assign CR' });
            }

            const targetUser = await User.findById(userId);
            if (!targetUser || targetUser.role !== 'student') {
                return res.status(400).json({ error: 'Only students can be made CR' });
            }

            // If a teacher makes a student a CR, remove admin rights from other students in this group
            const members = await Group.getMembers(groupId);
            for (const member of members) {
                if (member.role === 'student' && member.is_admin && member.id !== parseInt(userId)) {
                    const adminCount = await Group.countUserAdminGroups(member.id);
                    if (adminCount <= 1) {
                        await User.updateById(member.id, { is_cr: false });
                    }
                    await Group.removeAdmin(groupId, member.id);
                }
            }

            // Also update the target user's global is_cr flag
            await User.updateById(userId, { is_cr: true });

            await Group.makeAdmin(groupId, userId);
            res.json({ message: 'User is now a CR' });
        } catch (error) {
            console.error('MakeCR error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async removeAdmin(req, res) {
        try {
            const { groupId, userId } = req.params;

            // Check if requester is admin
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can remove admin rights' });
            }

            const targetUser = await User.findById(userId);
            if (targetUser && targetUser.role === 'student') {
                const adminCount = await Group.countUserAdminGroups(userId);
                if (adminCount <= 1) {
                    await User.updateById(userId, { is_cr: false });
                }
            }

            await Group.removeAdmin(groupId, userId);
            res.json({ message: 'Admin rights removed successfully' });
        } catch (error) {
            console.error('RemoveAdmin error:', error);
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
            const { content, message_type, metadata } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Message content is required' });
            }

            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            const messageId = await Message.create({
                sender_id: req.user.id,
                group_id: groupId,
                content,
                message_type: message_type || 'text',
                file_name: metadata?.original_name || null,
                file_mime_type: metadata?.mimetype || null,
                file_size: metadata?.size || null
            });

            const message = await Message.findById(messageId);

            let automation = { automated: false };
            if (group.is_teacher_group && group.automation_enabled) {
                const automationService = new AutomationService();
                automation = await automationService.processGroupMessage(
                    groupId,
                    messageId,
                    req.user.id,
                    content
                );
            }

            res.json({ message, automation });
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
    },

    // ========== Automation Endpoints ==========

    async toggleAutomation(req, res) {
        try {
            const { groupId } = req.params;
            const { enabled } = req.body;

            // Check if requester is admin of the group
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can toggle automation' });
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            if (!group.is_teacher_group) {
                return res.status(400).json({ error: 'Automation can only be enabled on teacher groups' });
            }

            await Group.setAutomation(groupId, enabled);
            res.json({
                message: enabled ? 'Automation enabled' : 'Automation disabled',
                automation_enabled: !!enabled
            });
        } catch (error) {
            console.error('ToggleAutomation error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async setClassGroup(req, res) {
        try {
            const { groupId } = req.params;

            // Check if requester is admin of the group
            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can set class group' });
            }

            // The class_teacher is the current user (must be a teacher)
            if (req.user.role !== 'teacher') {
                return res.status(403).json({ error: 'Only teachers can mark a group as a class group' });
            }

            await Group.setClassGroup(groupId, req.user.id);
            const group = await Group.findById(groupId);
            res.json({ message: 'Group marked as class group', group });
        } catch (error) {
            console.error('SetClassGroup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async unsetClassGroup(req, res) {
        try {
            const { groupId } = req.params;

            const isAdmin = await Group.isAdmin(groupId, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can unset class group' });
            }

            await Group.unsetClassGroup(groupId);
            res.json({ message: 'Class group status removed' });
        } catch (error) {
            console.error('UnsetClassGroup error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getMyClassGroups(req, res) {
        try {
            const classGroups = await Group.getClassGroupsByTeacher(req.user.id);
            res.json({ classGroups });
        } catch (error) {
            console.error('GetMyClassGroups error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    /**
     * Preview which class groups automation will target for a given message.
     * Does NOT actually send or forward anything — dry-run only.
     */
    async previewAutomation(req, res) {
        try {
            const { groupId } = req.params;
            const { content } = req.body;

            if (!content || !content.trim()) {
                return res.json({ willTrigger: false, classes: [] });
            }

            const isMember = await Group.isMember(groupId, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const group = await Group.findById(groupId);
            if (!group || !group.is_teacher_group || !group.automation_enabled) {
                return res.json({ willTrigger: false, classes: [] });
            }

            // Check keyword match
            const automationService = new AutomationService();
            const matchedKeyword = await automationService.matchesKeyword(content);
            if (!matchedKeyword) {
                return res.json({ willTrigger: false, classes: [] });
            }

            // Get all class groups that would be targeted
            const classGroups = await Group.getClassGroupsForTeacherGroupMembers(groupId);

            res.json({
                willTrigger: true,
                matchedKeyword,
                classes: classGroups.map(cg => ({
                    id: cg.id,
                    name: cg.name,
                    teacherName: cg.class_teacher_name
                }))
            });
        } catch (error) {
            console.error('PreviewAutomation error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = groupController;
