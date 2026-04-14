import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ==========================================
// 1. EXTERNAL API ROUTE (FINNHUB)
// ==========================================
app.get("/api/price/:ticker", async (req: Request, res: Response) => {
    try {
        const { ticker } = req.params;
        const apiKey = process.env.FINNHUB_KEY;
        const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`
        );
        if (response.data && response.data.c) {
            res.json({ price: response.data.c });
        } else {
            res.status(404).json({ error: "Ticker not found" });
        }
    } catch (error) {
        console.error("Finnhub API Error:", error);
        res.status(500).json({ error: "Failed to fetch price" });
    }
});

// ==========================================
// 2. ACCOUNTS ROUTES (NEW)
// ==========================================
app.get("/accounts", async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id;
        if (!userId) return res.json([]);
        const result = await pool.query(
            "SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.post("/accounts", async (req: Request, res: Response) => {
    try {
        const { user_id, account_name, account_type, balance } = req.body;
        const newAccount = await pool.query(
            "INSERT INTO accounts (user_id, account_name, account_type, balance) VALUES ($1, $2, $3, $4) RETURNING *",
            [user_id, account_name, account_type || 'CASH', balance || 0.00]
        );
        res.json(newAccount.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving account");
    }
});

app.delete("/accounts/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Perform the delete
        const result = await pool.query(
            "DELETE FROM accounts WHERE account_id = $1 RETURNING *",
            [id]
        );

        // If no rows were deleted, the account didn't exist
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        // Return a clean JSON success message
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        // Narrow the type so TS knows it has a .message property
        if (err instanceof Error) {
            console.error("Database error during delete:", err.message);
        } else {
            console.error("An unknown error occurred during delete");
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// ==========================================
// 3. DAILY JOURNAL ROUTES (NEW Notion-Style)
// ==========================================
app.get("/journal", async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id;
        if (!userId) return res.json([]);
        const result = await pool.query(
            "SELECT * FROM daily_journal WHERE user_id = $1 ORDER BY date DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// This uses an "UPSERT" - if a journal for today exists, it updates it. If not, it creates it.
app.post("/journal", async (req: Request, res: Response) => {
    try {
        const { user_id, date, daily_notes, mood, screenshot_url } = req.body;
        const newJournal = await pool.query(
            `INSERT INTO daily_journal (user_id, date, daily_notes, mood, screenshot_url) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (user_id, date) 
       DO UPDATE SET daily_notes = $3, mood = $4, screenshot_url = $5 
       RETURNING *`,
            [user_id, date, daily_notes, mood, screenshot_url]
        );
        res.json(newJournal.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving journal entry");
    }
});

// ==========================================
// 4. TRADES ROUTES (UPGRADED)
// ==========================================
app.get("/trades", async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id;
        const category = req.query.category; // We now filter by category!

        if (!userId) return res.json([]);

        let query = "SELECT * FROM trades WHERE user_id = $1";
        const params: any[] = [userId];

        if (category) {
            query += " AND trade_category = $2";
            params.push(category);
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.post("/trades", async (req: Request, res: Response) => {
    try {
        const {
            ticker, entry_price, shares, trade_type, setup, user_id,
            account_id, trade_category, asset_type, pnl, exit_price, trade_screenshot_url,
            created_at
        } = req.body;

        // 1. Save the trade execution
        const newTrade = await pool.query(
            `INSERT INTO trades
             (ticker, entry_price, shares, trade_type, setup, user_id, account_id, trade_category, asset_type, pnl, exit_price, trade_screenshot_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13, CURRENT_TIMESTAMP)) RETURNING *`,
            [
                ticker, entry_price, shares, trade_type, setup, user_id,
                account_id || null,
                trade_category || 'INVESTMENT',
                asset_type || 'STOCK',
                pnl || null,
                exit_price || null,
                trade_screenshot_url || null,
                created_at || null
            ]
        );

        // 2. Automatically update the linked Account's Cash Balance
        if (account_id) {
            if (trade_category === 'INVESTMENT') {
                // For Investments: Deduct the total cost from Cash (Buying Power)
                const totalCost = Number(entry_price) * Number(shares);
                await pool.query(
                    `UPDATE accounts SET balance = balance - $1 WHERE account_id = $2`,
                    [totalCost, account_id]
                );
            } else if (trade_category === 'DAY_TRADE' && pnl) {
                // For Day Trades: Add/Subtract the realized P&L directly
                await pool.query(
                    `UPDATE accounts SET balance = balance + $1 WHERE account_id = $2`,
                    [Number(pnl), account_id]
                );
            }
        }

        res.json(newTrade.rows[0]);
    } catch (err) {
        console.error("Error in /trades POST:", err);
        res.status(500).send("Error saving trade");
    }
});

app.delete("/trades/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // 1. Get the trade details first so we know what to refund
        const trade = await pool.query("SELECT * FROM trades WHERE trade_id = $1", [id]);

        if (trade.rows.length === 0) return res.status(404).send("Trade not found");

        const { account_id, trade_category, entry_price, shares, pnl } = trade.rows[0];

        // 2. Perform the "Refund" logic if linked to an account
        if (account_id) {
            if (trade_category === 'INVESTMENT') {
                // Refund the cost to cash balance
                const cost = Number(entry_price) * Number(shares);
                await pool.query("UPDATE accounts SET balance = balance + $1 WHERE account_id = $2", [cost, account_id]);
            } else if (trade_category === 'DAY_TRADE' && pnl) {
                // Remove the P&L from the balance
                await pool.query("UPDATE accounts SET balance = balance - $1 WHERE account_id = $2", [Number(pnl), account_id]);
            }
        }

        // 3. Delete the trade
        await pool.query("DELETE FROM trades WHERE trade_id = $1", [id]);

        res.json({ message: "Trade deleted and balance updated" });
    } catch (err) {
        console.error("Error in /trades DELETE:", err);
        res.status(500).send("Error deleting trade");
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});