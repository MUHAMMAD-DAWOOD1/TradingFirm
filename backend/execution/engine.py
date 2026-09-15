"""
Institutional Paper Trading & Execution Engine
Simulates real trade executions against live broker/exchange pricing:
- Market & Limit order execution with realistic slippage
- Real-time Mark-to-Market PnL tracking
- Automated Stop-Loss & Take-Profit trigger simulation
- Position management & margin utilization
"""

import time
import uuid
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class TradeOrder(BaseModel):
    symbol: str
    side: str  # "BUY" or "SELL"
    order_type: str  # "MARKET" or "LIMIT"
    quantity: float
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: Optional[float] = 1.0


class Position(BaseModel):
    id: str
    symbol: str
    side: str
    quantity: float
    entry_price: float
    current_price: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    leverage: float
    margin_usd: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    status: str  # "OPEN", "CLOSED_TP", "CLOSED_SL", "CLOSED_MANUAL"
    opened_at: str
    closed_at: Optional[str] = None
    close_price: Optional[float] = None


# Persistent in-memory state
ACTIVE_POSITIONS: Dict[str, Position] = {}
CLOSED_TRADES: List[Position] = []
ACCOUNT_BALANCE = {
    "initial_capital": 100_000.0,
    "equity": 100_000.0,
    "margin_used": 0.0,
    "available_margin": 100_000.0,
    "realized_pnl": 0.0,
    "win_count": 0,
    "loss_count": 0
}


def open_position(order: TradeOrder, current_market_price: float) -> Dict[str, Any]:
    """Execute new trade order against current market tick."""
    pos_id = str(uuid.uuid4())[:8].upper()
    exec_price = current_market_price if order.order_type == "MARKET" else order.entry_price

    # Apply 0.02% institutional execution slippage for market orders
    if order.order_type == "MARKET":
        slippage = exec_price * 0.0002
        exec_price = round(exec_price + slippage if order.side == "BUY" else exec_price - slippage, 2 if exec_price > 1.0 else 4)

    notional = exec_price * order.quantity
    margin_req = round(notional / max(order.leverage, 1.0), 2)

    if margin_req > ACCOUNT_BALANCE["available_margin"]:
        return {
            "success": False,
            "error": f"Insufficient margin: Required ${margin_req} exceeds available ${ACCOUNT_BALANCE['available_margin']}"
        }

    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    pos = Position(
        id=pos_id,
        symbol=order.symbol.upper(),
        side=order.side.upper(),
        quantity=order.quantity,
        entry_price=exec_price,
        current_price=exec_price,
        stop_loss=order.stop_loss,
        take_profit=order.take_profit,
        leverage=order.leverage,
        margin_usd=margin_req,
        unrealized_pnl=0.0,
        unrealized_pnl_pct=0.0,
        status="OPEN",
        opened_at=now_str
    )

    ACTIVE_POSITIONS[pos_id] = pos
    ACCOUNT_BALANCE["margin_used"] += margin_req
    ACCOUNT_BALANCE["available_margin"] = ACCOUNT_BALANCE["equity"] - ACCOUNT_BALANCE["margin_used"]

    # Persist in SQLite
    try:
        from backend.database import get_db_connection
        conn = get_db_connection()
        conn.execute("""
            INSERT OR REPLACE INTO paper_trades (
                id, report_id, symbol, side, order_type, quantity,
                entry_price, current_price, stop_loss, take_profit,
                leverage, margin_usd, unrealized_pnl, realized_pnl,
                status, opened_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pos.id, None, pos.symbol, pos.side, order.order_type, pos.quantity,
            pos.entry_price, pos.current_price, pos.stop_loss, pos.take_profit,
            pos.leverage, pos.margin_usd, 0.0, 0.0, "OPEN", pos.opened_at
        ))
        conn.commit()
        conn.close()
    except Exception:
        pass

    return {
        "success": True,
        "position": pos.model_dump(),
        "account": ACCOUNT_BALANCE
    }


def update_positions_mark_to_market(current_prices: Dict[str, float]) -> List[Dict[str, Any]]:
    """Update all active positions with latest ticks and check SL/TP triggers."""
    closed_this_tick = []
    total_unrealized = 0.0

    for pos_id, pos in list(ACTIVE_POSITIONS.items()):
        sym = pos.symbol
        if sym not in current_prices:
            continue

        curr_p = current_prices[sym]
        pos.current_price = curr_p

        # Calculate PnL
        if pos.side == "BUY":
            diff = curr_p - pos.entry_price
            pnl = diff * pos.quantity
            pnl_pct = (diff / pos.entry_price) * 100 * pos.leverage
        else:
            diff = pos.entry_price - curr_p
            pnl = diff * pos.quantity
            pnl_pct = (diff / pos.entry_price) * 100 * pos.leverage

        pos.unrealized_pnl = round(pnl, 2)
        pos.unrealized_pnl_pct = round(pnl_pct, 2)
        total_unrealized += pos.unrealized_pnl

        # Check Stop-Loss
        triggered = False
        close_reason = None
        if pos.stop_loss is not None:
            if pos.side == "BUY" and curr_p <= pos.stop_loss:
                triggered = True
                close_reason = "CLOSED_SL"
            elif pos.side == "SELL" and curr_p >= pos.stop_loss:
                triggered = True
                close_reason = "CLOSED_SL"

        # Check Take-Profit
        if not triggered and pos.take_profit is not None:
            if pos.side == "BUY" and curr_p >= pos.take_profit:
                triggered = True
                close_reason = "CLOSED_TP"
            elif pos.side == "SELL" and curr_p <= pos.take_profit:
                triggered = True
                close_reason = "CLOSED_TP"

        if triggered:
            close_position(pos_id, curr_p, close_reason)
            closed_this_tick.append(pos.model_dump())

    # Update account equity
    ACCOUNT_BALANCE["equity"] = round(ACCOUNT_BALANCE["initial_capital"] + ACCOUNT_BALANCE["realized_pnl"] + total_unrealized, 2)
    ACCOUNT_BALANCE["available_margin"] = round(ACCOUNT_BALANCE["equity"] - ACCOUNT_BALANCE["margin_used"], 2)

    return closed_this_tick


def close_position(pos_id: str, close_price: float, reason: str = "CLOSED_MANUAL") -> Optional[Dict[str, Any]]:
    """Close an open position and realize PnL."""
    if pos_id not in ACTIVE_POSITIONS:
        return None

    pos = ACTIVE_POSITIONS.pop(pos_id)
    pos.close_price = close_price
    pos.closed_at = time.strftime("%Y-%m-%d %H:%M:%S")
    pos.status = reason

    if pos.side == "BUY":
        diff = close_price - pos.entry_price
    else:
        diff = pos.entry_price - close_price

    final_pnl = round(diff * pos.quantity, 2)
    pos.unrealized_pnl = final_pnl

    ACCOUNT_BALANCE["realized_pnl"] += final_pnl
    ACCOUNT_BALANCE["margin_used"] = max(0.0, ACCOUNT_BALANCE["margin_used"] - pos.margin_usd)
    ACCOUNT_BALANCE["equity"] = round(ACCOUNT_BALANCE["initial_capital"] + ACCOUNT_BALANCE["realized_pnl"], 2)
    ACCOUNT_BALANCE["available_margin"] = round(ACCOUNT_BALANCE["equity"] - ACCOUNT_BALANCE["margin_used"], 2)

    if final_pnl >= 0:
        ACCOUNT_BALANCE["win_count"] += 1
    else:
        ACCOUNT_BALANCE["loss_count"] += 1

    CLOSED_TRADES.append(pos)

    # Update in SQLite
    try:
        from backend.database import get_db_connection
        conn = get_db_connection()
        conn.execute("""
            UPDATE paper_trades
            SET current_price = ?, close_price = ?, closed_at = ?, status = ?, realized_pnl = ?, close_reason = ?
            WHERE id = ?
        """, (close_price, close_price, pos.closed_at, pos.status, final_pnl, reason, pos.id))
        conn.commit()
        conn.close()
    except Exception:
        pass

    return pos.model_dump()


def get_execution_state() -> Dict[str, Any]:
    """Retrieve full portfolio execution state."""
    open_list = [p.model_dump() for p in ACTIVE_POSITIONS.values()]
    closed_list = [p.model_dump() for p in CLOSED_TRADES[-10:]]

    total_trades = ACCOUNT_BALANCE["win_count"] + ACCOUNT_BALANCE["loss_count"]
    win_rate = round((ACCOUNT_BALANCE["win_count"] / max(total_trades, 1)) * 100, 1)

    return {
        "account": {
            **ACCOUNT_BALANCE,
            "total_trades": total_trades,
            "win_rate_pct": win_rate
        },
        "open_positions": open_list,
        "closed_positions": closed_list
    }


def reset_account_capital(new_capital: float, hard_reset: bool = True) -> Dict[str, Any]:
    """Set custom paper trading account initial capital and optionally reset trade stats."""
    cap = max(100.0, float(new_capital))
    ACCOUNT_BALANCE["initial_capital"] = cap
    if hard_reset:
        ACCOUNT_BALANCE["realized_pnl"] = 0.0
        ACCOUNT_BALANCE["margin_used"] = 0.0
        ACCOUNT_BALANCE["win_count"] = 0
        ACCOUNT_BALANCE["loss_count"] = 0
        ACTIVE_POSITIONS.clear()
    ACCOUNT_BALANCE["equity"] = round(cap + ACCOUNT_BALANCE["realized_pnl"], 2)
    ACCOUNT_BALANCE["available_margin"] = round(ACCOUNT_BALANCE["equity"] - ACCOUNT_BALANCE["margin_used"], 2)
    return get_execution_state()
