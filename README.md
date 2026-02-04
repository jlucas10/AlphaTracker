# AlphaTracker 📈

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

**AlphaTracker** is a high-performance, full-stack trading journal designed for serious traders. Built on the **PERN stack** with **TypeScript**, it provides a secure, multi-user environment to log, track, and visualize trade performance with real-time market data integration.

## 🚀 Live Demo
[**View Live Demo**](https://alpha-tracker-ui.vercel.app/)

---

## 🏗 Architecture & Tech Stack

AlphaTracker utilizes a **client-server architecture** deployed on Vercel. It leverages **Clerk** for secure identity management and **Neon (Serverless Postgres)** for scalable data persistence.

### **The Stack**
* **Frontend:** React (Vite), TypeScript, Tailwind CSS, Recharts
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL (Neon Serverless)
* **Auth:** Clerk (JWT-based Authentication)
* **External Data:** Finnhub API (Real-time stock pricing)

---

## ✨ Key Features

* **⚡ High-Performance CRUD:** Optimized backend logic enables trade logging and retrieval with <100ms latency.
* **🔒 Secure Authentication:** Multi-user support implemented via **Clerk**, providing isolated data environments for every user (Row-Level logic).
* **🌍 Real-Time Market Data:** Server-side proxy routes securely fetch live pricing from the **Finnhub API** without exposing API keys to the client.
* **📊 Dynamic Visualizations:** Interactive portfolio allocation charts built with **Recharts** that update instantly as trades are logged.
* **🛡 Type Safety:** Full **TypeScript** implementation across Frontend and Backend ensures code reliability and fewer runtime errors.

---

## 🛠 Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL database URI (Neon recommended)
* Clerk Account & Finnhub Account

### Installation

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/yourusername/alphatracker.git](https://github.com/yourusername/alphatracker.git)
    cd alphatracker
    ```

2.  **Install Dependencies**
    ```bash
    # Install Server Deps
    cd server && npm install
    
    # Install Client Deps
    cd ../client && npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in **server**:
    ```env
    PORT=5001
    DATABASE_URL=postgresql://user:pass@endpoint.neon.tech/neondb
    FINNHUB_KEY=your_finnhub_key
    ```
    Create a `.env` file in **client**:
    ```env
    VITE_API_URL=http://localhost:5001
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
    ```

4.  **Run the App**
    ```bash
    # Terminal 1 (Server)
    cd server && npm run dev
    
    # Terminal 2 (Client)
    cd client && npm run dev
    ```

---

## 🧩 Database Schema

The database is designed with a single-table schema optimized for high-speed retrieval and multi-tenancy.

* **trades:** Stores ticker, price, shares, type, setup, and links to the Clerk `user_id`.

---

## 📬 Contact

**Josiah Lucas** [LinkedIn](#https://www.linkedin.com/in/josiahjlucas/) | [GitHub](#https://github.com/jlucas10)
