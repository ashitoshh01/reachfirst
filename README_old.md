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
