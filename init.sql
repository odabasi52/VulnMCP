-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL
);

-- Create flag table
CREATE TABLE IF NOT EXISTS flag (
    id INT PRIMARY KEY,
    flag VARCHAR(255) NOT NULL
);

-- Insert users data
INSERT INTO users (id, name, department) VALUES
(1, 'Joe', 'Computer Science'),
(2, 'Matt', 'Electrical Engineer'),
(3, 'Anna', 'Biomedical Engineer'),
(4, 'Carrie', 'Political Science'),
(5, 'Saul', 'Law');

-- Insert flag data
INSERT INTO flag (id, flag) VALUES
(1, 'VULNMCP{Th1sIsTheDBFlag}');
