-- FACULTY schema
CREATE TABLE faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    dept VARCHAR(3) NOT NULL,
    designation VARCHAR(255) DEFAULT NULL
);