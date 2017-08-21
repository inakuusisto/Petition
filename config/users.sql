DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);


SELECT * FROM users;
