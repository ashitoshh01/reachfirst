# Quick Start Guide

## Initial Setup (One Time)

### 1. Database Setup

```bash
# Initialize the MySQL database
sudo mysql < /home/ashitosh/Desktop/ReachFirst/reachfirst/database/schema.sql
```

### 2. Configure Backend

```bash
cd /home/ashitosh/Desktop/ReachFirst/reachfirst/backend

# Edit .env file and update:
# - DB_PASSWORD (your MySQL root password)
# - JWT_SECRET (can leave as is for development)
```

## Running the Application

### Terminal 1 - Backend Server

```bash
cd /home/ashitosh/Desktop/ReachFirst/reachfirst/backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📡 Socket.io server ready  
✓ Database connected successfully
```

### Terminal 2 - Frontend Server

```bash
cd /home/ashitosh/Desktop/ReachFirst/reachfirst/frontend
npm run dev
```

You should see:
```
▲ Next.js 16.1.1
- Local: http://localhost:3000
```

## First Usage

1. Open http://localhost:3000
2. Click "Sign up"
3. Create your first account (choose any role)
4. You'll be automatically logged in and redirected to the chat page

## Creating Test Users

To test messaging, you need multiple users:

1. Open an incognito/private browser window
2. Go to http://localhost:3000/signup
3. Create a second user with a different email
4. Now you can message between the two users!

## Testing the Automation System

The automation system requires some database setup:

### 1. Create a Class

```sql
sudo mysql academic_messaging -e "INSERT INTO classes (name, description, created_by) VALUES ('Computer Science 101', 'Intro to CS', 1);"
```

### 2. Assign a Student as CR

First, find a student user ID, then:

```sql
sudo mysql academic_messaging -e "
INSERT INTO class_cr_mapping (class_id, user_id) VALUES (1, [STUDENT_USER_ID]);
UPDATE users SET is_cr = TRUE WHERE id = [STUDENT_USER_ID];
"
```

Replace `[STUDENT_USER_ID]` with actual student's ID.

### 3. Request Automation (via API)

```bash
# Get teacher's token by logging in as teacher
# Then request automation:

curl -X POST http://localhost:5000/api/automation/request \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetClasses": [1]}'
```

### 4. Approve as Admin

```bash
curl -X PUT http://localhost:5000/api/automation/1/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Use Automation

As the teacher, in any chat, type:
- `start` - Activates automation
- "Send this message to respective classes" - Gets routed to CRs
- `stop` - Deactivates automation

## Troubleshooting

**"Database connection failed"**
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `backend/.env`  
- Ensure database was created: `sudo mysql -e "SHOW DATABASES;"`

**"Port 5000 already in use"**
- Change `BACKEND_PORT` in `backend/.env`
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

**"Cannot find module"**
- Run `npm install` in both frontend and backend directories

**Frontend won't start**
- Delete `frontend/.next` folder
- Run `npm run dev` again

## API Endpoints Reference

All endpoints require `Authorization: Bearer TOKEN` header except login/register.

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get token
- `GET /api/auth/me` - Current user

### Messaging
- `GET /api/chats` - Your chats
- `POST /api/chats` - Create chat with `{otherUserId}`
- `POST /api/chats/:id/messages` - Send message

### Groups  
- `POST /api/groups` - Create with `{name, description}`
- `GET /api/groups` - Your groups
- `POST /api/groups/:id/members` - Add with `{userId}`

## Next Steps

Now that everything is running, you can:

1. **Explore the UI** - Login, send messages, create chats
2. **Test real-time features** - Open two browsers, send messages
3. **Build additional UI** - Admin dashboard, Teacher controls, etc.
4. **Customize** - Add your own features!

See [README.md](README.md) for complete documentation.
