"""
Capital Tailoring & Risk Management Sizing Service
Calculates exact institutional position sizing, dollar risk, dollar profit,
and leverage limits tailored directly to the trader's account capital.
"""

from typing import Dict, Any

def calculate_tailored_plan(
    user_capital: float,
    risk_pct: float,
    entry_price: float,
    stop_loss: float,
    take_profit: float,
    symbol: str = "XAUUSD"
) -> Dict[str, Any]:
    """
    Computes mathematical position sizing and risk profile tailored to specific capital.
    """
    capital = max(100.0, float(user_capital))
    risk_percent = min(10.0, max(0.25, float(risk_pct)))
    entry = max(0.0001, float(entry_price))
    sl = float(stop_loss)
    tp = float(take_profit)

    # 1. Maximum Dollar Risk Allowed
    max_risk_usd = round(capital * (risk_percent / 100.0), 2)

    # 2. Invalidation Distance (Stop-Loss Delta)
    sl_distance = max(0.0001, abs(entry - sl))
    sl_distance_pct = round((sl_distance / entry) * 100, 2)

    # 3. Target Profit Distance (Take-Profit Delta)
    tp_distance = max(0.0001, abs(tp - entry))
    tp_distance_pct = round((tp_distance / entry) * 100, 2)

    # 4. Asymmetric Risk/Reward Ratio
    rr_ratio = round(tp_distance / sl_distance, 2)

    # 5. Position Sizing (Exact Units / Lots)
    units = round(max_risk_usd / sl_distance, 4)
    notional_value_usd = round(units * entry, 2)

    # Forex/Gold Standard Lot Conversion
    # 1 Lot of Gold = 100 oz. 1 unit = 0.01 lot.
    is_gold = "XAU" in symbol.upper()
    lots_val = max(0.01, round(units / 100.0, 2))
    lot_size_str = f"{lots_val} Lots" if is_gold else f"{units} {symbol.upper()}"

    # 6. Recommended Leverage & Margin
    # Safe institutional rule: max 2x-5x effective leverage
    effective_leverage = round(notional_value_usd / capital, 2)
    recommended_leverage = min(5.0, max(1.0, round(effective_leverage)))
    margin_required_usd = round(notional_value_usd / max(1.0, recommended_leverage), 2)
    free_margin_remaining = round(max(0.0, capital - margin_required_usd), 2)

    # 7. Projected Dollar Gains
    tp1_price = round(entry + (sl_distance * 1.5) if tp > entry else entry - (sl_distance * 1.5), 2)
    tp1_gain_usd = round(max_risk_usd * 1.5, 2)
    tp1_gain_pct = round((tp1_gain_usd / capital) * 100, 2)

    tp2_gain_usd = round(units * tp_distance, 2)
    tp2_gain_pct = round((tp2_gain_usd / capital) * 100, 2)

    # 8. Actionable Roman Urdu Advisory
    sizing_hidayat = (
        f"Aap ke ${capital:,.2f} account capital par maximum risk ${max_risk_usd:,.2f} ({risk_percent}%) fix kiya gaya hai. "
        f"Is trade ke liye recommended position size {units} units ({lot_size_str}) hai. "
        f"Agar trade Invalidation SL (${sl:,.2f}) hit karti hai to aap ka exact dollar loss ${max_risk_usd:,.2f} hoga. "
        f"Agar Take-Profit (${tp:,.2f}) achieve hota hai to aap ka projected profit +${tp2_gain_usd:,.2f} (+{tp2_gain_pct}%) hoga."
    )

    return {
        "user_capital": capital,
        "risk_pct": risk_percent,
        "max_risk_usd": max_risk_usd,
        "entry_price": entry,
        "stop_loss": sl,
        "take_profit": tp,
        "sl_distance_usd": round(sl_distance, 2),
        "sl_distance_pct": sl_distance_pct,
        "tp_distance_usd": round(tp_distance, 2),
        "tp_distance_pct": tp_distance_pct,
        "risk_reward_ratio": f"1:{rr_ratio}",
        "position_units": units,
        "lot_size_str": lot_size_str,
        "notional_value_usd": notional_value_usd,
        "recommended_leverage": f"{recommended_leverage}x",
        "margin_required_usd": margin_required_usd,
        "free_margin_remaining": free_margin_remaining,
        "tp1_target": tp1_price,
        "tp1_gain_usd": tp1_gain_usd,
        "tp1_gain_pct": tp1_gain_pct,
        "tp2_target": tp,
        "tp2_gain_usd": tp2_gain_usd,
        "tp2_gain_pct": tp2_gain_pct,
        "sizing_advisory_urdu": sizing_hidayat
    }
