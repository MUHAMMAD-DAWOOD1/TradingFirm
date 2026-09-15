"""
MetaTrader 5 (MT5) Bridge Engine
Establishes an IPC connection with a running MetaTrader 5 Terminal.
Streams raw Bid/Ask ticks and OHLCV for Forex & Commodities:
- XAUUSD (Gold Spot)
- EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD
With auto-detection of terminal paths, background reconnect logic, and graceful fallback.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
import os

logger = logging.getLogger(__name__)

# Try to import MetaTrader5
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    mt5 = None
    MT5_AVAILABLE = False

MT5_CONNECTED = False
MT5_LIVE_TICKS: Dict[str, Dict[str, Any]] = {}

# Common default installation paths for MetaTrader 5 terminals
COMMON_MT5_PATHS = [
    r"C:\Program Files\MetaTrader 5\terminal64.exe",
    r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
    r"C:\Program Files\IC Markets MetaTrader 5\terminal64.exe",
    r"C:\Program Files\Exness MetaTrader 5\terminal64.exe",
    r"C:\Program Files\XM Global MT5\terminal64.exe",
    r"C:\Program Files\FTMO MetaTrader 5\terminal64.exe",
]

TRACKED_SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"]


def find_mt5_terminal_path() -> Optional[str]:
    """Scan disk for any installed MT5 terminal64.exe."""
    custom_path = os.getenv("MT5_PATH")
    if custom_path and os.path.exists(custom_path):
        return custom_path

    for p in COMMON_MT5_PATHS:
        if os.path.exists(p):
            return p
    return None


def get_mt5_live_tick(symbol: str) -> Optional[Dict[str, Any]]:
    """Retrieve the latest tick received from MT5."""
    sym = symbol.upper().replace("/", "").replace("-", "")
    return MT5_LIVE_TICKS.get(sym)


def is_mt5_connected() -> bool:
    return MT5_CONNECTED


async def start_mt5_bridge():
    """Background async worker that connects to MT5 and polls ticks every 200ms."""
    global MT5_CONNECTED

    if not MT5_AVAILABLE:
        logger.warning("MetaTrader5 Python module not available. MT5 Bridge disabled.")
        return

    logger.info("Initializing MetaTrader 5 Bridge Worker...")

    while True:
        try:
            term_path = find_mt5_terminal_path()
            init_kwargs = {}
            if term_path:
                init_kwargs["path"] = term_path
                logger.info(f"Using discovered MT5 Terminal: {term_path}")

            # Try to initialize IPC connection with MT5
            connected = mt5.initialize(**init_kwargs)

            if not connected:
                err = mt5.last_error()
                MT5_CONNECTED = False
                logger.info(f"MT5 terminal not currently running ({err}). Retrying bridge in 10s...")
                await asyncio.sleep(10)
                continue

            MT5_CONNECTED = True
            logger.info("MetaTrader 5 IPC Bridge successfully CONNECTED!")

            # Select symbols in Market Watch
            available_symbols = [s.name for s in (mt5.symbols_get() or [])]
            active_symbols = []
            for sym in TRACKED_SYMBOLS:
                # Some brokers name it XAUUSDm, XAUUSD.a, GOLD, etc.
                match = None
                for avail in available_symbols:
                    if sym in avail:
                        match = avail
                        break
                target = match or sym
                if mt5.symbol_select(target, True):
                    active_symbols.append((sym, target))

            logger.info(f"MT5 Bridge streaming symbols: {active_symbols}")

            # Polling loop for active ticks
            while True:
                for base_sym, broker_sym in active_symbols:
                    tick = mt5.symbol_info_tick(broker_sym)
                    if tick:
                        mid_price = round((tick.bid + tick.ask) / 2.0, 2 if "XAU" in base_sym else 5)
                        MT5_LIVE_TICKS[base_sym] = {
                            "symbol": base_sym,
                            "broker_symbol": broker_sym,
                            "bid": tick.bid,
                            "ask": tick.ask,
                            "price": mid_price,
                            "spread": round(tick.ask - tick.bid, 2 if "XAU" in base_sym else 5),
                            "volume": tick.volume,
                            "time": tick.time,
                            "source": "MetaTrader 5 Direct IPC",
                        }

                await asyncio.sleep(0.2)  # 200ms sub-second polling

        except Exception as e:
            MT5_CONNECTED = False
            logger.warning(f"MT5 Bridge connection exception: {e}. Re-initializing in 10s...")
            try:
                mt5.shutdown()
            except Exception:
                pass
            await asyncio.sleep(10)
