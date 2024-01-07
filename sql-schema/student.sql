CREATE TABLE student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNIQUE,
    email VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    about VARCHAR(100) DEFAULT NULL,
    profile_pic_path VARCHAR(255) DEFAULT NULL
);