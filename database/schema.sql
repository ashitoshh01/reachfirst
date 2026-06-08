
CREATE DATABASE IF NOT EXISTS academic_messaging;
USE academic_messaging;

-- USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('student','teacher','admin') NOT NULL,
    division VARCHAR(50) NOT NULL,
    college_year TINYINT NOT NULL,
    is_cr BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    bio TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CLASSES
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- CHATS (1-1)
CREATE TABLE chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GROUPS
CREATE TABLE `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT,
    is_teacher_group BOOLEAN DEFAULT FALSE,
    is_class_group BOOLEAN DEFAULT FALSE,
    class_teacher_id INT,
    automation_enabled BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- GROUP MEMBERS
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    user_id INT,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MESSAGES
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    chat_id INT,
    group_id INT,
    content TEXT,
    message_type ENUM('text','image','file') DEFAULT 'text',
    is_automated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);

-- MESSAGE STATUS
CREATE TABLE message_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT,
    user_id INT,
    status ENUM('sent','delivered','read') DEFAULT 'sent',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CLASS CR MAPPING
CREATE TABLE class_cr_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    user_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AUTOMATION CONFIG
CREATE TABLE automation_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    is_active BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- AUTOMATION TARGET CLASSES
CREATE TABLE automation_target_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automation_id INT,
    class_id INT,

    FOREIGN KEY (automation_id) REFERENCES automation_config(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- AUTOMATION KEYWORDS
CREATE TABLE automation_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEFAULT KEYWORDS
INSERT INTO automation_keywords (keyword) VALUES
('Send this message to respective classes'),
('Please convey this message to your classes'),
('Inform your class representatives'),
('This message is for students'),
('Kindly circulate this information'),
('Please notify your class'),
('Ensure students are informed'),
('Convey the following message'),
('Important announcement for students'),
('notify students'),
('inform the class'),
('circulate to students');

-- AUTOMATION FORWARD LOG
CREATE TABLE automation_forwarded_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_group_id INT,
    source_message_id INT,
    target_group_id VARCHAR(50),
    forwarded_message_id INT,
    forwarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
