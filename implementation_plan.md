# Unread Message Notifications (WhatsApp-style)

This plan outlines the architecture required to add real-time unread message counts (badges) on the chat sidebar.

## User Review Required

> [!WARNING]  
> This feature requires creating a new backend endpoint to efficiently bulk-mark messages as 'read', tweaking the user dashboard queries, and configuring Socket.io to allow background notifications. Please review the backend changes, especially the `ON DUPLICATE KEY UPDATE` query patterns.

## Proposed Changes

---

### Backend Models & Socket Setup

#### [MODIFY] server/models/Chat.js & server/models/Group.js
- Update `getUserChats` and `getUserGroups` MySQL queries to include a correlated subquery that retrieves the `unread_count`.
- The subquery will count messages where `sender_id != userId`, and where it does not already exist in the `message_status` table with a `status = 'read'` for that `user_id`.

#### [MODIFY] server/socket/index.js
- Currently, users only receive real-time messages via socket when they literally physically open a chat window. We will modify the `io.on('connection')` block so that when a user logs in, the server seamlessly forces them to silently join all their chat/group rooms in the background.

#### [NEW] Backend bulk-read logic
- Add `PUT /api/chats/:id/read` to `chatController.js` and `chats.js`
- Add `PUT /api/groups/:id/read` to `groupController.js` and `groups.js`
- These endpoints will use an efficient bulk insertion `ON DUPLICATE KEY UPDATE` to automatically mark hundreds of unread messages as 'read' in a single command. 

---

### Frontend UI & State

#### [MODIFY] src/app/chat/page.tsx
- Add a new React state: `const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})`
- Initialize it fully with the counts returned from `loadChatsAndGroups()`.
- Add a persistent `useEffect` that listens to `socket.on('message_received')`. If the incoming message belongs to a chat that isn't currently open, it simply increments `unreadCounts` for that chat without refreshing the whole inbox!
- Whenever a user clicks an unread chat, the frontend resets the badge to completely zero instantly, and dispatches an asynchronous call to the backend `PUT /read` route to make it permanent.

#### [MODIFY] src/components/chat/ChatList.tsx
- Accept `unreadCounts` as a prop.
- Render a highly polished, WhatsApp-themed spherical green badge dynamically right next to the 'last message' view for whatever chat possesses an unread count `> 0`. 

## Verification Plan

### Automated/Manual Testing
- Connect two instances (or two tabs with different users).
- Send a message from User A to User B while User B is clicked onto a different contact profile.
- Verify that a `1` badge appears on User B's sidebar for User A. 
- Click on User A from User B's perspective, verify the badge resets to 0 instantly, and test reloading the page confirming it stays 0. 
