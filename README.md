# ReachFirst 📱

ReachFirst is a WhatsApp-like web messaging application designed for educational institutions.  
It provides real-time chat, group messaging, and optional intelligent automation for structured academic communication — without copying WhatsApp’s UI.

---

## 🚀 Key Features

### 💬 Core Chat Functionality
- One-to-one real-time messaging
- Group chats
- Create and manage groups
- Message timestamps
- Clean, modern, original UI
- WhatsApp-like functionality (not UI)

---

## 🔐 Role-Based Login
Users can log in as:
- Student
- Teacher

Roles do **not** restrict normal chatting.  
They are used only for automation, permissions, and dashboards.

---

## 🧠 Intelligent Automation (Optional Layer)

Automation is an add-on feature and works only when enabled by a teacher.

- Messages are scanned for generic intent-based keywords
- Messages are forwarded only to selected Class Representatives (CRs)
- Students do not receive automated messages directly

### Example detected phrases:
- “Send this message to respective classes”
- “Please convey this message to your classes”
- “Inform your class representatives”
- “Important message for students”

### Automation commands:
start -> Enable automation
stop -> Disable automation


---

## 👨‍🎓 Class Representative (CR) System
- CR is a student with special responsibility
- Each class has one or more CRs
- CRs receive automated messages
- CRs manually convey messages to their class

---

## 🔒 Privacy & Security
- Admin can view chats only where added
- No global chat access
- Normal chats remain private
- Automation requires explicit teacher action

---

## 🛠 Tech Stack

### Frontend
- Next.js

### Backend
- Node.js
- Express.js

### Database
- MySQL

---

## 🎯 Project Goal
To build a full-fledged WhatsApp-like messaging platform enhanced with a smart academic automation layer that ensures structured, controlled, and reliable communication in educational institutions.

---

## 📌 Note
- Functionality inspired by WhatsApp
- UI is original and not copied
- Focus on clean design and scalability

---

## 🚧 Project Status
Under active development
