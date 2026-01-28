# AlphaTracker 📈

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![React](https://img.shields.io/badge/react-%5E18.2.0-blue)

**AlphaTracker** is a high-performance, full-stack day trading journal designed for speed and data integrity. Built on the PERN stack, it allows traders to log, track, and analyze their trade performance with sub-100ms latency.

## 🚀 Live Demo
[View Live Demo](https://alphatracker.demo) ---

## 🏗 Architecture & Tech Stack

AlphaTracker utilizes a microservices-based architecture deployed on **Vercel**, separating the client-side dashboard from the server-side logic to ensure security and scalability.

### **The Stack (PERN)**
* **Frontend:** [React.js](https://reactjs.org/) (Hooks, Context API)
* **Backend:** [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) (Serverless)
* **External Data:** [Finnhub API](https://finnhub.io/) (Real-time stock pricing)

---

## ✨ Key Features

* **⚡ High-Performance CRUD:** Optimized backend logic enables trade logging and retrieval with **<100ms latency**.
* **🔒 Secure Proxy Server:** Custom server-side proxy routes handle all interactions with the Finnhub API. This architecture strictly prevents API key exposure on the client-side.
* **🗄️ Normalized Data Schema:** A fully normalized relational schema on Neon ensures zero data redundancy and maintains ACID compliance for complex transaction records.
* **🌍 Real-Time Market Data:** Seamless integration with financial APIs to pull live price context for every trade logged.

---

## 🛠 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v16+)
* npm or yarn
* PostgreSQL database URI (local or Neon)

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/yourusername/alphatracker.git](https://github.com/yourusername/alphatracker.git)
    cd alphatracker
    ```

2.  **Install dependencies** (Root directory handles both via workspaces, or install separately)
    ```sh
    cd client && npm install
    cd ../server && npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the `/server` directory:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb
    FINNHUB_API_KEY=your_finnhub_key_here
    CLIENT_URL=http://localhost:3000
    ```

4.  **Run the App**
    * **Server:** `cd server && npm start`
    * **Client:** `cd client && npm start`

---

## 🧩 Database Schema

The database is designed with normalization in mind to handle scale. Key tables include:
* `users` (Auth & Profile)
* `trades` (Core transaction data)
* `assets` (Ticker symbols and sector info)

*(Optional: Add a screenshot of your ER Diagram here)*

---

## 🔮 Future Roadmap

* [ ] Implementation of WebSocket for live P&L updates.
* [ ] Advanced charting using Recharts or D3.js.
* [ ] OAuth 2.0 integration (Google/GitHub Login).

## 📬 Contact

**Josiah Lucas**
* [LinkedIn](https://linkedin.com/in/yourprofile)
* [GitHub](https://github.com/yourusername)
