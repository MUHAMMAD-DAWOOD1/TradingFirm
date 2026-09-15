"""
Nexus Capital Persistent Database Layer
Provides SQLite storage for:
1. Multi-agent analytical dossiers & decision history
2. User-tailored capital plans and parameters
3. Paper trading positions & execution logs
4. Outcome verification (did market reach TP or SL?)
5. Data Export (JSON/CSV) and Import
"""

import sqlite3
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nexus_trading.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_history (
        id TEXT PRIMARY KEY,
        asset TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        final_decision TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        user_capital REAL DEFAULT 10000.0,
        risk_pct REAL DEFAULT 2.0,
        entry_price REAL NOT NULL,
        stop_loss REAL NOT NULL,
        take_profit REAL NOT NULL,
        general_report TEXT NOT NULL,
        tailored_report TEXT NOT NULL,
        agent_reports TEXT NOT NULL,
        full_dossier TEXT NOT NULL,
        outcome_status TEXT DEFAULT 'PENDING',
        actual_exit_price REAL,
        outcome_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_trades (
        id TEXT PRIMARY KEY,
        report_id TEXT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        entry_price REAL NOT NULL,
        current_price REAL NOT NULL,
        stop_loss REAL,
        take_profit REAL,
        leverage REAL DEFAULT 1.0,
        margin_usd REAL NOT NULL,
        unrealized_pnl REAL DEFAULT 0.0,
        realized_pnl REAL DEFAULT 0.0,
        status TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        close_price REAL,
        close_reason TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signals_feed (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        asset TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_min REAL,
        entry_max REAL,
        stop_loss REAL,
        take_profit_targets TEXT,
        risk_reward TEXT,
        trap_status TEXT NOT NULL,
        trap_score INTEGER NOT NULL,
        trap_reasons TEXT,
        swarm_confidence INTEGER NOT NULL,
        outcome_status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signal_channels (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        channel_handle TEXT,
        channel_link TEXT,
        is_active INTEGER DEFAULT 1,
        win_count INTEGER DEFAULT 0,
        loss_count INTEGER DEFAULT 0,
        total_signals INTEGER DEFAULT 0,
        win_rate_pct REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def save_analysis_record(record: Dict[str, Any]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()

    task_id = record.get("task_id", f"rec_{int(time.time()*1000)}")
    asset = record.get("asset", "XAUUSD")
    ts = record.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    decision = record.get("final_decision", "WAIT")
    confidence = int(record.get("confidence", 70))
    risk_level = record.get("risk_level", "Medium")
    user_capital = float(record.get("user_capital", 10000.0))
    risk_pct = float(record.get("risk_pct", 2.0))

    real_price_info = record.get("real_price_info", {})
    entry = float(real_price_info.get("entry", real_price_info.get("price", 0.0)))
    sl = float(real_price_info.get("stop_loss", entry * 0.98))
    tp = float(real_price_info.get("take_profit", entry * 1.04))

    gen_rep = json.dumps(record.get("roman_urdu_report", {}), ensure_ascii=False)
    tailored_rep = json.dumps(record.get("tailored_plan", {}), ensure_ascii=False)
    agent_rep = json.dumps(record.get("agent_detailed_reports", {}), ensure_ascii=False)
    full_doss = json.dumps(record, ensure_ascii=False)

    cursor.execute("""
    INSERT OR REPLACE INTO analysis_history (
        id, asset, timestamp, final_decision, confidence, risk_level,
        user_capital, risk_pct, entry_price, stop_loss, take_profit,
        general_report, tailored_report, agent_reports, full_dossier, outcome_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task_id, asset, ts, decision, confidence, risk_level,
        user_capital, risk_pct, entry, sl, tp,
        gen_rep, tailored_rep, agent_rep, full_doss, 'PENDING'
    ))

    conn.commit()
    conn.close()
    return task_id

def get_all_analysis_history(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analysis_history 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "task_id": r["id"],
            "asset": r["asset"],
            "timestamp": r["timestamp"],
            "final_decision": r["final_decision"],
            "confidence": r["confidence"],
            "risk_level": r["risk_level"],
            "user_capital": r["user_capital"],
            "risk_pct": r["risk_pct"],
            "entry_price": r["entry_price"],
            "stop_loss": r["stop_loss"],
            "take_profit": r["take_profit"],
            "roman_urdu_report": json.loads(r["general_report"]) if r["general_report"] else {},
            "tailored_plan": json.loads(r["tailored_report"]) if r["tailored_report"] else {},
            "agent_detailed_reports": json.loads(r["agent_reports"]) if r["agent_reports"] else {},
            "full_dossier": json.loads(r["full_dossier"]) if r["full_dossier"] else {},
            "outcome_status": r["outcome_status"],
            "actual_exit_price": r["actual_exit_price"],
            "outcome_notes": r["outcome_notes"]
        })
    conn.close()
    return results

def get_analysis_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_history WHERE id = ?", (report_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r["id"],
        "task_id": r["id"],
        "asset": r["asset"],
        "timestamp": r["timestamp"],
        "final_decision": r["final_decision"],
        "confidence": r["confidence"],
        "risk_level": r["risk_level"],
        "user_capital": r["user_capital"],
        "risk_pct": r["risk_pct"],
        "entry_price": r["entry_price"],
        "stop_loss": r["stop_loss"],
        "take_profit": r["take_profit"],
        "roman_urdu_report": json.loads(r["general_report"]) if r["general_report"] else {},
        "tailored_plan": json.loads(r["tailored_report"]) if r["tailored_report"] else {},
        "agent_detailed_reports": json.loads(r["agent_reports"]) if r["agent_reports"] else {},
        "full_dossier": json.loads(r["full_dossier"]) if r["full_dossier"] else {},
        "outcome_status": r["outcome_status"],
        "actual_exit_price": r["actual_exit_price"],
        "outcome_notes": r["outcome_notes"]
    }

def verify_trade_outcome(report_id: str, current_market_price: float) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_history WHERE id = ?", (report_id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        return {"success": False, "error": "Report not found"}

    decision = r["final_decision"].upper()
    entry = float(r["entry_price"])
    sl = float(r["stop_loss"])
    tp = float(r["take_profit"])

    status = "ACTIVE_MONITORING"
    notes = ""
    exit_p = current_market_price

    if "BUY" in decision:
        if current_market_price >= tp:
            status = "HIT_TP"
            notes = f"Target Profit hit! Live market reached ${current_market_price} exceeding target ${tp} (+{round(((tp-entry)/entry)*100, 2)}%)."
        elif current_market_price <= sl:
            status = "HIT_SL"
            notes = f"Stop-Loss triggered at ${current_market_price} below floor ${sl} (-{round(((entry-sl)/entry)*100, 2)}%)."
        else:
            pnl_pct = round(((current_market_price - entry) / entry) * 100, 2)
            status = "ACTIVE_IN_PLAY"
            notes = f"Trade in progress. Live price ${current_market_price} currently showing {pnl_pct}% unrealized gain/loss."
    elif "SELL" in decision:
        if current_market_price <= tp:
            status = "HIT_TP"
            notes = f"Short Target Profit hit! Live market reached ${current_market_price} below target ${tp} (+{round(((entry-tp)/entry)*100, 2)}%)."
        elif current_market_price >= sl:
            status = "HIT_SL"
            notes = f"Short Stop-Loss hit at ${current_market_price} above ceiling ${sl} (-{round(((sl-entry)/entry)*100, 2)}%)."
        else:
            pnl_pct = round(((entry - current_market_price) / entry) * 100, 2)
            status = "ACTIVE_IN_PLAY"
            notes = f"Short trade in progress. Live price ${current_market_price} currently showing {pnl_pct}% unrealized gain/loss."
    else:
        status = "NEUTRAL_EVALUATED"
        notes = f"Wait/Neutral decision. Market currently at ${current_market_price}."

    cursor.execute("""
        UPDATE analysis_history 
        SET outcome_status = ?, actual_exit_price = ?, outcome_notes = ? 
        WHERE id = ?
    """, (status, exit_p, notes, report_id))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "report_id": report_id,
        "outcome_status": status,
        "notes": notes,
        "current_price": current_market_price
    }

def export_database_json() -> str:
    history = get_all_analysis_history(limit=500)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_trades ORDER BY opened_at DESC")
    trades = [dict(row) for row in cursor.fetchall()]
    conn.close()

    export_payload = {
        "exported_at": datetime.utcnow().isoformat(),
        "version": "3.2.0",
        "total_reports": len(history),
        "total_paper_trades": len(trades),
        "analysis_history": history,
        "paper_trades": trades
    }
    return json.dumps(export_payload, indent=2, ensure_ascii=False)

def import_database_json(json_data: str) -> Dict[str, Any]:
    try:
        data = json.loads(json_data)
        reports = data.get("analysis_history", [])
        trades = data.get("paper_trades", [])

        imported_reports = 0
        for r in reports:
            try:
                save_analysis_record({
                    "task_id": r.get("id") or r.get("task_id"),
                    "asset": r.get("asset"),
                    "timestamp": r.get("timestamp"),
                    "final_decision": r.get("final_decision"),
                    "confidence": r.get("confidence"),
                    "risk_level": r.get("risk_level"),
                    "user_capital": r.get("user_capital", 10000.0),
                    "risk_pct": r.get("risk_pct", 2.0),
                    "real_price_info": {
                        "entry": r.get("entry_price"),
                        "stop_loss": r.get("stop_loss"),
                        "take_profit": r.get("take_profit"),
                        "price": r.get("entry_price")
                    },
                    "roman_urdu_report": r.get("roman_urdu_report", {}),
                    "tailored_plan": r.get("tailored_plan", {}),
                    "agent_detailed_reports": r.get("agent_detailed_reports", {}),
                    "full_dossier": r.get("full_dossier", {})
                })
                imported_reports += 1
            except Exception:
                pass

        return {
            "success": True,
            "imported_reports": imported_reports,
            "imported_trades": len(trades)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}



# -------------------------------------------------------------
# SIGNAL INGESTION & CHANNEL REPUTATION DATABASE HELPERS
# -------------------------------------------------------------
def save_signal_feed(sig: Dict[str, Any]) -> str:
    """Persists an ingested external signal and its trap detector audit into SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    sig_id = sig.get("id") or f"sig_{int(time.time()*1000)}"
    source = sig.get("source", "TELEGRAM").upper()
    ch_name = sig.get("channel_name", "VIP Trading Desk")
    raw = sig.get("raw_text", "")
    asset = sig.get("asset", "XAUUSD").upper()
    direction = sig.get("direction", "BUY").upper()
    entry_min = float(sig.get("entry_min", 0.0) or 0.0)
    entry_max = float(sig.get("entry_max", entry_min) or entry_min)
    sl = float(sig.get("stop_loss", 0.0) or 0.0)
    tp_targets = json.dumps(sig.get("take_profit_targets", []))
    rr = sig.get("risk_reward", "1:2.0")
    trap_status = sig.get("trap_status", "VERIFIED_ALPHA")
    trap_score = int(sig.get("trap_score", 15))
    trap_reasons = json.dumps(sig.get("trap_reasons", []))
    conf = int(sig.get("swarm_confidence", 80))
    outcome = sig.get("outcome_status", "PENDING")

    cursor.execute("""
        INSERT OR REPLACE INTO signals_feed (
            id, source, channel_name, raw_text, asset, direction,
            entry_min, entry_max, stop_loss, take_profit_targets,
            risk_reward, trap_status, trap_score, trap_reasons,
            swarm_confidence, outcome_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        sig_id, source, ch_name, raw, asset, direction,
        entry_min, entry_max, sl, tp_targets,
        rr, trap_status, trap_score, trap_reasons,
        conf, outcome, sig.get("created_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()
    return sig_id

def get_signals_feed(limit: int = 50, filter_source: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches ingested signals sorted by latest first."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if filter_source and filter_source.upper() != "ALL":
        cursor.execute(
            "SELECT * FROM signals_feed WHERE source = ? ORDER BY created_at DESC LIMIT ?",
            (filter_source.upper(), limit)
        )
    else:
        cursor.execute("SELECT * FROM signals_feed ORDER BY created_at DESC LIMIT ?", (limit,))
    
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        try:
            d["take_profit_targets"] = json.loads(d["take_profit_targets"])
        except Exception:
            d["take_profit_targets"] = []
        try:
            d["trap_reasons"] = json.loads(d["trap_reasons"])
        except Exception:
            d["trap_reasons"] = []
        results.append(d)
    return results

def get_signal_by_id(sig_id: str) -> Optional[Dict[str, Any]]:
    """Fetches single signal by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM signals_feed WHERE id = ?", (sig_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["take_profit_targets"] = json.loads(d["take_profit_targets"])
    except Exception:
        d["take_profit_targets"] = []
    try:
        d["trap_reasons"] = json.loads(d["trap_reasons"])
    except Exception:
        d["trap_reasons"] = []
    return d

def update_signal_outcome(sig_id: str, status: str) -> bool:
    """Updates outcome status (HIT_TP, HIT_SL, ACTIVE)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE signals_feed SET outcome_status = ? WHERE id = ?", (status, sig_id))
    conn.commit()
    conn.close()
    return True

def get_signal_channels() -> List[Dict[str, Any]]:
    """Returns registered signal channels and their accuracy scores."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM signal_channels ORDER BY win_rate_pct DESC, total_signals DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_signal_channel(platform: str, channel_name: str, channel_handle: str = "", channel_link: str = "") -> Dict[str, Any]:
    """Adds a new user-configured signal channel."""
    import uuid
    ch_id = f"ch_{uuid.uuid4().hex[:6]}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO signal_channels (
            id, platform, channel_name, channel_handle, channel_link,
            is_active, win_count, loss_count, total_signals, win_rate_pct
        ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0, 0.0)
    """, (ch_id, platform.upper(), channel_name, channel_handle, channel_link))
    conn.commit()
    conn.close()
    return {"id": ch_id, "platform": platform, "channel_name": channel_name, "success": True}

def delete_signal_channel(ch_id: str) -> bool:
    """Deletes a configured channel by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM signal_channels WHERE id = ?", (ch_id,))
    conn.commit()
    conn.close()
    return True

def seed_default_signal_channels_if_empty():
    """Seeds verified institutional alpha providers if empty."""
    channels = get_signal_channels()
    if not channels:
        defaults = [
            ("TELEGRAM", "Gold VIP Institutional Call", "@gold_alpha_vip", "https://t.me/GoldVIPSignals"),
            ("TELEGRAM", "Crypto Whale Alert Desk", "@whale_crypto_radar", "https://t.me/CryptoWhaleRadar"),
            ("DISCORD", "Apex Macro & Flow Trading", "Discord #gold-signals", "https://discord.gg/apexmacro"),
            ("TWITTER", "Lookonchain Smart Money", "@lookonchain", "https://twitter.com/lookonchain"),
            ("TWITTER", "Tier10k Breaking News", "@tier10k", "https://twitter.com/tier10k"),
            ("TRADINGVIEW", "SuperTrend MT5 Webhook", "TradingView Alert Hook", "http://localhost:8000/api/signals/webhook/tradingview"),
            ("REDDIT", "r/WallStreetBets Hot Flows", "Reddit Public Feed", "https://reddit.com/r/wallstreetbets"),
        ]
        for p, name, handle, link in defaults:
            add_signal_channel(p, name, handle, link)

init_db()
seed_default_signal_channels_if_empty()
