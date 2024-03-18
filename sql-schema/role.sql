-- ROLE schema
CREATE TABLE IF NOT EXISTS role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    permissions INT DEFAULT 0,
    description VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserting pre-defined roles
INSERT INTO role (name, permissions, description)
VALUES 
    ('Professor', 255, 'The professor incharge of the club'),
    ('President', 127, 'The president of the club'),
    ('Treasurer', 63, 'The treasurer of the club'),
    ('Member', 31, 'A regular member of the club'),
    ('Volunteer', 1, 'A volunteer for the club');

-- PERMISSIONS
-- 1 - Send Message (inside group)
-- 2 - Update Group Details
-- 4 - Add Group Member
-- 8 - Create Group
-- 16 - Delete Group
-- 32 - Update Club Details
-- 64 - Add Club Member
-- 128 - Delete Club

-- PERMISSION STRINGS
-- Professor - 11111111
-- President - 01111111
-- Treasurer - 00111111
-- Member    - 00011111
-- Volunteer - 00000001