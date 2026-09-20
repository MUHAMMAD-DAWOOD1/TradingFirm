"""
Capital Tailoring & Risk Management Sizing Service
Calculates exact institutional position sizing, dollar risk, dollar profit,
and leverage limits tailored directly to the trader's account capital.
Features dynamic capital-scaled SL/TP calculation and account liquidation prevention.
"""

from typing import Dict, Any, Tuple

def get_contract_specs(symbol: str) -> Dict[str, Any]:
    """Returns institutional contract specifications for dynamic sizing."""
    sym = symbol.upper().replace("/", "").replace("-", "")
    if "XAU" in sym or "GOLD" in sym or "PAXG" in sym:
        return {
            "type": "METALS",
            "contract_size": 100.0,  # 1 lot = 100 oz
            "decimals": 2,
            "min_lot": 0.01,
            "min_sl_distance": 2.50,  # minimum 25 pips on gold to avoid spread noise
            "max_sl_distance_micro": 4.50,  # tight bounds for micro accounts ($10-$50)
            "normal_sl_distance": 10.0,
            "pip_unit": 0.10,
            "point_name": "Points ($)"
        }
    elif "JPY" in sym:
        return {
            "type": "FOREX_JPY",
            "contract_size": 100000.0,
            "decimals": 3,
            "min_lot": 0.01,
            "min_sl_distance": 0.20,  # 20 pips
            "max_sl_distance_micro": 0.35,  # 35 pips
            "normal_sl_distance": 0.50,
            "pip_unit": 0.01,
            "point_name": "Pips"
        }
    elif any(f in sym for f in ["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF"]):
        return {
            "type": "FOREX",
            "contract_size": 100000.0,
            "decimals": 4,
            "min_lot": 0.01,
            "min_sl_distance": 0.0015,  # 15 pips
            "max_sl_distance_micro": 0.0030,  # 30 pips
            "normal_sl_distance": 0.0045,
            "pip_unit": 0.0001,
            "point_name": "Pips"
        }
    elif "BTC" in sym:
        return {
            "type": "CRYPTO_BTC",
            "contract_size": 1.0,
            "decimals": 2,
            "min_lot": 0.01,
            "min_sl_distance": 250.0,
            "max_sl_distance_micro": 450.0,
            "normal_sl_distance": 800.0,
            "pip_unit": 1.0,
            "point_name": "USD Points"
        }
    elif "ETH" in sym:
        return {
            "type": "CRYPTO_ETH",
            "contract_size": 1.0,
            "decimals": 2,
            "min_lot": 0.01,
            "min_sl_distance": 18.0,
            "max_sl_distance_micro": 35.0,
            "normal_sl_distance": 60.0,
            "pip_unit": 1.0,
            "point_name": "USD Points"
        }
    else:
        return {
            "type": "GENERIC",
            "contract_size": 1.0,
            "decimals": 2,
            "min_lot": 0.01,
            "min_sl_distance": 1.0,
            "max_sl_distance_micro": 3.0,
            "normal_sl_distance": 5.0,
            "pip_unit": 1.0,
            "point_name": "Points"
        }

def calculate_capital_scaled_levels(
    symbol: str,
    current_price: float,
    direction: str = "BUY",
    capital: float = 10000.0,
    leverage: float = 100.0,
    lot_size: float = 0.01,
    risk_pct: float = 2.0
) -> Dict[str, Any]:
    """
    Mathematically calculates exact, survivable Entry, Stop-Loss, TP1, and TP2
    levels tailored directly to the trader's active Demo Account balance,
    selected leverage, and lot size. Guarantees that small accounts ($10 to $50)
    never face premature liquidation before their SL triggers.
    """
    cap = max(5.0, float(capital))
    lev = max(1.0, float(leverage))
    lots = max(0.01, float(lot_size))
    entry = max(0.0001, float(current_price))
    dir_clean = direction.upper().strip()
    if dir_clean not in ["BUY", "SELL"]:
        dir_clean = "BUY"

    spec = get_contract_specs(symbol)
    decimals = spec["decimals"]
    contract_size = spec["contract_size"]

    # 1. Calculate dollar value per 1.0 price unit move
    # e.g., Gold: 100 * 0.01 = $1.00 / point move
    dollar_per_point = contract_size * lots

    # 2. Maximum Dollar Risk Budget
    is_micro_account = cap <= 50.0
    if is_micro_account:
        # For micro accounts ($10 - $50), risk must be capped strictly so account retains
        # at least 60-70% buffer after SL hit. E.g. on $10 account: max risk = $3.00 to $3.50.
        max_dollar_loss = round(min(3.50, cap * 0.35), 2)
    elif cap <= 500.0:
        max_dollar_loss = round(cap * (min(5.0, max(1.0, risk_pct)) / 100.0), 2)
    else:
        # Standard institutional 1-2% risk
        max_dollar_loss = round(cap * (min(3.0, max(0.5, risk_pct)) / 100.0), 2)

    # 3. Calculate Point Distance for Stop Loss
    calculated_sl_dist = max_dollar_loss / dollar_per_point

    if is_micro_account:
        sl_distance = max(spec["min_sl_distance"], min(calculated_sl_dist, spec["max_sl_distance_micro"]))
    else:
        sl_distance = max(spec["min_sl_distance"], min(calculated_sl_dist, spec["normal_sl_distance"]))

    # Re-verify dollar loss with bounded distance
    actual_dollar_loss = round(sl_distance * dollar_per_point, 2)
    # Safety clamp: never allow dollar loss to exceed 50% of capital under any circumstance
    if actual_dollar_loss > (cap * 0.50):
        actual_dollar_loss = round(cap * 0.40, 2)
        sl_distance = round(actual_dollar_loss / dollar_per_point, decimals)

    # 4. Asymmetric Targets (1:2 R:R for TP1, 1:3 R:R for TP2)
    tp1_distance = round(sl_distance * 2.0, decimals)
    tp2_distance = round(sl_distance * 3.0, decimals)
    tp1_gain_usd = round(tp1_distance * dollar_per_point, 2)
    tp2_gain_usd = round(tp2_distance * dollar_per_point, 2)

    # 5. Price Level Computations
    if dir_clean == "BUY":
        stop_loss = round(entry - sl_distance, decimals)
        target_1 = round(entry + tp1_distance, decimals)
        target_2 = round(entry + tp2_distance, decimals)
    else:
        stop_loss = round(entry + sl_distance, decimals)
        target_1 = round(entry - tp1_distance, decimals)
        target_2 = round(entry - tp2_distance, decimals)

    # 6. Broker Margin & Liquidation Buffer Check
    notional_value = entry * dollar_per_point
    margin_required = round(notional_value / lev, 2)
    available_margin_after = round(max(0.0, cap - margin_required), 2)

    # Stopout occurs when equity reaches broker stopout (assume 20% margin level or zero free margin)
    # Liquidation point delta = free capital / dollar_per_point
    liquidation_distance = round(cap / dollar_per_point, decimals)
    if dir_clean == "BUY":
        liquidation_price = round(entry - liquidation_distance, decimals)
    else:
        liquidation_price = round(entry + liquidation_distance, decimals)

    # Is SL safe before liquidation?
    is_safe = sl_distance < liquidation_distance
    buffer_points = round(abs(liquidation_distance - sl_distance), decimals)

    # 7. Actionable Roman Urdu Advisory
    advisory_urdu = (
        f"Aap ke ${cap:,.2f} account capital aur {lots} lot size ke mutabiq dynamic intraday SL ${stop_loss:,.2f} "
        f"({sl_distance} points) tayyar kiya gaya hai. Agar SL hit hota hai to aap ka exact dollar loss sirf -${actual_dollar_loss:,.2f} hoga "
        f"aur account mein ${round(cap - actual_dollar_loss, 2):,.2f} balance mehfooz rahega (Account wash nahi hoga!). "
        f"TP1 Target (${target_1:,.2f}) par +${tp1_gain_usd:,.2f} (+{round((tp1_gain_usd/cap)*100, 1)}%) aur "
        f"TP2 Target (${target_2:,.2f}) par +${tp2_gain_usd:,.2f} (+{round((tp2_gain_usd/cap)*100, 1)}%) projected profit hai."
    )

    return {
        "symbol": symbol.upper(),
        "direction": dir_clean,
        "entry_price": entry,
        "stop_loss": stop_loss,
        "target_1": target_1,
        "target_2": target_2,
        "sl_distance_points": sl_distance,
        "tp1_distance_points": tp1_distance,
        "tp2_distance_points": tp2_distance,
        "risk_reward": "1:2.0",
        "risk_reward_tp2": "1:3.0",
        "max_dollar_loss": actual_dollar_loss,
        "tp1_gain_usd": tp1_gain_usd,
        "tp2_gain_usd": tp2_gain_usd,
        "user_capital": cap,
        "leverage": lev,
        "lot_size": lots,
        "notional_value_usd": notional_value,
        "margin_required_usd": margin_required,
        "available_margin_remaining": available_margin_after,
        "liquidation_price": liquidation_price,
        "liquidation_buffer_points": buffer_points,
        "is_sl_safe_from_liquidation": is_safe,
        "account_survivability": "SAFE_SURVIVABLE" if is_safe else "HIGH_LEVERAGE_WARNING",
        "advisory_urdu": advisory_urdu
    }

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
    capital = max(5.0, float(user_capital))
    risk_percent = min(10.0, max(0.25, float(risk_pct)))
    entry = max(0.0001, float(entry_price))
    sl = float(stop_loss)
    tp = float(take_profit)

    # 1. Maximum Dollar Risk Allowed
    if capital <= 50:
        max_risk_usd = round(min(3.50, capital * 0.35), 2)
    else:
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
    is_gold = "XAU" in symbol.upper() or "GOLD" in symbol.upper()
    lots_val = max(0.01, round(units / 100.0, 2))
    lot_size_str = f"{lots_val} Lots" if is_gold else f"{units} {symbol.upper()}"
    lot_size_float = lots_val if is_gold else units

    # 6. Recommended Leverage & Margin
    if capital < 500:
        recommended_leverage = 20.0
    elif capital < 2000:
        recommended_leverage = 10.0
    else:
        effective_leverage = round(notional_value_usd / capital, 2)
        recommended_leverage = min(10.0, max(1.0, round(effective_leverage)))
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
        f"Aap ke ${capital:,.2f} account capital par maximum risk ${max_risk_usd:,.2f} fix kiya gaya hai. "
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
        "lot_size_float": lot_size_float,
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
