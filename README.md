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

