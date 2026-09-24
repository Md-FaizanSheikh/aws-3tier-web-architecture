CREATE DATABASE companydb;

USE companydb;

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL
);

INSERT INTO employees (name, department)
VALUES
('Rahul Sharma', 'IT'),
('Priya Patil', 'HR'),
('Amit Verma', 'Finance');