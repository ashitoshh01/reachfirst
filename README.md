# 📱 ReachFirst: Smart Teacher-Student Communication Portal

ReachFirst is a purpose-built real-time messaging platform designed for educational institutions. It provides a seamless communication experience with a powerful **AI-driven automation layer** that helps teachers effortlessly manage cross-group announcements, saving them time and reducing administrative stress.

## 🚀 The Core Problem & Our Solution
Teachers manage multiple chats and often need to relay information from a "Teachers-Only" group to their respective "Student-Teacher" groups. Due to heavy workloads, teachers might delay or completely forget to forward crucial messages.

**The ReachFirst Solution:**
An intelligent bot monitors teacher groups for specific forwarding commands/keywords (e.g., *"Send this to the student-teacher group"*). When triggered, the bot automatically extracts the announcement and forwards it directly to the designated **Class Representative (CR)**. This ensures timely delivery of information without requiring manual effort from the teacher.

## ✨ Features

### 🤖 AI Automation & Workflow
- **Keyword & Intent Detection:** Automatically detects phrases indicating a message needs to be forwarded to students.
- **Smart Routing:** Identifies the correct target audience and routes the message personally to the designated Class Representative (CR).
- **Teacher Controls:** Start/stop automation with commands (`start`/`stop`).
- **Stress-Free Announcements:** Ensures messages are never missed or delayed, significantly reducing the cognitive load on teaching staff.

### 💬 Core Messaging & Real-Time Hub
- ✅ **Instant Communication:** Fast, reliable one-to-one and group messaging powered by Socket.io.
- ✅ **Group Management:** Create/delete groups, add/remove members.
- ✅ **Real-Time Indicators:** Delivery and read receipts, online/offline status, and typing indicators.
- ✅ **Dedicated Workspaces:** Support for specific group types (Teachers Group, Student-Teacher Group, CR-only channels).

### 🔐 Role-Based Architecture
- **Admin**: User management + automation approvals.
- **Teachers:** Can initiate automated broadcasts and manage typical student interactions.
- **Class Representatives (CRs):** Act as the bridge between teachers and the broader student body, receiving automated briefs to distribute.
- **Students:** Standard portal access for direct communication and receiving updates.

## 🛠️ Technology Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js (REST APIs and server logic)
- **Real-Time Engine:** Socket.io (Low-latency bidirectional communication)
- **Database:** MySQL 8.0 (Relational data management for users, chats, and configurations)
- **Authentication:** JWT
- **AI/Automation:** Custom keyword/intent parsing engine running securely on the backend.

## 📂 Project Structure Overview

- `/src/app/` - Next.js frontend pages (Login, Signup, Chat portal).
- `/server/` - Express backend including controllers, routes, and Socket.io events.
- `/database/` - MySQL schemas and initialization scripts.
- `/server/services/automationService.js` - The core logic powering the ReachFirst AI forwarding bot.

## 🔧 Setup Instructions

### 1. Database Setup

```bash
# Initialize MySQL database
sudo mysql < database/schema.sql

# Or manually:
mysql -u root -p
# Then run the contents of database/schema.sql
```

### 2. Environment Configuration

```bash
# Install root dependencies
npm install

# Configure environment variables
# Edit .env and update:
# - DB_PASSWORD (your MySQL password)
# - JWT_SECRET (generate a secure random string)
```

### 3. Running the Application

```bash
# Start both frontend and backend (if concurrently setup) or individually based on package.json
npm run dev

# Frontend typically runs on http://localhost:3000
# Backend typically runs on http://localhost:5000
```

## 📖 Usage Guide

### 1. Register Users
1. Go to http://localhost:3000/signup
2. Create accounts with different roles (Admin, Teachers, Students).

### 2. Admin Setup
As admin:
1. Create classes via API or database.
2. Assign students as CRs to classes.
3. Approve teacher automation requests.

### 3. Teacher Automation Workflow
As a teacher:
1. Request automation from admin.
2. Select target classes.
3. Wait for admin approval.
4. Type `start` in any chat to activate automation.
5. Send messages with trigger keywords like:
   - "Send this message to respective classes"
   - "Please convey this message to your classes"
6. Messages are automatically sent to CRs of selected classes.
7. Type `stop` to deactivate automation.

## 🔌 API Endpoints
*See source code for full details.*
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- **Chats**: `/api/chats` (CRUD)
- **Groups**: `/api/groups` (CRUD + members)
- **Classes**: `/api/classes` (Admin only)
- **Automation**: `/api/automation/request`, `/api/automation/pending`, etc.

## 🗄️ Database Schema
- **users**, **chats**, **groups**, **group_members**, **messages**, **message_status**
- **classes**, **class_cr_mapping**
- **automation_config**, **automation_target_classes**, **automation_keywords**

## 🏗️ Architecture Highlights
- Socket.io manages WebSocket connections (connect, disconnect, join_chat, send_message, etc.) with JWT auth.
- Keyword detection service uses fuzzy matching for automation routing.

## 🔮 Future Enhancements
- File/image sharing & Voice/video calls
- Push notifications & Message search
- Message encryption
- Mobile app (React Native)

## 🐛 Troubleshooting
**Database connection error:** Ensure MySQL is running and verify credentials in `.env`.
**Socket connection error:** Check if backend is running and verify CORS settings.
**Frontend build errors:** Delete `.next` folder and rebuild, or clear npm cache.

## 🚧 Project Status
**Under Active Development** - We are currently refining the real-time sockets and training the AI automation bot to recognize a wider array of natural language forwarding commands.