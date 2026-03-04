# AlphaTracker 📈

![Node](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)
![React](https://img.shields.io/badge/react-%5E18.2.0-blue)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue)

**AlphaTracker** is a premium, full-stack trading journal and portfolio management suite. Designed for professional traders, it combines high-performance data logging with visual chart analysis and automated capital management.

## 🚀 Live Demo
[View AlphaTracker Live](https://alpha-tracker-w8vu.vercel.app)

---

## ✨ Advanced Features

* **📊 Dynamic Capital Sync:** Automated backend triggers that calculate and update brokerage balances in real-time as trades are logged or deleted.
* **📝 Notion-Style Journal:** A rich-text trading journal with integrated "Mood Tracking" and market observation logs.
* **📸 Hybrid Visual Logs:** Supports direct screenshot uploads via **Cloudinary API** and instant embedding of **TradingView** chart links.
* **🏦 Multi-Account Management:** Track capital across various sources (Prop Firms, Personal Cash, Crypto) in a unified interface.
* **🔒 Enterprise Auth:** Secure, modern authentication powered by **Clerk** with user-specific data isolation.
* **🎨 Premium UI/UX:** A minimalist "Light Mode" interface built with **Tailwind CSS**, optimized for long-session readability and data clarity.

---

## 🏗 Tech Stack

### **Frontend**
* **React.js** (Functional Components, Hooks)
* **Tailwind CSS** (Custom theme & Responsive Design)
* **Recharts** (Portfolio allocation & Data visualization)
* **Clerk Auth** (Identity & Session management)

### **Backend**
* **Node.js & Express** (RESTful API)
* **PostgreSQL (Neon)** (Relational data & ACID compliance)
* **Cloudinary SDK** (Image transformation & Hosting)
* **Finnhub API** (Market data proxy)

---

## 🗄️ Database Schema (Normalized)

* **Users:** Managed via Clerk with relational mapping to trade data.
* **Accounts:** Stores capital balances and brokerage types.
* **Trades:** Relational records linking executions to specific accounts and time zones.
* **Journal:** Daily recap logs with associated screenshot URLs and market sentiment data.

---

## 🛠 Setup & Installation

1. **Clone & Install**
```bash
git clone [https://github.com/jlucas10/AlphaTracker.git](https://github.com/jlucas10/AlphaTracker.git)
cd client && npm install
cd ../server && npm install
```

### 2. Environment Configuration

Create a .env file in the **/server** directory:

DATABASE_URL=your_neon_postgres_url
CLERK_SECRET_KEY=your_clerk_key
FINNHUB_API_KEY=your_finnhub_key

Create a .env file in the **/client** directory:

VITE_CLOUDINARY_CLOUD_NAME=your_name
VITE_CLOUDINARY_UPLOAD_PRESET=alpha_tracker

### 3. Run Dev Environment

* **Server:** `npm run dev` (Port 5001)
* **Client:** `npm run dev` (Port 5173)

---

## 📬 Contact

**Josiah Lucas**
* [LinkedIn](https://www.linkedin.com/in/josiahjlucas/)
* [GitHub](https://github.com/jlucas10)
