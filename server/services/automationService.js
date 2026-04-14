const Automation = require('../models/Automation');
const Group = require('../models/Group');
const Message = require('../models/Message');

class AutomationService {
    constructor(io) {
        this.io = io;
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

    /**
     * Core handler: called when a new message is sent in a group.
     * Checks if automation is enabled, matches keywords, and forwards.
     */
    async processGroupMessage(groupId, messageId, senderId, messageContent) {
        try {
            // 1. Check if this group is a teacher group with automation enabled
            const group = await Group.findById(groupId);
            if (!group || !group.is_teacher_group || !group.automation_enabled) {
                return { automated: false };
            }

            // 2. Check keyword match
            const matchedKeyword = await this.matchesKeyword(messageContent);
            if (!matchedKeyword) {
                return { automated: false };
            }

            console.log(`[Automation] Keyword "${matchedKeyword}" matched in group ${groupId}, message: "${messageContent.substring(0, 50)}..."`);

            // 3. Find all class groups whose class_teacher is a member of this teacher group
            const classGroups = await Group.getClassGroupsForTeacherGroupMembers(groupId);
            if (classGroups.length === 0) {
                console.log(`[Automation] No class groups found for teacher group ${groupId}`);
                return { automated: false, reason: 'no_class_groups' };
            }

            const forwardedTo = [];
            const Chat = require('../models/Chat');

            // 4. Forward the message to each class group's CR (or group if no CR)
            for (const classGroup of classGroups) {
                try {
                    // Find CRs in this class group
                    const members = await Group.getMembers(classGroup.id);
                    const crs = members.filter(m => !!m.is_cr && !!m.is_admin);

                    if (crs.length > 0) {
                        // Forward to CRs via private chat
                        for (const cr of crs) {
                            // Check if already forwarded to this CR for this message (dedup)
                            // Note: we'll use a slightly different key or just log the group/user combo
                            const targetRoom = `chat_with_cr_${cr.id}`; // Conceptually, but we need chat_id

                            // Create/Get private chat with CR
                            const chat = await Chat.createOrGet(senderId, cr.id);

                            const alreadyForwarded = await Automation.hasBeenForwarded(messageId, `chat_${chat.id}`);
                            if (alreadyForwarded) continue;

                            const forwardedContent = `📢 [Auto-forwarded from ${group.name}]\n\n${messageContent}`;
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
                                // Emit to both users in the private chat
                                this.io.to(`chat_${chat.id}`).emit('message_received', fwdMessage);
                                // Also emit to user-specific rooms just in case they aren't in the chat room
                                this.io.to(`user_${cr.id}`).emit('message_received', fwdMessage);
                            }

                            forwardedTo.push({
                                type: 'cr',
                                crName: cr.name,
                                crId: cr.id,
                                groupName: classGroup.name,
                                messageId: fwdMessageId
                            });
                        }
                    } else {
                        // Fallback: Forward to the group itself
                        const alreadyForwarded = await Automation.hasBeenForwarded(messageId, classGroup.id);
                        if (alreadyForwarded) {
                            console.log(`[Automation] Message ${messageId} already forwarded to group ${classGroup.id}, skipping`);
                            continue;
                        }

                        // Create the forwarded message in the class group
                        const forwardedContent = `📢 [Auto-forwarded from ${group.name}]\n\n${messageContent}`;
                        const fwdMessageId = await Message.create({
                            sender_id: senderId,
                            group_id: classGroup.id,
                            content: forwardedContent,
                            message_type: 'text',
                            is_automated: true
                        });

                        // Log the forward for dedup
                        await Automation.logForward(groupId, messageId, classGroup.id, fwdMessageId);

                        // Get full message object for socket broadcast
                        const fwdMessage = await Message.findById(fwdMessageId);

                        // Broadcast to the target class group room via Socket.io
                        if (this.io) {
                            this.io.to(`group_${classGroup.id}`).emit('message_received', fwdMessage);
                        }

                        forwardedTo.push({
                            type: 'group',
                            groupId: classGroup.id,
                            groupName: classGroup.name,
                            messageId: fwdMessageId
                        });

                        console.log(`[Automation] No CR found. Forwarded message to class group "${classGroup.name}" (${classGroup.id})`);
                    }
                } catch (err) {
                    console.error(`[Automation] Error forwarding to group ${classGroup.id}:`, err);
                }
            }

            return {
                automated: true,
                matchedKeyword,
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
