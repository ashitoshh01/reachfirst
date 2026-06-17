# 📱 ReachFirst: Smart Teacher-Student Communication Portal

ReachFirst is a purpose-built real-time messaging platform designed for educational institutions. It provides a seamless communication experience with a powerful **AI-driven automation layer** that helps teachers effortlessly manage cross-group announcements, saving them time and reducing administrative stress.

## 🚀 The Core Problem & Our Solution
Teachers manage multiple chats and often need to relay information from a "Teachers-Only" group to their respective "Student-Teacher" groups. Due to heavy workloads, teachers might delay or completely forget to forward crucial messages.

**The ReachFirst Solution:**
An intelligent bot monitors teacher groups for specific forwarding commands/keywords (e.g., *"Send this to the student-teacher group"*). When triggered, the bot automatically extracts the announcement and forwards it directly to the designated **Class Representative (CR)**. This ensures timely delivery of information without requiring manual effort from the teacher.

## ✨ Key Features

### 🤖 AI Automation Bot
- **Keyword & Intent Detection:** Automatically detects phrases indicating a message needs to be forwarded to students.
- **Smart Routing:** Identifies the correct target audience and routes the message personally to the designated Class Representative (CR).
- **Stress-Free Announcements:** Ensures messages are never missed or delayed, significantly reducing the cognitive load on teaching staff.

### 💬 Real-Time Messaging Hub
- **Instant Communication:** Fast, reliable one-to-one and group messaging powered by Socket.io.
- **Dedicated Workspaces:** Support for specific group types (Teachers Group, Student-Teacher Group, CR-only channels).
- **Modern Interface:** A clean, intuitive, and highly responsive UI designed specifically for academic workflows.

### 🔐 Role-Based Architecture
- **Teachers:** Can initiate automated broadcasts and manage typical student interactions.
- **Class Representatives (CRs):** Act as the bridge between teachers and the broader student body, receiving automated briefs to distribute.
- **Students:** Standard portal access for direct communication and receiving updates.

## 🛠️ Technology Stack

- **Frontend:** Next.js, React, Tailwind CSS (Modern, fast, and scalable user interface)
- **Backend:** Node.js, Express.js (Robust REST APIs and server logic)
- **Real-Time Engine:** Socket.io (Low-latency bidirectional communication)
- **Database:** MySQL (Relational data management for users, chats, and configurations)
- **AI/Automation:** Custom keyword/intent parsing engine running securely on the backend.

## 📂 Project Structure Overview

- `/src/app/` - Next.js frontend pages (Login, Signup, Chat portal).
- `/server/` - Express backend including controllers, routes, and Socket.io events.
- `/database/` - MySQL schemas and initialization scripts.
- `/server/services/automationService.js` - The core logic powering the ReachFirst AI forwarding bot.

## 🚧 Project Status
**Under Active Development** - We are currently refining the real-time sockets and training the AI automation bot to recognize a wider array of natural language forwarding commands.

# Academic Messaging Application

A full-fledged WhatsApp-like messaging application with academic automation features built with Next.js, Express, MySQL, and Socket.io.

## Features

### Core Messaging
- ✅ Real-time one-to-one chat
- ✅ Group chat with member management
- ✅ Create/delete groups
- ✅ Add/remove members
- ✅ Message timestamps
- ✅ Delivery and read receipts
- ✅ Online/offline status
- ✅ Typing indicators

### Role-Based System
- **Students**: Regular messaging access
- **Teachers**: Regular messaging + automation capabilities
- **Admin**: User management + automation approvals
- **Class Representatives (CR)**: Receives automated messages from teachers

### Automation System
- Teachers can request automation from admins
- Select target classes for message routing
- Generic keyword-based detection
- Start/stop automation with commands
- Messages automatically forwarded to class CRs (NOT to class groups)
- CRs manually convey messages to students

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MySQL 8.0
- **Real-time**: Socket.io
- **Authentication**: JWT

## Project Structure

```
ReachFirst/
├── frontend/          # Next.js application  
│   ├── src/
│   │   ├── app/      # Next.js app router pages
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
│
├── backend/          # Express server
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── server.js
│   └── package.json
│
└── database/         # MySQL schema
    └── schema.sql
```

## Setup Instructions

### 1. Database Setup

```bash
# Initialize MySQL database
sudo mysql < database/schema.sql

# Or manually:
mysql -u root -p
# Then run the contents of database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit backend/.env and update:
# - DB_PASSWORD (your MySQL password)
# - JWT_SECRET (generate a secure random string)

# Start the backend server
npm run dev

# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Environment is already configured in .env.local

# Start the development server
npm run dev

# Frontend will run on http://localhost:3000
```

## Usage

### 1. Register Users

1. Go to http://localhost:3000/signup
2. Create accounts with different roles:
   - Admin account
   - Teacher account(s)
   - Student accounts

### 2. Admin Setup

As admin:
1. Create classes via API or database
2. Assign students as CRs to classes
3. Approve teacher automation requests

### 3. Teacher Automation Workflow

As a teacher:
1. Request automation from admin
2. Select target classes
3. Wait for admin approval
4. Type `start` in any chat to activate automation
5. Send messages with trigger keywords like:
   - "Send this message to respective classes"
   - "Please convey this message to your classes"
   - "Inform your class representatives"
6. Messages are automatically sent to CRs of selected classes
7. Type `stop` to deactivate automation

### 4. Normal Messaging

- Click on any user to start a chat
- Create groups and add members
- Send real-time messages
- Messages marked as read automatically

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Chats
- `POST /api/chats` - Create/get chat
- `GET /api/chats` - Get user chats
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/messages` - Send message

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user groups
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:userId` - Remove member
- `POST /api/groups/:id/messages` - Send group message

### Classes (Admin only)
- `POST /api/classes` - Create class
- `GET /api/classes` - Get all classes
- `POST /api/classes/:id/cr` - Assign CR
- `GET /api/classes/:id/crs` - Get class CRs

### Automation
- `POST /api/automation/request` - Request automation (teacher)
- `GET /api/automation/pending` - Get pending requests (admin)
- `PUT /api/automation/:id/approve` - Approve automation (admin)
- `GET /api/automation/config` - Get teacher config
- `GET /api/automation/keywords` - Get keywords
- `POST /api/automation/keywords` - Add keyword (admin)

## Database Schema

- **users**: User accounts with roles
- **chats**: One-to-one conversations
- **groups**: Group conversations
- **group_members**: Group membership
- **messages**: All messages
- **message_status**: Read/delivery status
- **classes**: Academic classes
- **class_cr_mapping**: CR assignments
- **automation_config**: Automation settings
- **automation_target_classes**: Target classes for automation
- **automation_keywords**: Trigger keywords

## Architecture Highlights

### Real-time Communication
- Socket.io manages WebSocket connections
- Events: connect, disconnect, join_chat, send_message, typing, message_read
- JWT authentication for socket connections

### Automation Engine
- Keyword detection service with fuzzy matching
- Message routing to CRs only (not to class groups)
- Teacher commands: `start` and `stop`
- Admin approval required before activation

### Security
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- CORS configuration

## Future Enhancements

- File/image sharing
- Voice/video calls
- Push notifications
- Message search
- User profiles with avatars
- Group admin controls
- Message encryption
- Mobile app (React Native)

## Troubleshooting

**Database connection error:**
- CheckMySQL is running: `sudo systemctl status mysql`
- Verify credentials in `backend/.env`

**Socket connection error:**
- Ensure backend is running on port 5000
- Check CORS settings in backend

**Frontend build errors:**
- Delete `.next` folder and rebuild
- Clear npm cache: `npm cache clean --force`

## License

MIT

## Author

Built for academic communication and collaboration.
