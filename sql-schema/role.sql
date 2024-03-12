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
    ('Professor', 511, 'The professor incharge of the club'),
    ('President', 127, 'The president of the club'),
    ('Treasurer', 31, 'The treasurer of the club'),
    ('Member', 15, 'A regular member of the club'),
    ('Volunteer', 1, 'A volunteer for the club');

-- PERMISSIONS
-- 1 - View Messages
-- 2 - Update Group Details
-- 4 - Add Group Member
-- 8 - Create Group
-- 16 - Delete Group
-- 32 - Update Club Details
-- 64 - Add Club Member
-- 128 - Create Club
-- 256 - Delete Club