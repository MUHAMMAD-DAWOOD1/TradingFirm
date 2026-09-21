# 🏛️ Nexus AI Institutional Trading Platform

A prop-firm grade algorithmic trading terminal with Gemini Multi-Agent AI consensus, real-time institutional price feeds, capital tailoring, and audited execution.

---

## 🚀 Quick Setup Guide for Friends (نیا لیپ ٹاپ سیٹ اپ)

Follow these simple steps to run the platform on your laptop:

### 1. Clone & Navigate
```bash
git clone https://github.com/MUHAMMAD-DAWOOD1/TradingFirm.git
cd TradingFirm
```

### 2. Configure Your Personal Gemini API Key
Each user uses their own isolated quota and local database:
```bash
# Copy example configuration to active .env
cp .env.example .env
```
Open `.env` in any text editor and paste your free Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/))*

---

### 3. Backend Setup & Run (Python)
Ensure Python 3.10+ is installed:
```bash
# Install required Python dependencies
pip install fastapi uvicorn pydantic yfinance reportlab pandas python-dotenv websockets

# Start the Backend Server (Port 8000)
uvicorn backend.server:app --reload --port 8000
```
Backend will automatically initialize your personal, isolated SQLite database at `backend/nexus_trading.db`. Your trades and wallets will stay local to your computer and will never overwrite anyone else's data.

---

### 4. Frontend Setup & Run (React + Vite)
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **http://localhost:5173/** (or the URL shown in the terminal).

---

## 💎 Key Features
- **Isolated Multi-Wallets**: Create custom demo balances ($100, $500, $10,000, etc.) with automatic memory persistence on page reload.
- **Real-Time Live Market Pricing**: Binance spot crypto pairs (`BTCUSDT`, `ETHUSDT`, `SOLUSDT`), Gold Spot (`XAUUSD`), and Forex (`EURUSD`).
- **AI Agent Intelligence**: 8-Agent quantitative committee with native Roman Urdu Risk Officer verdicts.
- **Broker-Grade Trade History**: Filter closed trades by Today, Last 7D, Last 30D, All Time, or Custom Date Ranges with live Net PnL, Win Rate %, and Profit Factor.
- **Export & Audit Center**: Download authentic prop-firm records in **Excel (.CSV)** and **Authenticated PDF** (Trades Ledger, AI Decisions Journal, and Master Statement).
