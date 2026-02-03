import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db";
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Ensuring we use 5001

// Middleware
app.use(cors());
app.use(express.json());

// 1. Test Route (GET)
app.get("/", async (req: Request, res: Response) => {
    console.log("🔔 A request just hit the root route!");
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ Database query successful");
        res.send(`AlphaTracker API is running 🚀 DB Time: ${result.rows[0].now}`);
    } catch (err) {
        console.error("❌ Database Error:", err);
        res.status(500).send("Database connection error");
    }
});

// 2. Create Trade Route (POST) - This was the broken part
app.post("/trades", async (req: Request, res: Response) => {
    try {
        // We now expect 'user_id' in the body
        const { ticker, entry_price, shares, trade_type, setup, user_id } = req.body;

        // Add user_id to the SQL query
        const newTrade = await pool.query(
            "INSERT INTO trades (ticker, entry_price, shares, trade_type, setup, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [ticker, entry_price, shares, trade_type, setup, user_id]
        );

        res.json(newTrade.rows[0]);
    } catch (err) {
        console.error(err); // Log error
        res.status(500).send("Error saving trade");
    }
});

app.get("/trades", async (req: Request, res: Response) => {
    try {
        const userId = req.query.user_id; // Read the ID from the URL

        if (!userId) {
            // If no ID is provided, return an empty list (Security)
            return res.json([]);
        }

        const result = await pool.query(
            "SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.delete("/trades/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM trades WHERE trade_id = $1", [id]);
        res.json({message: "Trade deleted"});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

//Get Real-Time Stock Prices
app.get("/api/price/:ticker", async (req: Request, res: Response) => {
    try {
        const { ticker } = req.params;
        const apiKey = process.env.FINNHUB_KEY;

        // Call Finnhub API
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);

        // Finnhub returns 'c' for Current Price. If it's 0, the ticker might be wrong.
        const price = response.data.c;

        res.json({ price });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching price");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});