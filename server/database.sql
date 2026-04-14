CREATE DATABASE alphatracker;

-- This is the "Parent" table
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,       -- Clerk User ID
    account_name VARCHAR(100) NOT NULL,  -- e.g., "Topstep $50k"
    account_type VARCHAR(50) DEFAULT 'PROP_FIRM', -- 'CASH', 'MARGIN', 'PROP_FIRM'
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 3: CREATE TRADES TABLE
-- This is the "Child" table. It links to accounts via account_id.
CREATE TABLE trades (
    trade_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,       -- Clerk User ID
    ticker VARCHAR(20) NOT NULL,         -- e.g., "NQ", "ES", "AAPL"
    entry_price DECIMAL(15, 2) NOT NULL,
    exit_price DECIMAL(15, 2),
    shares INT NOT NULL,                 -- For futures, this is "Contracts"
    trade_type VARCHAR(10) CHECK (trade_type IN ('LONG', 'SHORT')),
    asset_type VARCHAR(20) DEFAULT 'FUTURE', 
    pnl DECIMAL(15, 2),                  -- Realized Profit/Loss
    setup VARCHAR(50),                   -- e.g., "Silver Bullet", "FVG"
    trade_screenshot_url TEXT,           -- S3 URL will go here
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 4: CREATE DAILY JOURNAL TABLE
-- Stores psychological data and daily bias
CREATE TABLE daily_journal (
    journal_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    daily_notes TEXT,
    mood VARCHAR(50),                    -- "Neutral", "Flow", "Tilt"
    screenshot_url TEXT,                 -- Daily recap chart
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)                -- Only one entry per user per day
);

-- STEP 5: OPTIMIZATION (Indexing)
-- This makes your "Account Deep Dive" and "Calendar" views load instantly
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_journal_user_date ON daily_journal(user_id, date);