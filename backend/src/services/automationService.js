const Automation = require('../models/Automation');
const Class = require('../models/Class');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

class AutomationService {
    /**
     * Detect if message contains automation intent keywords
     * Uses fuzzy/partial matching
     */
    static async detectAutomationIntent(message) {
        const keywords = await Automation.getKeywords();
        const lowerMessage = message.toLowerCase();

        // Check for partial/fuzzy matches
        for (const keyword of keywords) {
            const lowerKeyword = keyword.toLowerCase();
            if (lowerMessage.includes(lowerKeyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Route automated message to CRs of target classes
     */
    static async routeAutomatedMessage(teacherId, messageContent, targetClassIds) {
        // Get all CRs for the target classes
        const crs = await Class.getAllCRs(targetClassIds);

        if (crs.length === 0) {
            return { success: false, message: 'No CRs found for selected classes' };
        }

        const sentTo = [];

        // Create one-to-one chat with each CR and send message
        for (const cr of crs) {
            const chat = await Chat.createOrGet(teacherId, cr.id);
            const messageId = await Message.create({
                sender_id: teacherId,
                chat_id: chat.id,
                content: messageContent,
                is_automated: true
            });

            sentTo.push({
                crId: cr.id,
                crName: cr.name,
                chatId: chat.id,
                messageId
            });
        }

        return {
            success: true,
            sentTo,
            totalCRs: crs.length
        };
    }

    /**
     * Handle teacher message - check if automation is active and should be triggered
     */
    static async handleTeacherMessage(teacherId, messageContent) {
        // Get teacher's automation config
        const config = await Automation.getTeacherConfig(teacherId);

        // Check if automation is active and approved
        if (!config || !config.is_active || !config.is_approved) {
            return { automated: false };
        }

        // Check if message contains trigger keywords
        const hasIntent = await this.detectAutomationIntent(messageContent);

        if (!hasIntent) {
            return { automated: false };
        }

        // Get target classes
        const targetClasses = await Automation.getTargetClasses(config.id);

        if (targetClasses.length === 0) {
            return { automated: false, error: 'No target classes configured' };
        }

        // Route message to CRs
        const result = await this.routeAutomatedMessage(teacherId, messageContent, targetClasses);

        return {
            automated: true,
            ...result
        };
    }

    /**
     * Handle special commands (start/stop)
     */
    static async handleCommand(teacherId, command) {
        const config = await Automation.getTeacherConfig(teacherId);

        if (!config) {
            return { success: false, message: 'No automation configuration found. Please request automation first.' };
        }

        if (!config.is_approved) {
            return { success: false, message: 'Automation not approved by admin yet.' };
        }

        const lowerCommand = command.toLowerCase().trim();

        if (lowerCommand === 'start') {
            await Automation.setActive(config.id, true);
            return { success: true, message: 'Automation started', active: true };
        } else if (lowerCommand === 'stop') {
            await Automation.setActive(config.id, false);
            return { success: true, message: 'Automation stopped', active: false };
        }

        return { success: false, message: 'Invalid command' };
    }
}

module.exports = AutomationService;
