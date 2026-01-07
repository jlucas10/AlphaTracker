CREATE DATABASE alphatracker;

CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       username VARCHAR(255) UNIQUE NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trades (
                        trade_id SERIAL PRIMARY KEY,
                        user_id INT REFERENCES users(user_id),
                        ticker VARCHAR(10) NOT NULL,
                        entry_price DECIMAL(10, 2) NOT NULL,
                        exit_price DECIMAL(10, 2),
                        shares INT NOT NULL,
                        trade_type VARCHAR(10) CHECK (trade_type IN ('LONG', 'SHORT')),
                        status VARCHAR(10) DEFAULT 'OPEN',
                        setup VARCHAR(50), -- e.g., "Gap Up", "Reversal"
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);