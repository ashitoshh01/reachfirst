const Automation = require('../models/Automation');

const automationController = {
    async requestAutomation(req, res) {
        try {
            const { targetClasses } = req.body;

            if (!targetClasses || targetClasses.length === 0) {
                return res.status(400).json({ error: 'Target classes are required' });
            }

            // Create automation config
            const automationId = await Automation.createConfig(req.user.id);

            // Set target classes
            await Automation.setTargetClasses(automationId, targetClasses);

            res.status(201).json({
                message: 'Automation request submitted. Waiting for admin approval.',
                automationId
            });
        } catch (error) {
            console.error('RequestAutomation error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getPendingRequests(req, res) {
        try {
            const requests = await Automation.getPendingApprovals();
            res.json({ requests });
        } catch (error) {
            console.error('GetPendingRequests error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async approveAutomation(req, res) {
        try {
            const { automationId } = req.params;

            await Automation.approve(automationId, req.user.id);
            res.json({ message: 'Automation approved successfully' });
        } catch (error) {
            console.error('ApproveAutomation error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getTeacherConfig(req, res) {
        try {
            const config = await Automation.getTeacherConfig(req.user.id);

            if (!config) {
                return res.json({ config: null });
            }

            const targetClasses = await Automation.getTargetClasses(config.id);

            res.json({
                config: {
                    ...config,
                    targetClasses
                }
            });
        } catch (error) {
            console.error('GetTeacherConfig error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // ========== Keywords CRUD ==========

    async getKeywords(req, res) {
        try {
            const keywords = await Automation.getKeywords();
            res.json({ keywords });
        } catch (error) {
            console.error('GetKeywords error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async addKeyword(req, res) {
        try {
            const { keyword } = req.body;

            if (!keyword || !keyword.trim()) {
                return res.status(400).json({ error: 'Keyword is required' });
            }

            const id = await Automation.addKeyword(keyword.trim());
            res.json({ message: 'Keyword added successfully', id });
        } catch (error) {
            console.error('AddKeyword error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async deleteKeyword(req, res) {
        try {
            const { keywordId } = req.params;
            await Automation.deleteKeyword(keywordId);
            res.json({ message: 'Keyword deleted successfully' });
        } catch (error) {
            console.error('DeleteKeyword error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async toggleKeyword(req, res) {
        try {
            const { keywordId } = req.params;
            const { is_active } = req.body;
            await Automation.toggleKeyword(keywordId, is_active);
            res.json({ message: 'Keyword updated successfully' });
        } catch (error) {
            console.error('ToggleKeyword error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = automationController;
