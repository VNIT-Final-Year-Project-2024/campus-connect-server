-- -- Create the database
-- CREATE DATABASE IF NOT EXISTS `campus-connect`;

-- -- Don't skip DNS name resolution
-- SET GLOBAL skip_name_resolve = OFF;

-- -- Create new user
-- CREATE USER 'mayur'@'mysql' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON `campus-connect`.* TO 'mayur'@'mysql';
-- FLUSH PRIVILEGES;

-- Use the database
USE campus-connect;

-- Create the tables
source /docker-entrypoint-initdb.d/user.sql
source /docker-entrypoint-initdb.d/faculty.sql
source /docker-entrypoint-initdb.d/student.sql