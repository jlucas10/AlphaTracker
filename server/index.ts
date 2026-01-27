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
        console.log("📥 Received trade data:", req.body);

        const { ticker, entry_price, shares, trade_type, setup } = req.body;

        // Validate
        if (!ticker || !entry_price || !shares) {
            console.log("❌ Validation failed. Missing fields.");
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        // --- THE MISSING PART: INSERT INTO DATABASE ---
        const newTrade = await pool.query(
            "INSERT INTO trades (ticker, entry_price, shares, trade_type, setup) VALUES($1, $2, $3, $4, $5) RETURNING *",
            [ticker, entry_price, shares, trade_type, setup]
        );

        console.log("✅ Trade saved to DB:", newTrade.rows[0]);
        res.json(newTrade.rows[0]);

    } catch (err) {
        console.error("❌ Error saving trade:", err);
        res.status(500).send("Server Error");
    }
});

app.get("/trades", async (req: Request, res: Response) => {
    try {
        const allTrades = await pool.query("SELECT * FROM trades ORDER BY created_at DESC");
        res.json(allTrades.rows);
    } catch(err) {
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