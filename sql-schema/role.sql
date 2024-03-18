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
    ('Professor', 127, 'The professor incharge of the club'),
    ('President', 63, 'The president of the club'),
    ('Treasurer', 31, 'The treasurer of the club'),
    ('Member', 15, 'A regular member of the club'),
    ('Volunteer', 0, 'A volunteer for the club');

-- PERMISSIONS
-- 1 - Update Group Details
-- 2 - Add Group Member
-- 4 - Create Group
-- 8 - Delete Group
-- 16 - Update Club Details
-- 32 - Add Club Member
-- 64 - Delete Club

-- PERMISSION STRINGS
-- Professor - 1111111
-- President - 0111111
-- Treasurer - 0011111
-- Member    - 0001111
-- Volunteer - 0000000