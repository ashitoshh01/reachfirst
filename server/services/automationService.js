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

    extractTargetDivisions(messageContent) {
        const regex = /\b(?:div(?:ision)?\.?\s*)([A-Z])\b/gi;
        const matches = [...messageContent.matchAll(regex)];
        if (matches.length === 0) return null;
        return [...new Set(matches.map(m => m[1].toUpperCase()))];
    }

    extractTargetYears(messageContent) {
        const years = new Set();
        
        const yearRegex1 = /\b(1st|2nd|3rd|4th)\s*year\b/gi;
        const matches1 = [...messageContent.matchAll(yearRegex1)];
        for (const m of matches1) {
            const yearLabel = m[1].toLowerCase();
            if (yearLabel.startsWith('1')) years.add(1);
            else if (yearLabel.startsWith('2')) years.add(2);
            else if (yearLabel.startsWith('3')) years.add(3);
            else if (yearLabel.startsWith('4')) years.add(4);
        }

        const yearRegex2 = /\byear\s*([1-4])\b/gi;
        const matches2 = [...messageContent.matchAll(yearRegex2)];
        for (const m of matches2) {
            years.add(Number.parseInt(m[1], 10));
        }

        return years.size > 0 ? [...years] : null;
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

            // 3. Check keyword match FIRST to avoid unnecessary DB queries
            const matchedKeyword = await this.matchesKeyword(messageContent);
            if (!matchedKeyword) {
                return { automated: false };
            }

            const targetDivisions = this.extractTargetDivisions(messageContent) || [String(sender.division).toUpperCase()];
            const targetYears = this.extractTargetYears(messageContent) || [Number(sender.college_year)];

            const targets = [];
            for (const div of targetDivisions) {
                for (const year of targetYears) {
                    targets.push({ division: div, year: year });
                }
            }

            const forwardedTo = [];
            const Chat = require('../models/Chat');
            const db = require('../config/database');

            for (const target of targets) {
                let effectiveTeacher = sender;

                if (target.division !== String(sender.division).toUpperCase() ||
                    target.year !== Number(sender.college_year)) {
                    
                    const [targetTeachers] = await db.execute(
                        'SELECT * FROM users WHERE role = "teacher" AND division = ? AND college_year = ? LIMIT 1',
                        [target.division, target.year]
                    );

                    if (targetTeachers.length === 0) {
                        console.log(`[Automation] No target teacher found for Div ${target.division} Year ${target.year}`);
                        continue;
                    }
                    effectiveTeacher = targetTeachers[0];
                }

                console.log(
                    `[Automation] Keyword "${matchedKeyword}" matched. Using teacher ${effectiveTeacher.name} (${effectiveTeacher.division}, Year ${effectiveTeacher.college_year}) in group ${groupId}`
                );

                // 4. Find all class groups owned by the effective teacher
                const classGroups = await this.getSenderClassGroups(effectiveTeacher.id);
                if (classGroups.length === 0) {
                    console.log(`[Automation] No class groups found for teacher ${effectiveTeacher.id}`);
                    continue;
                }

                // 5. Forward the message to each class group's CR (or group if no CR)
                for (const classGroup of classGroups) {
                    try {
                        const members = await Group.getMembers(classGroup.id);
                        const crs = members.filter(m => !!m.is_cr);

                        if (crs.length > 0) {
                            for (const cr of crs) {
                                const chat = await Chat.createOrGet(effectiveTeacher.id, cr.id);

                                const alreadyForwarded = await Automation.hasBeenForwarded(messageId, `chat_${chat.id}`);
                                if (alreadyForwarded) continue;

                                const forwardedContent = `📢 [Div ${effectiveTeacher.division} • ${effectiveTeacher.college_year} Year | Auto-forwarded from ${group.name} by ${sender.name}]\n\n${messageContent}`;
                                const fwdMessageId = await Message.create({
                                    sender_id: effectiveTeacher.id,
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
                                    this.io.to(`user_${effectiveTeacher.id}`).emit('message_received', fwdMessage);
                                }

                                forwardedTo.push({
                                    type: 'cr',
                                    crName: cr.name,
                                    crId: cr.id,
                                    groupName: classGroup.name,
                                    division: effectiveTeacher.division,
                                    collegeYear: effectiveTeacher.college_year,
                                    messageId: fwdMessageId
                                });
                            }
                        } else {
                            const alreadyForwarded = await Automation.hasBeenForwarded(messageId, classGroup.id);
                            if (alreadyForwarded) {
                                console.log(`[Automation] Message ${messageId} already forwarded to group ${classGroup.id}, skipping`);
                                continue;
                            }

                            const forwardedContent = `📢 [Div ${effectiveTeacher.division} • ${effectiveTeacher.college_year} Year | Auto-forwarded from ${group.name} by ${sender.name}]\n\n${messageContent}`;
                            const fwdMessageId = await Message.create({
                                sender_id: effectiveTeacher.id,
                                group_id: classGroup.id,
                                content: forwardedContent,
                                message_type: 'text',
                                is_automated: true
                            });

                            await Automation.logForward(groupId, messageId, classGroup.id, fwdMessageId);

                            const fwdMessage = await Message.findById(fwdMessageId);

                            if (this.io) {
                                this.io.to(`group_${classGroup.id}`).emit('message_received', fwdMessage);
                                this.io.to(`user_${effectiveTeacher.id}`).emit('message_received', fwdMessage);
                            }

                            forwardedTo.push({
                                type: 'group',
                                groupId: classGroup.id,
                                groupName: classGroup.name,
                                division: effectiveTeacher.division,
                                collegeYear: effectiveTeacher.college_year,
                                messageId: fwdMessageId
                            });

                            console.log(
                                `[Automation] Forwarded message from teacher ${effectiveTeacher.name} to class group "${classGroup.name}" (${classGroup.id})`
                            );
                        }
                    } catch (err) {
                        console.error(`[Automation] Error forwarding to group ${classGroup.id}:`, err);
                    }
                }
            }

            return {
                automated: true,
                matchedKeyword,
                targetsProcessed: targets,
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
