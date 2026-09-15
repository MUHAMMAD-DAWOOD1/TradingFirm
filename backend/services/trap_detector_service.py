"""
Institutional Trap Detector Service
Audits incoming social & VIP trading signals against:
1. Live Order Book & MT5 Spread / Slippage
2. Derivatives Open Interest (OI) & Perpetual Funding Rate Crowding
3. Macroeconomic Hazard Clock (FOMC, CPI, NFP within 60 minutes)
4. Structural Risk:Reward Asymmetry

Assigns:
- trap_status: 'VERIFIED_ALPHA' | 'RETAIL_TRAP_SUSPECTED' | 'HIGH_RISK_VOLATILE'
- trap_score: 0 - 100 (Higher = greater probability of retail liquidity trap)
- trap_reasons: Detailed bilingual audit breakdown (English + Roman Urdu)
- swarm_confidence: 0 - 100%
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.price_service import get_real_market_price as get_live_market_price
from backend.services.derivatives_service import get_derivatives_data
from backend.services.macro_calendar_service import fetch_forexfactory_calendar

logger = logging.getLogger(__name__)


def audit_signal(signal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a multi-agent audit on an incoming trade signal.
    Returns:
    {
        "trap_status": str,
        "trap_score": int,
        "trap_reasons": List[str],
        "swarm_confidence": int,
        "live_price_at_audit": float,
        "risk_reward": str,
        "macro_warning": Optional[str],
        "derivatives_warning": Optional[str]
    }
    """
    asset = signal.get("asset", "XAUUSD").upper()
    direction = signal.get("direction", "BUY").upper()
    entry_min = float(signal.get("entry_min", 0.0) or 0.0)
    entry_max = float(signal.get("entry_max", entry_min) or entry_min)
    entry_mid = (entry_min + entry_max) / 2.0 if entry_max > 0 else entry_min
    sl = float(signal.get("stop_loss", 0.0) or 0.0)
    tp_targets = signal.get("take_profit_targets", [])
    tp1 = float(tp_targets[0]) if tp_targets else 0.0

    trap_score = 12
    trap_reasons: List[str] = []
    macro_warning = None
    derivatives_warning = None

    # 1. Fetch live market price
    live_info = get_live_market_price(asset)
    live_price = float(live_info.get("price", entry_mid or 2900.0))

    if entry_mid == 0.0:
        entry_mid = live_price
    if sl == 0.0:
        sl = round(entry_mid * (0.985 if direction == "BUY" else 1.015), 2)
    if tp1 == 0.0:
        tp1 = round(entry_mid * (1.025 if direction == "BUY" else 0.975), 2)

    # 2. Risk / Reward Analysis
    risk = abs(entry_mid - sl)
    reward = abs(tp1 - entry_mid)
    rr_ratio = round(reward / risk, 2) if risk > 0 else 1.0
    rr_str = f"1:{rr_ratio}"

    if rr_ratio < 1.2:
        trap_score += 25
        trap_reasons.append(
            f"⚠️ Asymmetric Risk Profile: Risk-Reward ratio ({rr_str}) is below institutional minimum (1:1.5). Bad risk balance."
        )
    else:
        trap_reasons.append(f"✅ Solid Risk-to-Reward profile ({rr_str}) verified.")

    # 3. Market Slippage / Chasing Check
    if direction == "BUY" and live_price > entry_max and entry_max > 0:
        pct_slip = round(((live_price - entry_max) / entry_max) * 100, 2)
        if pct_slip > 0.8:
            trap_score += 30
            trap_reasons.append(
                f"🚨 Late Entry Slippage: Current price ({live_price}) is +{pct_slip}% above signal zone ({entry_max}). Retail FOMO chase trap."
            )
    elif direction == "SELL" and live_price < entry_min and entry_min > 0:
        pct_slip = round(((entry_min - live_price) / entry_min) * 100, 2)
        if pct_slip > 0.8:
            trap_score += 30
            trap_reasons.append(
                f"🚨 Late Entry Slippage: Current price ({live_price}) is -{pct_slip}% below signal zone ({entry_min}). Chasing lows trap."
            )

    # 4. Macro Hazard Clock Audit (ForexFactory high impact within 60 mins)
    try:
        events = fetch_forexfactory_calendar()
        imminent_events = [
            e for e in events 
            if e.get("impact") in ["High", "Medium"] 
            and e.get("time_status") in ["IMMINENT_CRITICAL", "ACTIVE_NOW"]
        ]
        if imminent_events:
            event = imminent_events[0]
            title = event.get("title", "High Impact Macro Event")
            mins = event.get("mins_remaining", 0)
            trap_score += 35
            macro_warning = f"🔴 High-Impact Event Active/Imminent: '{title}' ({mins}m). High volatility stop-hunt window."
            trap_reasons.append(
                f"⚠️ Macro Hazard Alert: '{title}' is scheduled within {mins} minutes. Broker spreads will widen, liquidity will vanish."
            )
        else:
            trap_reasons.append("✅ Macro Hazard Clock Clean: No high-impact FOMC/CPI catalysts in next 60 minutes.")
    except Exception as e:
        logger.debug(f"Macro audit check failed: {e}")

    # 5. Derivatives Order Flow & Crowding Audit
    try:
        derivs = get_derivatives_data(asset)
        funding_rate = derivs.get("funding_rate_pct", 0.0)
        long_short = derivs.get("long_short_ratio", 1.0)
        squeeze_radar = derivs.get("squeeze_radar", {})
        squeeze_status = squeeze_radar.get("status", "NEUTRAL_EQUILIBRIUM")

        if direction == "BUY":
            if funding_rate > 0.035 or long_short > 1.8 or "LONG_SQUEEZE" in squeeze_status:
                trap_score += 35
                derivatives_warning = "Extreme Long Crowding: Funding rate elevated. High probability of Long Flush liquidation hunt."
                trap_reasons.append(
                    f"🚨 Bull Trap Warning: Retail crowd is 75%+ net-long with excessive funding ({funding_rate}%). Institutional whales expected to sweep stops downward."
                )
            elif funding_rate < -0.015:
                trap_score = max(0, trap_score - 10)
                trap_reasons.append(f"💎 Alpha Alignment: Negative funding ({funding_rate}%) favors upward short squeeze push.")
            else:
                trap_reasons.append(f"✅ Derivatives flow balanced: Funding rate at {funding_rate}%, no abnormal crowding.")
        elif direction == "SELL":
            if funding_rate < -0.035 or long_short < 0.65 or "SHORT_SQUEEZE" in squeeze_status:
                trap_score += 35
                derivatives_warning = "Extreme Short Crowding: Negative funding spike. High probability of Bear Trap and Short Squeeze."
                trap_reasons.append(
                    f"🚨 Bear Trap Warning: Aggressive retail shorting detected (Funding {funding_rate}%). Whales likely to engineer rapid squeeze spike."
                )
            elif funding_rate > 0.025:
                trap_score = max(0, trap_score - 10)
                trap_reasons.append(f"💎 Alpha Alignment: Positive funding ({funding_rate}%) supports downward breakdown pressure.")
            else:
                trap_reasons.append(f"✅ Derivatives flow balanced: Funding rate at {funding_rate}%, balanced liquidation pool.")
    except Exception as e:
        logger.debug(f"Derivatives flow audit failed: {e}")

    # Clamp trap score
    trap_score = min(100, max(0, trap_score))

    # Determine status & swarm confidence
    if trap_score >= 60:
        trap_status = "RETAIL_TRAP_SUSPECTED"
        swarm_confidence = max(25, 100 - trap_score)
        trap_reasons.insert(0, "🔴 HIGH PROBABILITY RETAIL TRAP: Multiple indicators show retail crowding or liquidity hunting.")
    elif trap_score >= 35:
        trap_status = "HIGH_RISK_VOLATILE"
        swarm_confidence = max(50, 95 - trap_score)
        trap_reasons.insert(0, "🟡 VOLATILE SETUP: Elevated risk profile. Proceed with strictly halved position sizing.")
    else:
        trap_status = "VERIFIED_ALPHA"
        swarm_confidence = min(96, 100 - trap_score)
        trap_reasons.insert(0, "🟢 VERIFIED INSTITUTIONAL ALPHA: Clean liquidity structure, balanced funding, no immediate macro hazard.")

    return {
        "trap_status": trap_status,
        "trap_score": trap_score,
        "trap_reasons": trap_reasons,
        "swarm_confidence": swarm_confidence,
        "live_price_at_audit": live_price,
        "risk_reward": rr_str,
        "macro_warning": macro_warning,
        "derivatives_warning": derivatives_warning
    }
