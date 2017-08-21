DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL primary key,
    user_id integer REFERENCES users(id),
    signature TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);


SELECT * FROM signatures;
