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
try:
    from backend.database import (
        get_persisted_account_state,
        save_persisted_account_state,
        get_open_paper_trades,
        get_closed_paper_trades,
        get_filtered_paper_trades,
        get_all_demo_accounts,
        get_active_demo_account,
        get_demo_account,
        save_demo_account_state,
        reset_demo_account,
        get_db_connection
    )
except ImportError:
    from database import (
        get_persisted_account_state,
        save_persisted_account_state,
        get_open_paper_trades,
        get_closed_paper_trades,
        get_filtered_paper_trades,
        get_all_demo_accounts,
        get_active_demo_account,
        get_demo_account,
        save_demo_account_state,
        reset_demo_account,
        get_db_connection
    )

class TradeOrder(BaseModel):
    symbol: str
    side: str  # "BUY" or "SELL"
    order_type: str  # "MARKET" or "LIMIT"
    quantity: float
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: Optional[float] = 1.0
    account_id: Optional[str] = None


class Position(BaseModel):
    id: str
    account_id: str = "ACC_DEFAULT"
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
    realized_pnl: Optional[float] = 0.0
    close_reason: Optional[str] = None


# Persistent in-memory cache hydrated from SQLite
ACTIVE_POSITIONS: Dict[str, Position] = {}
CLOSED_TRADES: List[Position] = []

def hydrate_state_from_db():
    ACTIVE_POSITIONS.clear()
    CLOSED_TRADES.clear()
    
    open_rows = get_open_paper_trades()
    for r in open_rows:
        try:
            p = Position(
                id=r["id"],
                account_id=r.get("account_id") or "ACC_DEFAULT",
                symbol=r["symbol"],
                side=r["side"],
                quantity=float(r["quantity"]),
                entry_price=float(r["entry_price"]),
                current_price=float(r["current_price"] or r["entry_price"]),
                stop_loss=float(r["stop_loss"]) if r["stop_loss"] is not None else None,
                take_profit=float(r["take_profit"]) if r["take_profit"] is not None else None,
                leverage=float(r["leverage"] or 1.0),
                margin_usd=float(r["margin_usd"] or 0.0),
                unrealized_pnl=float(r["unrealized_pnl"] or 0.0),
                unrealized_pnl_pct=0.0,
                status=r["status"],
                opened_at=r["opened_at"]
            )
            ACTIVE_POSITIONS[p.id] = p
        except Exception:
            pass

    closed_rows = get_closed_paper_trades(limit=200)
    for r in closed_rows:
        try:
            p = Position(
                id=r["id"],
                account_id=r.get("account_id") or "ACC_DEFAULT",
                symbol=r["symbol"],
                side=r["side"],
                quantity=float(r["quantity"]),
                entry_price=float(r["entry_price"]),
                current_price=float(r["current_price"] or r["entry_price"]),
                stop_loss=float(r["stop_loss"]) if r["stop_loss"] is not None else None,
                take_profit=float(r["take_profit"]) if r["take_profit"] is not None else None,
                leverage=float(r["leverage"] or 1.0),
                margin_usd=float(r["margin_usd"] or 0.0),
                unrealized_pnl=0.0,
                unrealized_pnl_pct=0.0,
                status=r["status"],
                opened_at=r["opened_at"],
                closed_at=r["closed_at"],
                close_price=float(r["close_price"]) if r["close_price"] is not None else None,
                realized_pnl=float(r.get("realized_pnl") or 0.0),
                close_reason=r.get("close_reason")
            )
            CLOSED_TRADES.append(p)
        except Exception:
            pass

# Initialize from DB on module load
try:
    hydrate_state_from_db()
except Exception:
    pass


def open_position(order: TradeOrder, current_market_price: float, account_id: Optional[str] = None) -> Dict[str, Any]:
    """Execute new trade order against current market tick for specific demo account."""
    target_acc_id = account_id or order.account_id or get_active_demo_account()["id"]
    target_acc = get_demo_account(target_acc_id) or get_active_demo_account()

    # Dynamic Live Account State Sync: recalculate equity and available margin from active positions
    acc_open_trades = [p for p in ACTIVE_POSITIONS.values() if (p.account_id or "ACC_DEFAULT") == target_acc["id"]]
    realized_bal = max(0.0, float(target_acc.get("balance", 0.0)))
    unrealized_sum = sum(p.unrealized_pnl for p in acc_open_trades)
    current_eq = max(0.0, round(realized_bal + unrealized_sum, 2))
    margin_used_sum = round(sum(p.margin_usd for p in acc_open_trades), 2)
    target_acc["balance"] = realized_bal
    target_acc["equity"] = current_eq
    target_acc["margin_used"] = margin_used_sum
    target_acc["available_margin"] = max(0.0, round(current_eq - margin_used_sum, 2))

    pos_id = str(uuid.uuid4())[:8].upper()
    exec_price = current_market_price if order.order_type == "MARKET" else order.entry_price

    # Apply 0.02% institutional execution slippage for market orders
    if order.order_type == "MARKET":
        slippage = exec_price * 0.0002
        exec_price = round(exec_price + slippage if order.side == "BUY" else exec_price - slippage, 2 if exec_price > 1.0 else 4)

    notional = exec_price * order.quantity
    margin_req = round(notional / max(order.leverage, 1.0), 2)

    if margin_req > target_acc["available_margin"]:
        return {
            "success": False,
            "error": f"Insufficient margin on '{target_acc['name']}': Required ${margin_req} exceeds available ${target_acc['available_margin']:.2f}"
        }

    # Sanity-check Stop-Loss & Take-Profit to prevent cross-asset leakage / immediate stopout
    clean_sl = order.stop_loss
    clean_tp = order.take_profit

    if order.side.upper() == "BUY":
        if clean_sl is not None and clean_sl >= exec_price:
            # Corrupted SL on BUY -> recalculate to safe 2% below exec_price
            clean_sl = round(exec_price * 0.98, 2 if exec_price > 1.0 else 4)
        if clean_tp is not None and clean_tp <= exec_price:
            clean_tp = round(exec_price * 1.03, 2 if exec_price > 1.0 else 4)
    elif order.side.upper() == "SELL":
        if clean_sl is not None and clean_sl <= exec_price:
            # Corrupted SL on SELL -> recalculate to safe 2% above exec_price
            clean_sl = round(exec_price * 1.02, 2 if exec_price > 1.0 else 4)
        if clean_tp is not None and clean_tp >= exec_price:
            clean_tp = round(exec_price * 0.97, 2 if exec_price > 1.0 else 4)

    # --- INSTITUTIONAL RISK SHIELD & SL CLAMP ---
    # Ensure potential dollar loss at Stop Loss NEVER exceeds account equity (Account Wash Prevention)
    acc_equity = max(1.0, float(target_acc.get("equity") or target_acc.get("balance") or 10.0))
    decimals = 2 if exec_price > 1.0 else 4
    
    # Micro accounts (<= $100) are capped at max 40-50% risk per trade; larger accounts capped at 20%
    max_risk_pct = 0.50 if acc_equity <= 100.0 else 0.20
    max_allowable_loss_usd = round(acc_equity * max_risk_pct, 2)

    if order.quantity > 0:
        if clean_sl is not None:
            point_risk = abs(exec_price - clean_sl)
            projected_loss_usd = point_risk * order.quantity
            if projected_loss_usd > max_allowable_loss_usd:
                # Clamp SL distance so the trade respects maximum survivable dollar loss
                safe_sl_distance = max_allowable_loss_usd / order.quantity
                if order.side.upper() == "BUY":
                    clean_sl = round(exec_price - safe_sl_distance, decimals)
                else:
                    clean_sl = round(exec_price + safe_sl_distance, decimals)
        else:
            # Default institutional safety SL if none provided
            safe_sl_distance = max_allowable_loss_usd / order.quantity
            if order.side.upper() == "BUY":
                clean_sl = round(exec_price - safe_sl_distance, decimals)
            else:
                clean_sl = round(exec_price + safe_sl_distance, decimals)

    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    pos = Position(
        id=pos_id,
        account_id=target_acc["id"],
        symbol=order.symbol.upper(),
        side=order.side.upper(),
        quantity=order.quantity,
        entry_price=exec_price,
        current_price=exec_price,
        stop_loss=clean_sl,
        take_profit=clean_tp,
        leverage=order.leverage,
        margin_usd=margin_req,
        unrealized_pnl=0.0,
        unrealized_pnl_pct=0.0,
        status="OPEN",
        opened_at=now_str
    )

    ACTIVE_POSITIONS[pos_id] = pos
    target_acc["margin_used"] = round(target_acc["margin_used"] + margin_req, 2)
    target_acc["available_margin"] = round(target_acc["equity"] - target_acc["margin_used"], 2)
    save_demo_account_state(target_acc["id"], target_acc)

    # Persist in SQLite
    try:
        conn = get_db_connection()
        conn.execute("""
            INSERT OR REPLACE INTO paper_trades (
                id, account_id, report_id, symbol, side, order_type, quantity,
                entry_price, current_price, stop_loss, take_profit,
                leverage, margin_usd, unrealized_pnl, realized_pnl,
                status, opened_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pos.id, target_acc["id"], None, pos.symbol, pos.side, order.order_type, pos.quantity,
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
        "account": target_acc
    }


def update_positions_mark_to_market(current_prices: Dict[str, float]) -> List[Dict[str, Any]]:
    """Update all active positions with latest ticks and update equity per demo account."""
    closed_this_tick = []
    account_unrealized: Dict[str, float] = {}

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
        acc_id = pos.account_id or "ACC_DEFAULT"
        account_unrealized[acc_id] = account_unrealized.get(acc_id, 0.0) + pos.unrealized_pnl

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
            closed_pos = close_position(pos_id, curr_p, close_reason)
            if closed_pos:
                closed_this_tick.append(closed_pos)

    # Update account equity and available margin for all accounts
    for acc_id, unrealized in account_unrealized.items():
        acc = get_demo_account(acc_id)
        if acc:
            acc["equity"] = round(acc["balance"] + unrealized, 2)
            acc["available_margin"] = round(acc["equity"] - acc["margin_used"], 2)

            # --- INSTITUTIONAL BROKER STOP-OUT & LIQUIDATION TRIGGER ---
            # Standard broker mechanics:
            # Margin Level = (Equity / Margin Used) * 100%
            # If Equity <= 0 or Margin Level <= 20%:
            # The broker IMMEDIATELY liquidates all active positions to prevent negative balance!
            margin_used = max(0.01, float(acc.get("margin_used", 0.0)))
            margin_level = (acc["equity"] / margin_used) * 100.0 if margin_used > 0 else 1000.0

            if acc["equity"] <= 0 or margin_level <= 20.0 or (acc["balance"] <= 50.0 and acc["equity"] <= acc["balance"] * 0.15):
                # Emergency Stop-out / Liquidation: Close all open positions on this account
                for pos_id, pos in list(ACTIVE_POSITIONS.items()):
                    if (pos.account_id or "ACC_DEFAULT") == acc_id:
                        tick_p = current_prices.get(pos.symbol, pos.current_price)
                        c_pos = close_position(pos_id, tick_p, "LIQUIDATED_STOPOUT")
                        if c_pos:
                            closed_this_tick.append(c_pos)

                # Re-fetch after liquidation
                acc = get_demo_account(acc_id) or acc

            save_demo_account_state(acc_id, acc)

    return closed_this_tick


def close_position(pos_id: str, close_price: float, reason: str = "CLOSED_MANUAL") -> Optional[Dict[str, Any]]:
    """Close an open position, realize PnL on target demo account, and adjust balance permanently."""
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
    pos.unrealized_pnl = 0.0
    pos.realized_pnl = final_pnl
    pos.close_reason = reason
    pos.close_price = close_price
    pos.status = "CLOSED"
    pos.closed_at = time.strftime("%Y-%m-%d %H:%M:%S")

    acc_id = pos.account_id or "ACC_DEFAULT"
    acc = get_demo_account(acc_id) or get_active_demo_account()

    # Real broker simulation:
    # 1. Realized PnL alters Balance permanently
    acc["balance"] = round(acc["balance"] + final_pnl, 2)
    acc["realized_pnl"] = round(acc["realized_pnl"] + final_pnl, 2)
    acc["margin_used"] = max(0.0, round(acc["margin_used"] - pos.margin_usd, 2))

    # --- NEGATIVE BALANCE PROTECTION (NBP) ---
    # Real brokers guarantee accounts can never owe debt or drop below zero.
    if acc["balance"] < 0:
        acc["balance"] = 0.0

    # 2. Recalculate remaining unrealized PnL of other open trades on this account
    remaining_unrealized = sum(p.unrealized_pnl for p in ACTIVE_POSITIONS.values() if (p.account_id or "ACC_DEFAULT") == acc_id)
    acc["equity"] = max(0.0, round(acc["balance"] + remaining_unrealized, 2))
    acc["available_margin"] = max(0.0, round(acc["equity"] - acc["margin_used"], 2))

    if final_pnl >= 0:
        acc["win_count"] += 1
    else:
        acc["loss_count"] += 1

    save_demo_account_state(acc["id"], acc)
    CLOSED_TRADES.insert(0, pos)

    # Update in SQLite
    try:
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

    # Autonomous Background Self-Learning Reflection Hook
    try:
        try:
            from backend.services.vault_validation_service import diagnose_flaws_and_lessons
            from backend.database import record_trade_self_learning
        except ImportError:
            from services.vault_validation_service import diagnose_flaws_and_lessons
            from database import record_trade_self_learning
        outcome = "PASSED" if final_pnl > 0 else ("FAILED" if final_pnl < 0 else "BREAKEVEN")
        flaw, lesson = diagnose_flaws_and_lessons(
            asset=pos.symbol,
            direction=pos.side,
            status=outcome,
            entry=pos.entry_price,
            sl=pos.stop_loss or 0.0,
            tp=pos.take_profit or 0.0,
            exit_price=close_price
        )
        record_trade_self_learning(
            trade_id=pos.id,
            asset=pos.symbol,
            direction=pos.side,
            pnl=final_pnl,
            outcome=outcome,
            flaw=flaw,
            lesson=lesson
        )
    except Exception:
        pass

    return pos.model_dump()


def get_execution_state(account_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve full portfolio execution state for specified or active demo account."""
    target_acc = get_demo_account(account_id) if account_id else get_active_demo_account()
    if not target_acc:
        target_acc = get_active_demo_account()

    acc_id = target_acc["id"]

    # Guarantee in-memory ACTIVE_POSITIONS is fully hydrated with SQLite open positions
    try:
        db_open = get_open_paper_trades(account_id=acc_id)
        for r in db_open:
            if r["id"] not in ACTIVE_POSITIONS:
                p = Position(
                    id=r["id"],
                    account_id=r.get("account_id") or acc_id,
                    symbol=r["symbol"],
                    side=r["side"],
                    quantity=float(r["quantity"]),
                    entry_price=float(r["entry_price"]),
                    current_price=float(r["current_price"] or r["entry_price"]),
                    stop_loss=float(r["stop_loss"]) if r.get("stop_loss") is not None else None,
                    take_profit=float(r["take_profit"]) if r.get("take_profit") is not None else None,
                    leverage=float(r.get("leverage") or 1.0),
                    margin_usd=float(r.get("margin_usd") or 0.0),
                    unrealized_pnl=float(r.get("unrealized_pnl") or 0.0),
                    unrealized_pnl_pct=0.0,
                    status="OPEN",
                    opened_at=r["opened_at"]
                )
                ACTIVE_POSITIONS[p.id] = p
    except Exception:
        pass

    # Filter positions by account
    open_list = [p.model_dump() for p in ACTIVE_POSITIONS.values() if (p.account_id or "ACC_DEFAULT") == acc_id]
    closed_rows = get_closed_paper_trades(limit=100, account_id=acc_id)
    closed_list = closed_rows if closed_rows else [
        p.model_dump() for p in CLOSED_TRADES if (p.account_id or "ACC_DEFAULT") == acc_id
    ][:100]

    total_trades = target_acc.get("win_count", 0) + target_acc.get("loss_count", 0)
    win_rate = round((target_acc.get("win_count", 0) / max(total_trades, 1)) * 100, 1)

    # Dynamic recalculation of equity based on active positions
    open_unrealized = sum(p.get("unrealized_pnl", 0.0) for p in open_list)
    calc_equity = max(0.0, round(float(target_acc.get("balance", 0.0)) + open_unrealized, 2))
    calc_margin_used = round(sum(p.get("margin_usd", 0.0) for p in open_list), 2)
    calc_available = max(0.0, round(calc_equity - calc_margin_used, 2))

    target_acc["equity"] = calc_equity
    target_acc["margin_used"] = calc_margin_used
    target_acc["available_margin"] = calc_available

    return {
        "account": {
            **target_acc,
            "total_trades": total_trades,
            "win_rate_pct": win_rate
        },
        "open_positions": open_list,
        "closed_positions": closed_list
    }


def reset_account_capital(new_capital: float, hard_reset: bool = True, account_id: Optional[str] = None) -> Dict[str, Any]:
    """Reset target demo account capital and optionally wipe active trades."""
    target_acc_id = account_id or get_active_demo_account()["id"]
    clean_cap = max(1.0, float(new_capital))

    if hard_reset:
        # Remove positions from memory for this account
        for pid in list(ACTIVE_POSITIONS.keys()):
            if (ACTIVE_POSITIONS[pid].account_id or "ACC_DEFAULT") == target_acc_id:
                del ACTIVE_POSITIONS[pid]

    reset_demo_account(target_acc_id, clean_cap)
    return get_execution_state(target_acc_id)
