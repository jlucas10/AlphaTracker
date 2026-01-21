import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
    // If we are in production, use the provided DATABASE_URL.
    // If not, look for the local variables (DB_USER, etc.)
    connectionString: process.env.DATABASE_URL
        ? process.env.DATABASE_URL
        : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

    ssl: isProduction ? { rejectUnauthorized: false } : false
});

export default pool;