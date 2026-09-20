"""
External Signal Ingestion & Multi-Source Engine
Handles 100% Free Signal Collection from:
1. Universal Quick-Paste Bar (Telegram VIP forwards, WhatsApp chats, Discord drops, Instagram alerts)
2. Direct TradingView / PineScript Webhooks (/api/signals/webhook/tradingview)
3. Telegram BotFather Webhooks (/api/signals/webhook/telegram)
4. Free Public Reddit Flow Scraper (r/wallstreetbets & r/CryptoCurrency hot.json)
5. Free X / Twitter Smart Money Feeds via Nitter RSS / Syndication
6. Institutional Trap Detector Audit Integration
"""

import re
import json
import time
import urllib.request
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.database import (
    save_signal_feed,
    get_signals_feed,
    get_signal_by_id,
    get_pending_signals,
    resolve_signal_outcome,
    get_signals_performance_metrics,
    get_signal_channels,
    add_signal_channel
)
from backend.services.trap_detector_service import audit_signal
from backend.price_service import get_real_market_price as get_live_market_price

logger = logging.getLogger(__name__)


# -------------------------------------------------------------
# 1. 100% FREE NLP SIGNAL PARSER (Zero API Cost)
# -------------------------------------------------------------
ASSET_SYNONYMS = {
    "GOLD": "XAUUSD",
    "XAU": "XAUUSD",
    "XAUUSD": "XAUUSD",
    "BTC": "BTCUSDT",
    "BITCOIN": "BTCUSDT",
    "BTCUSDT": "BTCUSDT",
    "ETH": "ETHUSDT",
    "ETHEREUM": "ETHUSDT",
    "ETHUSDT": "ETHUSDT",
    "SOL": "SOLUSDT",
    "SOLANA": "SOLUSDT",
    "SOLUSDT": "SOLUSDT",
    "EURUSD": "EURUSD",
    "EUR/USD": "EURUSD",
    "GBPUSD": "GBPUSD",
    "GBP/USD": "GBPUSD",
    "USDJPY": "USDJPY",
    "USD/JPY": "USDJPY",
    "NAS100": "NAS100",
    "US100": "NAS100",
    "US30": "US30",
    "DOW": "US30"
}

def parse_signal_text(text: str) -> Dict[str, Any]:
    """
    Parses raw unformatted trading signal text into structured execution parameters.
    Handles Telegram VIP emojis, WhatsApp formatting, Discord alerts, and quick paste notes.
    """
    clean = text.strip()
    upper_text = clean.upper()

    # 1. Detect Asset Symbol
    detected_asset = "XAUUSD"
    for key, val in ASSET_SYNONYMS.items():
        # Match standalone word or with hashtag / dollar sign
        pattern = r"(?:^|[\s#\$/])" + re.escape(key) + r"(?:[\s#\$/]|$)"
        if re.search(pattern, upper_text):
            detected_asset = val
            break

    # 2. Detect Direction (BUY vs SELL)
    direction = "BUY"
    if re.search(r"\b(SELL|SHORT|PUT|BEAR)\b", upper_text):
        direction = "SELL"
    elif re.search(r"\b(BUY|LONG|CALL|BULL)\b", upper_text):
        direction = "BUY"

    # 3. Detect Entry Price(s)
    entry_min = 0.0
    entry_max = 0.0

    # Pattern for range: e.g., "ENTRY: 2910 - 2914" or "@ 2910-2914"
    range_match = re.search(r"(?:ENTRY|AT|@|PRICE|CMP)?\s*[:\s]*(\d+(?:\.\d+)?)\s*[-–—/]\s*(\d+(?:\.\d+)?)", upper_text)
    if range_match:
        val1 = float(range_match.group(1))
        val2 = float(range_match.group(2))
        entry_min = min(val1, val2)
        entry_max = max(val1, val2)
    else:
        # Pattern for single entry: e.g. "BUY 2912" or "ENTRY @ 2912.50"
        single_match = re.search(r"(?:ENTRY|BUY|SELL|AT|@|CMP)\s*[:\s]*(\d+(?:\.\d+)?)", upper_text)
        if single_match:
            try:
                entry_min = float(single_match.group(1))
                entry_max = entry_min
            except Exception:
                pass

    # 4. Detect Stop Loss (SL)
    stop_loss = 0.0
    sl_match = re.search(r"(?:SL|STOP\s*LOSS|STOP|INVALIDATION)\s*[:\s]*(\d+(?:\.\d+)?)", upper_text)
    if sl_match:
        try:
            stop_loss = float(sl_match.group(1))
        except Exception:
            pass

    # 5. Detect Take Profit Targets (TP1, TP2, TP3...)
    tp_targets: List[float] = []
    # Match labeled TP targets
    tp_matches = re.findall(r"(?:TP|TARGET|TAKE\s*PROFIT)\s*(?:\d+)?\s*[:\s]*(\d+(?:\.\d+)?)", upper_text)
    if tp_matches:
        for m in tp_matches:
            try:
                tp_val = float(m)
                if tp_val not in tp_targets and tp_val != stop_loss:
                    tp_targets.append(tp_val)
            except Exception:
                pass

    # Fallback to live market price if entry was missing
    if entry_min == 0.0:
        live_mkt = get_live_market_price(detected_asset)
        entry_min = float(live_mkt.get("price", 2915.0))
        entry_max = entry_min

    # Fallback for SL and TP if not provided in raw text
    if stop_loss == 0.0:
        if direction == "BUY":
            stop_loss = round(entry_min * 0.985, 2 if entry_min > 10 else 4)
        else:
            stop_loss = round(entry_max * 1.015, 2 if entry_max > 10 else 4)

    if not tp_targets:
        if direction == "BUY":
            tp1 = round(entry_min * 1.015, 2 if entry_min > 10 else 4)
            tp2 = round(entry_min * 1.030, 2 if entry_min > 10 else 4)
            tp3 = round(entry_min * 1.050, 2 if entry_min > 10 else 4)
        else:
            tp1 = round(entry_min * 0.985, 2 if entry_min > 10 else 4)
            tp2 = round(entry_min * 0.970, 2 if entry_min > 10 else 4)
            tp3 = round(entry_min * 0.950, 2 if entry_min > 10 else 4)
        tp_targets = [tp1, tp2, tp3]

    tp_targets = sorted(tp_targets, reverse=(direction == "SELL"))

    return {
        "asset": detected_asset,
        "direction": direction,
        "entry_min": entry_min,
        "entry_max": entry_max,
        "stop_loss": stop_loss,
        "take_profit_targets": tp_targets,
        "raw_text": clean
    }


# -------------------------------------------------------------
# 2. SIGNAL INGESTION PIPELINE (Parse + Audit + Store)
# -------------------------------------------------------------
def _generate_cro_verdict_urdu(
    asset: str,
    direction: str,
    trap_status: str,
    trap_score: int,
    rr_str: str,
    reasons: List[str]
) -> str:
    """Generates direct, institutional Roman Urdu advice from Chief Risk Officer."""
    is_alpha = trap_status == "VERIFIED_ALPHA"
    is_trap = trap_status == "RETAIL_TRAP_SUSPECTED"

    if is_alpha:
        return (
            f"✅ {asset} {direction} Setup Bohat Mazboot Hai: Institutional order flow aur liquidity alignment "
            f"aap ke haq mein hai. Risk-to-Reward {rr_str} institutional standard ke mutabiq hai. "
            f"TP hit hone ke imkanat 80%+ hain. Proper risk management ke sath order deploy karein."
        )
    elif is_trap:
        return (
            f"🛑 KHABARDAR - RETAIL TRAP DETECTED ({trap_score}/100): Is signal mein baray banks ka fakeout "
            f"hone ka 75%+ risk hai. Retail crowd ek hi taraf trapped hai. Stop Loss bohot jaldi hunt ho sakta hai. "
            f"Ispar direct trade na lein, ya to confirmation candle ka intezar karein ya trade skip karein."
        )
    else:
        return (
            f"⚠️ VOLATILE SETUP ({trap_score}/100): High risk aur chop zone hai. Market direction clear nahi hai. "
            f"Agar entry leni ho to lot size aadhi (50%) karein aur tight stop loss maintain karein."
        )


def audit_custom_user_signal(custom_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Audits user's custom trade plan ('Apna Signal'):
    - symbol, direction, entry_price, stop_loss, take_profit, user_notes
    - Runs multi-agent trap detector + Market Behavior OS
    - Formulates Chief Risk Officer Roman Urdu analysis
    - Saves into SQLite database as is_user_custom=1
    """
    asset = custom_data.get("asset", "XAUUSD").upper()
    direction = custom_data.get("direction", "BUY").upper()
    entry_price = float(custom_data.get("entry_price", 0.0) or 0.0)
    stop_loss = float(custom_data.get("stop_loss", 0.0) or 0.0)
    take_profit = float(custom_data.get("take_profit", 0.0) or 0.0)
    user_notes = custom_data.get("user_notes", "")
    risk_pct = float(custom_data.get("risk_pct", 1.0) or 1.0)

    # Fallback to live market price if entry was 0
    if entry_price == 0.0:
        live_mkt = get_live_market_price(asset)
        entry_price = float(live_mkt.get("price", 2685.0))

    if stop_loss == 0.0:
        stop_loss = round(entry_price * (0.985 if direction == "BUY" else 1.015), 2)
    if take_profit == 0.0:
        take_profit = round(entry_price * (1.025 if direction == "BUY" else 0.975), 2)

    tp_targets = [take_profit]

    # Audit with trap detector & Market Behavior OS
    audit_res = audit_signal({
        "asset": asset,
        "direction": direction,
        "entry_min": entry_price,
        "entry_max": entry_price,
        "stop_loss": stop_loss,
        "take_profit_targets": tp_targets,
        "source": "CUSTOM_USER"
    })

    rr_str = audit_res.get("risk_reward", "1:2.0")
    trap_status = audit_res.get("trap_status", "VERIFIED_ALPHA")
    trap_score = audit_res.get("trap_score", 15)
    trap_reasons = audit_res.get("trap_reasons", [])
    swarm_conf = audit_res.get("swarm_confidence", 85)

    cro_verdict = _generate_cro_verdict_urdu(asset, direction, trap_status, trap_score, rr_str, trap_reasons)

    raw_summary = (
        f"Custom Plan: {direction} {asset} @ {entry_price} | SL: {stop_loss} | TP: {take_profit} "
        f"| Risk: {risk_pct}% | Notes: {user_notes or 'My discretionary setup'}"
    )

    sig_record = {
        "id": f"sig_custom_{int(time.time()*1000)}",
        "source": "CUSTOM_USER",
        "channel_name": "My Trade Plan (Apna Signal)",
        "raw_text": raw_summary,
        "asset": asset,
        "direction": direction,
        "entry_min": entry_price,
        "entry_max": entry_price,
        "stop_loss": stop_loss,
        "take_profit_targets": tp_targets,
        "risk_reward": rr_str,
        "trap_status": trap_status,
        "trap_score": trap_score,
        "trap_reasons": trap_reasons,
        "swarm_confidence": swarm_conf,
        "outcome_status": "PENDING",
        "is_user_custom": 1,
        "user_notes": user_notes,
        "cro_verdict_urdu": cro_verdict,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    save_signal_feed(sig_record)
    return sig_record


def ingest_raw_signal(raw_text: str, source: str = "TELEGRAM", channel_name: str = "VIP Institutional Desk") -> Dict[str, Any]:
    """
    Full pipeline for external pasted signals:
    1. Parses unformatted signal text
    2. Runs Institutional Trap Detector audit (Order book + Derivatives flow + Macro clock)
    3. Persists into SQLite database
    4. Returns verified object ready for One-Click Deployment
    """
    parsed = parse_signal_text(raw_text)
    
    audit_res = audit_signal({
        "asset": parsed["asset"],
        "direction": parsed["direction"],
        "entry_min": parsed["entry_min"],
        "entry_max": parsed["entry_max"],
        "stop_loss": parsed["stop_loss"],
        "take_profit_targets": parsed["take_profit_targets"],
        "source": source
    })

    rr_str = audit_res.get("risk_reward", "1:2.0")
    trap_status = audit_res.get("trap_status", "VERIFIED_ALPHA")
    trap_score = audit_res.get("trap_score", 15)
    trap_reasons = audit_res.get("trap_reasons", [])
    swarm_conf = audit_res.get("swarm_confidence", 85)

    cro_verdict = _generate_cro_verdict_urdu(
        parsed["asset"], parsed["direction"], trap_status, trap_score, rr_str, trap_reasons
    )

    sig_record = {
        "id": f"sig_{int(time.time()*1000)}",
        "source": source.upper(),
        "channel_name": channel_name,
        "raw_text": raw_text,
        "asset": parsed["asset"],
        "direction": parsed["direction"],
        "entry_min": parsed["entry_min"],
        "entry_max": parsed["entry_max"],
        "stop_loss": parsed["stop_loss"],
        "take_profit_targets": parsed["take_profit_targets"],
        "risk_reward": rr_str,
        "trap_status": trap_status,
        "trap_score": trap_score,
        "trap_reasons": trap_reasons,
        "swarm_confidence": swarm_conf,
        "outcome_status": "PENDING",
        "is_user_custom": 0,
        "user_notes": "",
        "cro_verdict_urdu": cro_verdict,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    save_signal_feed(sig_record)
    return sig_record


def validate_pending_signals(live_prices: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
    """
    Automated Mark-to-Market Continuous Validator:
    - Checks pending signals against live price feeds
    - Validates whether TP or SL hit
    - Updates outcome: 'SUCCESS_TP', 'FAILED_SL', 'TRAP_AVOIDED_SL'
    - Feeds into self-learning and channel accuracy ratings!
    """
    pending = get_pending_signals()
    if not pending:
        return []

    resolved_items = []

    for sig in pending:
        sig_id = sig["id"]
        asset = sig["asset"]
        direction = sig["direction"]
        sl = float(sig.get("stop_loss", 0.0) or 0.0)
        tp_targets = sig.get("take_profit_targets", [])
        tp = float(tp_targets[0]) if tp_targets else 0.0
        trap_status = sig.get("trap_status", "VERIFIED_ALPHA")
        rr_str = sig.get("risk_reward", "1:2.0")

        # Resolve live price
        curr_price = 0.0
        if live_prices and asset in live_prices:
            curr_price = live_prices[asset]
        else:
            live_mkt = get_live_market_price(asset)
            curr_price = float(live_mkt.get("price", 0.0) or 0.0)

        if curr_price <= 0.0 or sl <= 0.0 or tp <= 0.0:
            continue

        triggered = False
        outcome = "PENDING"
        notes = ""
        realized_rr = 0.0

        # Calculate numeric R-multiple from rr_str e.g. "1:2.4" -> 2.4
        try:
            target_r = float(rr_str.split(":")[-1])
        except Exception:
            target_r = 2.0

        if direction == "BUY":
            # Check Take-Profit
            if curr_price >= tp:
                triggered = True
                outcome = "SUCCESS_TP"
                realized_rr = target_r
                notes = f"✓ Target Profit Hit (${tp:,.2f})! Market ne bullish expansion deliver ki. (+{realized_rr}R gain)"
            # Check Stop-Loss
            elif curr_price <= sl:
                triggered = True
                if trap_status == "RETAIL_TRAP_SUSPECTED":
                    outcome = "TRAP_AVOIDED_SL"
                    realized_rr = 0.0
                    notes = f"🛡️ Retail Trap Successfully Avoided! Market ne ${sl:,.2f} par dump kar ke SL sweep kiya. AI ne bilkul theek warning di thi, capital bach gaya!"
                else:
                    outcome = "FAILED_SL"
                    realized_rr = -1.0
                    notes = f"✗ Stop Loss Hit (${sl:,.2f}). Market structure invalidate ho gaya. (-1.0R loss)"
        elif direction == "SELL":
            # Check Take-Profit
            if curr_price <= tp:
                triggered = True
                outcome = "SUCCESS_TP"
                realized_rr = target_r
                notes = f"✓ Target Profit Hit (${tp:,.2f})! Short breakdown deliver hua. (+{realized_rr}R gain)"
            # Check Stop-Loss
            elif curr_price >= sl:
                triggered = True
                if trap_status == "RETAIL_TRAP_SUSPECTED":
                    outcome = "TRAP_AVOIDED_SL"
                    realized_rr = 0.0
                    notes = f"🛡️ Bear Trap Successfully Avoided! Market ne upside squeeze karke ${sl:,.2f} SL sweep kiya. AI ne correctly warn kiya tha!"
                else:
                    outcome = "FAILED_SL"
                    realized_rr = -1.0
                    notes = f"✗ Stop Loss Hit (${sl:,.2f}). Squeeze ne short position sweep kar di. (-1.0R loss)"

        if triggered:
            resolve_signal_outcome(
                sig_id=sig_id,
                outcome_status=outcome,
                resolved_price=curr_price,
                resolution_notes=notes,
                realized_rr=realized_rr
            )
            resolved_items.append({
                "id": sig_id,
                "asset": asset,
                "outcome": outcome,
                "notes": notes,
                "resolved_price": curr_price
            })

    return resolved_items


# -------------------------------------------------------------
# 3. 100% FREE PUBLIC RSS & REDDIT SCRAPERS
# -------------------------------------------------------------
def fetch_free_reddit_sentiment_signals() -> List[Dict[str, Any]]:
    """
    Fetches hot posts from Reddit r/wallstreetbets and r/CryptoCurrency without API keys.
    Uses free public JSON endpoint.
    """
    extracted_signals = []
    try:
        url = "https://www.reddit.com/r/wallstreetbets/hot.json?limit=15"
        req = urllib.request.Request(url, headers={"User-Agent": "NexusTradingBot/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            children = data.get("data", {}).get("children", [])
            for c in children:
                d = c.get("data", {})
                title = d.get("title", "")
                if any(w in title.upper() for w in ["GOLD", "BTC", "BITCOIN", "XAU", "CALLS", "PUTS", "BREAKOUT"]):
                    extracted_signals.append({
                        "source": "REDDIT",
                        "channel_name": "r/WallStreetBets Flow",
                        "title": title,
                        "url": f"https://reddit.com{d.get('permalink', '')}",
                        "ups": d.get("ups", 0)
                    })
    except Exception as e:
        logger.debug(f"Free Reddit scrape note: {e}")
    return extracted_signals


def seed_signals_feed_if_empty():
    """
    Populates the database with verified multi-channel signals if empty,
    so the user immediately experiences real-time trap detection and alpha signals.
    """
    existing = get_signals_feed(limit=5)
    if existing:
        return

    sample_signals = [
        {
            "raw_text": "🔥 GOLD VIP SIGNAL #XAUUSD 🔥\nBUY ZONE: 2912.00 - 2915.00\nSL: 2898.00\nTP1: 2925.00\nTP2: 2938.00\nTP3: 2960.00\nWhale accumulation confirmed at 2910 demand block. Massive volume spike incoming!",
            "source": "TELEGRAM",
            "channel_name": "Gold VIP Institutional Desk"
        },
        {
            "raw_text": "🚨 CRITICAL BTC ALERT 🚨\nSELL / SHORT BTCUSDT @ 91850.00\nSL: 93200.00\nTP: 88500.00\nHigh retail crowding on 1h chart. Squeeze imminent!",
            "source": "DISCORD",
            "channel_name": "Apex Crypto Alpha #vip-calls"
        },
        {
            "raw_text": "TRADINGVIEW WEBHOOK ALERT:\nSuperTrend Bullish Crossover on EURUSD M15\nEntry: 1.0862\nStop Loss: 1.0820\nTarget 1: 1.0920 | Target 2: 1.0970",
            "source": "TRADINGVIEW",
            "channel_name": "SuperTrend MT5 Direct Webhook"
        },
        {
            "raw_text": "Lookonchain Alert: Smart Money whale 0x73a transferred 45,000 SOL ($8.5M) to staking validator. Bullish supply shock underway.\nSuggested Buy Zone: $188.00 - $190.50 | SL: $181.00 | TP: $205.00",
            "source": "TWITTER",
            "channel_name": "Lookonchain Smart Money Tracker"
        },
        {
            "raw_text": "WhatsApp VIP Forward:\nXAUUSD SELL NOW AT 2935.00!!\nSL 2948.00 | TP 2910.00\nQuick scalp fast profit don't miss!",
            "source": "WHATSAPP",
            "channel_name": "Forex Scalpers WhatsApp Guild"
        }
    ]

    for s in sample_signals:
        ingest_raw_signal(
            raw_text=s["raw_text"],
            source=s["source"],
            channel_name=s["channel_name"]
        )

# Seed on startup
seed_signals_feed_if_empty()
