-- STUDENT schema
CREATE TABLE IF NOT EXISTS student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    dept VARCHAR(3) NOT NULL
);