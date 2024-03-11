-- STUDENT schema
CREATE TABLE IF NOT EXISTS student (
    user_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    dept VARCHAR(3) NOT NULL,
    designation VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);