"""
Binance Public WebSocket Real-Time Streamer
Broad multi-stream for all Halal & Shariah-Compliant Crypto + Major Meme Coins
"""

import asyncio
import json
import logging
from typing import Dict, Any, Callable, List

import websockets

logger = logging.getLogger(__name__)

# Complete stream universe (Binance Spot @ticker channels)
BINANCE_SYMBOLS = [
    "paxgusdt", "btcusdt", "ethusdt", "solusdt", "xrpusdt", "adausdt", "avaxusdt",
    "dotusdt", "nearusdt", "suiusdt", "algousdt", "hbarusdt", "xtzusdt", "icpusdt",
    "trxusdt", "ltcusdt", "bchusdt", "xlmusdt", "linkusdt", "opusdt", "uniusdt",
    "qntusdt", "filusdt", "grtusdt", "taousdt", "fetusdt", "etcusdt", "zecusdt",
    "qtumusdt", "imxusdt", "dexeusdt", "vibusdt", "wldusdt",
    # Meme Coins
    "dogeusdt", "shibusdt", "pepeusdt", "bonkusdt", "flokiusdt", "wifusdt"
]

STREAMS = [f"{s}@ticker" for s in BINANCE_SYMBOLS]
WS_BASE_URL = "wss://stream.binance.com:9443/ws/" + "/".join(STREAMS)

LIVE_TICKS: Dict[str, Dict[str, Any]] = {}
SUBSCRIBERS: List[Callable[[Dict[str, Any]], Any]] = []


def get_live_tick(symbol: str) -> Dict[str, Any] | None:
    """Retrieve the latest real-time tick for symbol."""
    sym = symbol.upper().replace("/", "").replace("-", "")
    if sym in ("XAUUSD", "GOLD"):
        return LIVE_TICKS.get("PAXGUSDT")
    # ASI maps to FET on Binance
    if sym == "ASI":
        return LIVE_TICKS.get("FETUSDT")
    pair = f"{sym}USDT"
    return LIVE_TICKS.get(pair)


def register_subscriber(callback: Callable[[Dict[str, Any]], Any]):
    if callback not in SUBSCRIBERS:
        SUBSCRIBERS.append(callback)


def unregister_subscriber(callback: Callable[[Dict[str, Any]], Any]):
    if callback in SUBSCRIBERS:
        SUBSCRIBERS.remove(callback)


async def start_binance_websocket():
    """Background async worker that maintains a persistent connection to Binance WebSocket."""
    logger.info("Initializing Binance Multi-Stream WebSocket Worker for 50+ Coins...")
    backoff = 2

    while True:
        try:
            logger.info(f"Connecting to Binance Stream ({len(STREAMS)} tickers)...")
            async with websockets.connect(
                WS_BASE_URL,
                ping_interval=20,
                ping_timeout=15,
                close_timeout=10,
            ) as ws:
                logger.info("Binance Public Multi-Stream WebSocket connected successfully!")
                backoff = 2

                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    symbol = data.get("s")
                    if not symbol:
                        continue

                    last_price = float(data.get("c", 0.0))
                    price_change_pct = float(data.get("P", 0.0))
                    high_24h = float(data.get("h", last_price))
                    low_24h = float(data.get("l", last_price))
                    volume = float(data.get("v", 0.0))

                    tick = {
                        "pair": symbol,
                        "price": last_price,
                        "change_24h": round(price_change_pct, 2),
                        "high_24h": high_24h,
                        "low_24h": low_24h,
                        "volume": volume,
                        "source": "Binance WebSocket Live Stream",
                        "timestamp": data.get("E"),
                    }

                    LIVE_TICKS[symbol] = tick

                    for sub in list(SUBSCRIBERS):
                        try:
                            if asyncio.iscoroutinefunction(sub):
                                asyncio.create_task(sub(tick))
                            else:
                                sub(tick)
                        except Exception as sub_err:
                            logger.error(f"Subscriber error: {sub_err}")

        except Exception as e:
            logger.warning(f"Binance WS connection dropped: {e}. Reconnecting in {backoff}s...")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30)
