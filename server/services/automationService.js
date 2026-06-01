const Automation = require('../models/Automation');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');

class AutomationService {
    constructor(io) {
        this.io = io;
    }

    static async handleCommand() {
        return {
            automated: false,
            handled: false,
            reason: 'automation_commands_are_handled_in_the_socket_flow'
        };
    }

    static async handleTeacherMessage() {
        return {
            automated: false
        };
    }

    /**
     * Check if a message contains any active automation keywords.
     * Returns the matched keyword or null.
     */
    async matchesKeyword(messageContent) {
        const keywords = await Automation.getActiveKeywordStrings();
        const lowerMessage = messageContent.toLowerCase();

        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword.toLowerCase())) {
                return keyword;
            }
        }

        return null;
    }

    extractTargetDivision(messageContent) {
        const divisionMatch = messageContent.match(/\b(?:div(?:ision)?\.?\s*)([A-Z])\b/i);
        return divisionMatch ? divisionMatch[1].toUpperCase() : null;
    }

    extractTargetYear(messageContent) {
        const yearMatch = messageContent.match(/\b(1st|2nd|3rd|4th)\s*year\b/i);

        if (yearMatch) {
            const yearLabel = yearMatch[1].toLowerCase();
            if (yearLabel.startsWith('1')) return 1;
            if (yearLabel.startsWith('2')) return 2;
            if (yearLabel.startsWith('3')) return 3;
            if (yearLabel.startsWith('4')) return 4;
        }

        const compactYearMatch = messageContent.match(/\byear\s*([1-4])\b/i);
        if (compactYearMatch) {
            return Number.parseInt(compactYearMatch[1], 10);
        }

        return null;
    }

    async getSenderClassGroups(senderId) {
        return Group.getClassGroupsByTeacher(senderId);
    }

    /**
     * Core handler: called when a new message is sent in a group.
     * Checks if automation is enabled, matches keywords, and forwards.
     */
    async processGroupMessage(groupId, messageId, senderId, messageContent) {
        try {
            const [group, sender] = await Promise.all([
                Group.findById(groupId),
                User.findById(senderId)
            ]);

            // 1. Check if this group is a teacher group with automation enabled
            if (!group || !group.is_teacher_group || !group.automation_enabled) {
                return { automated: false };
            }

            // 2. Ensure the sender is a teacher with the required profile fields
            if (!sender || sender.role !== 'teacher') {
                return { automated: false, reason: 'sender_not_teacher' };
            }

            if (!sender.division || !sender.college_year) {
                return { automated: false, reason: 'missing_teacher_profile' };
            }

            const targetDivision = this.extractTargetDivision(messageContent);
            const targetYear = this.extractTargetYear(messageContent);

            if (targetDivision && targetDivision !== String(sender.division).toUpperCase()) {
                return { automated: false, reason: 'division_mismatch' };
            }

            if (targetYear && targetYear !== Number(sender.college_year)) {
                return { automated: false, reason: 'year_mismatch' };
            }

            // 3. Check keyword match
            const matchedKeyword = await this.matchesKeyword(messageContent);
            if (!matchedKeyword) {
                return { automated: false };
            }

            console.log(
                `[Automation] Keyword "${matchedKeyword}" matched for teacher ${sender.name} (${sender.division}, Year ${sender.college_year}) in group ${groupId}`
            );

            // 4. Find all class groups owned by the sender teacher
            const classGroups = await this.getSenderClassGroups(senderId);
            if (classGroups.length === 0) {
                console.log(`[Automation] No class groups found for teacher ${senderId}`);
                return { automated: false, reason: 'no_class_groups' };
            }

            const forwardedTo = [];
            const Chat = require('../models/Chat');

            // 5. Forward the message to each class group's CR (or group if no CR)
            for (const classGroup of classGroups) {
                try {
                    const members = await Group.getMembers(classGroup.id);
                    const crs = members.filter(m => !!m.is_cr);

                    if (crs.length > 0) {
                        for (const cr of crs) {
                            const chat = await Chat.createOrGet(senderId, cr.id);

                            const alreadyForwarded = await Automation.hasBeenForwarded(messageId, `chat_${chat.id}`);
                            if (alreadyForwarded) continue;

                            const forwardedContent = `📢 [Div ${sender.division} • ${sender.college_year} Year | Auto-forwarded from ${group.name}]\n\n${messageContent}`;
                            const fwdMessageId = await Message.create({
                                sender_id: senderId,
                                chat_id: chat.id,
                                content: forwardedContent,
                                message_type: 'text',
                                is_automated: true
                            });

                            await Automation.logForward(groupId, messageId, `chat_${chat.id}`, fwdMessageId);
                            const fwdMessage = await Message.findById(fwdMessageId);

                            if (this.io) {
                                this.io.to(`chat_${chat.id}`).emit('message_received', fwdMessage);
                                this.io.to(`user_${cr.id}`).emit('message_received', fwdMessage);
                            }

                            forwardedTo.push({
                                type: 'cr',
                                crName: cr.name,
                                crId: cr.id,
                                groupName: classGroup.name,
                                division: sender.division,
                                collegeYear: sender.college_year,
                                messageId: fwdMessageId
                            });
                        }
                    } else {
                        const alreadyForwarded = await Automation.hasBeenForwarded(messageId, classGroup.id);
                        if (alreadyForwarded) {
                            console.log(`[Automation] Message ${messageId} already forwarded to group ${classGroup.id}, skipping`);
                            continue;
                        }

                        const forwardedContent = `📢 [Div ${sender.division} • ${sender.college_year} Year | Auto-forwarded from ${group.name}]\n\n${messageContent}`;
                        const fwdMessageId = await Message.create({
                            sender_id: senderId,
                            group_id: classGroup.id,
                            content: forwardedContent,
                            message_type: 'text',
                            is_automated: true
                        });

                        await Automation.logForward(groupId, messageId, classGroup.id, fwdMessageId);

                        const fwdMessage = await Message.findById(fwdMessageId);

                        if (this.io) {
                            this.io.to(`group_${classGroup.id}`).emit('message_received', fwdMessage);
                        }

                        forwardedTo.push({
                            type: 'group',
                            groupId: classGroup.id,
                            groupName: classGroup.name,
                            division: sender.division,
                            collegeYear: sender.college_year,
                            messageId: fwdMessageId
                        });

                        console.log(
                            `[Automation] Forwarded message from teacher ${sender.name} to class group "${classGroup.name}" (${classGroup.id})`
                        );
                    }
                } catch (err) {
                    console.error(`[Automation] Error forwarding to group ${classGroup.id}:`, err);
                }
            }

            return {
                automated: true,
                matchedKeyword,
                targetDivision: targetDivision || String(sender.division).toUpperCase(),
                targetYear: targetYear || Number(sender.college_year),
                forwardedTo,
                totalForwarded: forwardedTo.length
            };
        } catch (error) {
            console.error('[Automation] Error in processGroupMessage:', error);
            return { automated: false, error: error.message };
        }
    }
}

module.exports = AutomationService;
