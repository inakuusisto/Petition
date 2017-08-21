DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
    id SERIAL primary key,
    user_id integer REFERENCES users(id),
    age INTEGER,
    city VARCHAR(100),
    url TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);


SELECT * FROM user_profiles;
