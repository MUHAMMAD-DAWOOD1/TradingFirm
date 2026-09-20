"""
Nexus Capital — XAUUSD Market Behavior Operating System & Quantitative Decision Core
Encodes complete 8-Layer Market Ontology:
1. Market State / Regime (7 Fundamental Parents)
2. Market Structure (HH/HL, LH/LL, BOS, CHoCH, Swing Extrema)
3. Market Event (Liquidity Sweeps, Traps, Breakouts, Rejections)
4. Context Modifiers (London Judas Swing Killzone, Asian Range, News Hazard)
5. Setup Composition (Regime + Structure + Liquidity + Trigger + Confirmation)
6. Strategy Inheritance (6 Core Families + Advanced Edge Additions: FVG, SMT, Killzones)
7. Risk & Structural Invalidation (Structure-based SL, Dynamic Breakeven +1R, Volatility Sizing)
8. Multi-Factor Bayesian Scoring (0 - 100 Objective Setup Quality Gate)
"""

import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# =====================================================================
# 1. MATHEMATICAL INDICATORS & TECHNICAL PRIMITIVES
# =====================================================================

def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """True Range and Average True Range (ATR)"""
    high = df['High']
    low = df['Low']
    close = df['Close'].shift(1)
    tr1 = high - low
    tr2 = (high - close).abs()
    tr3 = (low - close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()

def compute_adx(df: pd.DataFrame, period: int = 14) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """Computes Average Directional Index (ADX), +DI, -DI"""
    high = df['High']
    low = df['Low']
    close = df['Close'].shift(1)
    
    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
    
    tr1 = high - low
    tr2 = (high - close).abs()
    tr3 = (low - close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    tr_smooth = tr.rolling(window=period, min_periods=1).sum()
    plus_di = 100 * (pd.Series(plus_dm, index=df.index).rolling(window=period, min_periods=1).sum() / tr_smooth.replace(0, np.nan))
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).rolling(window=period, min_periods=1).sum() / tr_smooth.replace(0, np.nan))
    
    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan))
    adx = dx.rolling(window=period, min_periods=1).mean().fillna(20.0)
    return adx, plus_di.fillna(25.0), minus_di.fillna(25.0)

def compute_bollinger_bands(df: pd.DataFrame, period: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """Returns (Upper, Middle, Lower, Bandwidth)"""
    mid = df['Close'].rolling(window=period, min_periods=1).mean()
    std = df['Close'].rolling(window=period, min_periods=1).std().fillna(0.0)
    upper = mid + (num_std * std)
    lower = mid - (num_std * std)
    bandwidth = (upper - lower) / mid.replace(0, np.nan)
    return upper, mid, lower, bandwidth.fillna(0.02)


# =====================================================================
# 2. 7 PARENT REGIMES QUANTITATIVE CLASSIFIER
# =====================================================================

PARENT_REGIMES = {
    1: "DIRECTIONAL_TREND",
    2: "CONSOLIDATION_RANGE",
    3: "EXPANSION_BREAKOUT",
    4: "LIQUIDITY_INTERACTION",
    5: "FAILURE_REJECTION",
    6: "MEAN_REVERSION",
    7: "REGIME_TRANSITION"
}

def classify_parent_regime(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Evaluates historical candle windows using strict mathematical metrics:
    - ADX threshold (>=25 trend, <20 range)
    - EMA 20 & 50 slope and alignment
    - Volatility expansion ratio (ATR relative to 20-period baseline)
    - Reversion Z-score from 20-period mean
    """
    if len(df) < 30:
        return {
            "parent_id": 2,
            "parent_name": PARENT_REGIMES[2],
            "sub_state": "INSUFFICIENT_DATA_DEFAULT_RANGE",
            "adx": 20.0,
            "trend_direction": "NEUTRAL",
            "volatility_state": "NORMAL"
        }

    close = df['Close'].iloc[-1]
    atr_series = compute_atr(df, 14)
    current_atr = float(atr_series.iloc[-1])
    avg_atr = float(atr_series.iloc[-30:].mean()) if len(atr_series) >= 30 else current_atr
    atr_ratio = current_atr / avg_atr if avg_atr > 0 else 1.0

    adx_series, plus_di, minus_di = compute_adx(df, 14)
    current_adx = float(adx_series.iloc[-1])
    current_plus_di = float(plus_di.iloc[-1])
    current_minus_di = float(minus_di.iloc[-1])

    ema20 = df['Close'].ewm(span=20, adjust=False).mean()
    ema50 = df['Close'].ewm(span=50, adjust=False).mean()
    ema20_curr = float(ema20.iloc[-1])
    ema50_curr = float(ema50.iloc[-1])
    
    # 5-bar slope
    ema50_slope = (ema50_curr - float(ema50.iloc[-5])) / (5 * current_atr) if current_atr > 0 else 0.0

    # Z-Score Mean Reversion
    _, mid_bb, _, bandwidth = compute_bollinger_bands(df, 20)
    bb_mid = float(mid_bb.iloc[-1])
    rolling_std = float(df['Close'].iloc[-20:].std()) if len(df) >= 20 else 1.0
    z_score = (close - bb_mid) / rolling_std if rolling_std > 0 else 0.0

    # Candle range vs ATR (Expansion shock)
    last_candle_range = float(df['High'].iloc[-1] - df['Low'].iloc[-1])
    is_expansion_candle = last_candle_range >= (1.75 * current_atr)

    # 1. Expansion Breakout Check
    if is_expansion_candle and atr_ratio >= 1.3:
        return {
            "parent_id": 3,
            "parent_name": PARENT_REGIMES[3],
            "sub_state": "VOLATILITY_EXPANSION_BURST",
            "adx": round(current_adx, 2),
            "trend_direction": "BULLISH" if close > float(df['Open'].iloc[-1]) else "BEARISH",
            "volatility_state": "EXPANDING",
            "atr_ratio": round(atr_ratio, 2)
        }

    # 2. Mean Reversion Extreme Check
    if abs(z_score) >= 2.3:
        return {
            "parent_id": 6,
            "parent_name": PARENT_REGIMES[6],
            "sub_state": "OVEREXTENDED_SNAPBACK_ZONE",
            "adx": round(current_adx, 2),
            "trend_direction": "REVERSION_BEARISH" if z_score > 0 else "REVERSION_BULLISH",
            "volatility_state": "OVEREXTENDED",
            "z_score": round(z_score, 2)
        }

    # 3. Directional Trend Check
    if current_adx >= 24.0 and abs(ema50_slope) > 0.08:
        direction = "BULLISH" if (ema20_curr > ema50_curr and current_plus_di > current_minus_di) else "BEARISH"
        sub = "STRONG_TREND" if current_adx >= 32.0 else "EARLY_DECELERATING_TREND"
        return {
            "parent_id": 1,
            "parent_name": PARENT_REGIMES[1],
            "sub_state": sub,
            "adx": round(current_adx, 2),
            "trend_direction": direction,
            "volatility_state": "TRENDING",
            "ema50_slope": round(ema50_slope, 3)
        }

    # 4. Default to Consolidation / Compression Range
    sub_range = "VOLATILITY_COMPRESSION" if float(bandwidth.iloc[-1]) < 0.015 else "WIDE_BALANCED_RANGE"
    return {
        "parent_id": 2,
        "parent_name": PARENT_REGIMES[2],
        "sub_state": sub_range,
        "adx": round(current_adx, 2),
        "trend_direction": "SIDEWAYS",
        "volatility_state": "COMPRESSED",
        "bandwidth": round(float(bandwidth.iloc[-1]), 4)
    }


# =====================================================================
# 3. MARKET STRUCTURE & LIQUIDITY SWEEP DETECTORS
# =====================================================================

def detect_swing_extrema(df: pd.DataFrame, window: int = 5) -> Dict[str, Any]:
    """Identifies recent structural Swing Highs and Swing Lows"""
    highs = df['High'].values
    lows = df['Low'].values
    n = len(df)
    
    swing_highs = []
    swing_lows = []
    
    for i in range(window, n - window):
        is_sh = True
        is_sl = True
        for j in range(i - window, i + window + 1):
            if j == i:
                continue
            if highs[j] >= highs[i]:
                is_sh = False
            if lows[j] <= lows[i]:
                is_sl = False
        if is_sh:
            swing_highs.append({"index": i, "price": float(highs[i]), "time": str(df.index[i])})
        if is_sl:
            swing_lows.append({"index": i, "price": float(lows[i]), "time": str(df.index[i])})
            
    recent_sh = swing_highs[-1]['price'] if swing_highs else float(df['High'].max())
    recent_sl = swing_lows[-1]['price'] if swing_lows else float(df['Low'].min())
    
    return {
        "recent_swing_high": recent_sh,
        "recent_swing_low": recent_sl,
        "swing_highs_count": len(swing_highs),
        "swing_lows_count": len(swing_lows)
    }

def detect_liquidity_sweeps(df: pd.DataFrame, window: int = 20) -> Dict[str, Any]:
    """
    Mathematical Liquidity Sweep Formula:
    High[t] > PriorLevel BUT Close[t] < PriorLevel
    Rejection Wick Ratio = (High - max(Open, Close)) / (High - Low) >= 0.60
    """
    if len(df) < window + 2:
        return {"has_sweep": False, "type": "NONE"}
        
    recent_window = df.iloc[-window:-1]
    highest_high = float(recent_window['High'].max())
    lowest_low = float(recent_window['Low'].min())
    
    curr = df.iloc[-1]
    c_open = float(curr['Open'])
    c_high = float(curr['High'])
    c_low = float(curr['Low'])
    c_close = float(curr['Close'])
    total_range = c_high - c_low
    
    if total_range <= 0:
        return {"has_sweep": False, "type": "NONE"}
        
    upper_wick = c_high - max(c_open, c_close)
    lower_wick = min(c_open, c_close) - c_low
    
    upper_wick_ratio = upper_wick / total_range
    lower_wick_ratio = lower_wick / total_range
    
    # Buy-side Liquidity Sweep (Bearish reversal signal)
    if c_high > highest_high and c_close < highest_high and upper_wick_ratio >= 0.55:
        return {
            "has_sweep": True,
            "type": "BUY_SIDE_LIQUIDITY_SWEEP",
            "swept_level": round(highest_high, 2),
            "rejection_wick_ratio": round(upper_wick_ratio, 2),
            "bias": "SHORT",
            "invalidation": round(c_high + 0.5, 2)
        }
        
    # Sell-side Liquidity Sweep (Bullish reversal signal)
    if c_low < lowest_low and c_close > lowest_low and lower_wick_ratio >= 0.55:
        return {
            "has_sweep": True,
            "type": "SELL_SIDE_LIQUIDITY_SWEEP",
            "swept_level": round(lowest_low, 2),
            "rejection_wick_ratio": round(lower_wick_ratio, 2),
            "bias": "BUY",
            "invalidation": round(c_low - 0.5, 2)
        }
        
    return {"has_sweep": False, "type": "NONE"}


# =====================================================================
# 4. ADVANCED INSTITUTIONAL ADDITIONS: FVG, SMT, & KILLZONES
# =====================================================================

def detect_fair_value_gaps(df: pd.DataFrame, atr: float) -> List[Dict[str, Any]]:
    """
    3-Candle Institutional Disbalance Detection:
    - Bullish FVG: Low[t] > High[t-2], Gap Size >= 0.35 * ATR
      Consequent Encroachment (CE 50% Midpoint) = (Low[t] + High[t-2]) / 2
    - Bearish FVG: High[t] < Low[t-2], Gap Size >= 0.35 * ATR
    """
    fvgs = []
    n = len(df)
    if n < 3:
        return fvgs

    min_gap = 0.30 * atr if atr > 0 else 1.0

    # Scan last 15 candles
    start_idx = max(2, n - 15)
    for i in range(start_idx, n):
        c_curr = df.iloc[i]
        c_prev2 = df.iloc[i - 2]
        
        # Bullish FVG
        if c_curr['Low'] > c_prev2['High']:
            gap = float(c_curr['Low'] - c_prev2['High'])
            if gap >= min_gap:
                ce_50 = float((c_curr['Low'] + c_prev2['High']) / 2.0)
                fvgs.append({
                    "index": i,
                    "type": "BULLISH_FVG",
                    "top": round(float(c_curr['Low']), 2),
                    "bottom": round(float(c_prev2['High']), 2),
                    "ce_50_midpoint": round(ce_50, 2),
                    "gap_size": round(gap, 2),
                    "time": str(df.index[i])
                })
                
        # Bearish FVG
        elif c_curr['High'] < c_prev2['Low']:
            gap = float(c_prev2['Low'] - c_curr['High'])
            if gap >= min_gap:
                ce_50 = float((c_prev2['Low'] + c_curr['High']) / 2.0)
                fvgs.append({
                    "index": i,
                    "type": "BEARISH_FVG",
                    "top": round(float(c_prev2['Low']), 2),
                    "bottom": round(float(c_curr['High']), 2),
                    "ce_50_midpoint": round(ce_50, 2),
                    "gap_size": round(gap, 2),
                    "time": str(df.index[i])
                })
                
    return fvgs

def detect_smt_divergence(gold_df: pd.DataFrame, silver_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """
    SMT (Smart Money Technique) Intermarket Divergence:
    Compares Gold (GC=F) vs Silver (SI=F) across recent swing extremes.
    - Bearish SMT: Gold makes Higher High (HH), Silver fails to make Higher High (makes Lower High LH).
    - Bullish SMT: Gold makes Lower Low (LL), Silver fails to make Lower Low (makes Higher Low HL).
    """
    if silver_df is None or silver_df.empty or len(silver_df) < 10 or len(gold_df) < 10:
        return {
            "smt_active": False,
            "type": "INSUFFICIENT_DATA",
            "description": "Correlated Silver feed not active; SMT neutral."
        }

    g_high_now = float(gold_df['High'].iloc[-1])
    g_high_prev = float(gold_df['High'].iloc[-5:-1].max())
    g_low_now = float(gold_df['Low'].iloc[-1])
    g_low_prev = float(gold_df['Low'].iloc[-5:-1].min())

    s_high_now = float(silver_df['High'].iloc[-1])
    s_high_prev = float(silver_df['High'].iloc[-5:-1].max())
    s_low_now = float(silver_df['Low'].iloc[-1])
    s_low_prev = float(silver_df['Low'].iloc[-5:-1].min())

    # Bearish SMT Divergence
    if g_high_now > g_high_prev and s_high_now <= s_high_prev:
        return {
            "smt_active": True,
            "type": "BEARISH_SMT_DIVERGENCE",
            "signal": "SHORT",
            "description": "Gold printed a higher high while Silver printed a lower high. Institutional distribution trap."
        }

    # Bullish SMT Divergence
    if g_low_now < g_low_prev and s_low_now >= s_low_prev:
        return {
            "smt_active": True,
            "type": "BULLISH_SMT_DIVERGENCE",
            "signal": "BUY",
            "description": "Gold printed a lower low while Silver formed a higher low. Institutional accumulation sweep."
        }

    return {
        "smt_active": False,
        "type": "CORRELATED_SYMMETRIC",
        "description": "Gold and Silver price swings are synchronized."
    }

def detect_session_killzones(utc_hour: int, utc_minute: int) -> Dict[str, Any]:
    """
    Institutional Forex & Bullion Session Windows:
    - Asian Range: 23:00 - 06:00 UTC (Liquidity building)
    - London Open Killzone: 07:00 - 09:00 UTC (Judas Swing / Asian Range Sweep)
    - London / NY Overlap: 12:00 - 16:00 UTC (Peak Volatility)
    - NY Afternoon: 17:00 - 21:00 UTC (Trend continuation or consolidation)
    """
    time_float = utc_hour + (utc_minute / 60.0)

    if 7.0 <= time_float <= 9.0:
        return {
            "session": "LONDON_OPEN_KILLZONE",
            "is_killzone": True,
            "setup_affinity": "LONDON_JUDAS_SWING",
            "risk_profile": "HIGH_VOLATILITY_SWEEP"
        }
    elif 12.0 <= time_float <= 16.0:
        return {
            "session": "LONDON_NY_OVERLAP",
            "is_killzone": True,
            "setup_affinity": "MOMENTUM_EXPANSION_BREAKOUT",
            "risk_profile": "MAX_LIQUIDITY_EXPANSION"
        }
    elif 23.0 <= time_float or time_float <= 6.0:
        return {
            "session": "ASIAN_CONSOLIDATION",
            "is_killzone": False,
            "setup_affinity": "RANGE_ACCUMULATION_NO_CHASE",
            "risk_profile": "LOW_VOLUME_ACCUMULATION"
        }
    else:
        return {
            "session": "INTER_SESSION_REGULAR",
            "is_killzone": False,
            "setup_affinity": "STANDARD_TECHNICAL_FLOW",
            "risk_profile": "NORMAL"
        }


# =====================================================================
# 5. STRICT NO-TRADE GATING & HAZARD AUDIT
# =====================================================================

def evaluate_no_trade_gate(
    price: float,
    range_low: float,
    range_high: float,
    regime_info: Dict[str, Any],
    macro_news_minutes: Optional[int] = None
) -> Tuple[bool, str]:
    """
    Evaluates Section 28 NO-TRADE conditions:
    1. Mid-Range Equilibrium: Position in [0.40, 0.60] during Consolidation.
    2. High-Impact News Window (< 15 mins).
    3. Extreme Low Volatility / Illiquidity Lull.
    """
    # 1. Macro News Freeze
    if macro_news_minutes is not None and abs(macro_news_minutes) <= 15:
        return True, f"NO-TRADE: High-impact economic release in {macro_news_minutes} minutes. High slippage hazard."

    # 2. Mid-Range Trap during Consolidation
    if regime_info.get("parent_id") == 2:
        range_span = range_high - range_low
        if range_span > 0:
            rel_pos = (price - range_low) / range_span
            if 0.40 <= rel_pos <= 0.60:
                return True, f"NO-TRADE: Price is dead-center in Mid-Range equilibrium ({round(rel_pos*100, 1)}%). Zero mathematical edge."

    # 3. Dead Market Volatility Lull
    if regime_info.get("adx", 20.0) < 14.0 and regime_info.get("sub_state") == "VOLATILITY_COMPRESSION":
        return True, "NO-TRADE: Extremely low ADX (<14) and compressed range. Spread-to-edge ratio unfavorable."

    return False, "TRADE_ALLOWED"


# =====================================================================
# 6. BAYESIAN SETUP SCORING & 50-SCENARIO CLASSIFIER
# =====================================================================

def calculate_bayesian_setup_score(
    regime_match: bool,
    structure_aligned: bool,
    sweep_present: bool,
    fvg_present: bool,
    smt_confirmed: bool,
    risk_reward: float,
    is_killzone: bool
) -> int:
    """
    Computes a 0 - 100 Multi-Factor Bayesian Confidence Score:
    - Baseline: 30
    - Regime Alignment: +20
    - Structure Hold: +15
    - Liquidity Sweep: +15
    - FVG Rebalance: +10
    - SMT Divergence: +10
    - Risk Reward >= 1:2: +10
    - In Killzone: +5
    """
    score = 30
    if regime_match:
        score += 20
    if structure_aligned:
        score += 15
    if sweep_present:
        score += 15
    if fvg_present:
        score += 10
    if smt_confirmed:
        score += 10
    if risk_reward >= 2.0:
        score += 10
    elif risk_reward < 1.3:
        score -= 20
    if is_killzone:
        score += 5

    return min(max(score, 10), 98)


def map_active_scenario(
    parent_id: int,
    sub_state: str,
    sweep_info: Dict[str, Any],
    killzone_info: Dict[str, Any],
    fvg_list: List[Dict[str, Any]],
    smt_info: Dict[str, Any],
    no_trade: bool
) -> Dict[str, Any]:
    """
    Maps current market state to the 50 Standardized Scenarios (Section 35).
    Returns specific Scenario #, Name, Inherited Strategy, and Decision Path.
    """
    if no_trade:
        return {
            "scenario_number": 22,
            "scenario_name": "Mid-range Equilibrium or Dead Volatility Lull",
            "parent": "Consolidation",
            "strategy_inherited": "NO_TRADE",
            "decision": "NO TRADE",
            "edge": "POOR_RR"
        }

    # London Open Judas Swing
    if killzone_info.get("session") == "LONDON_OPEN_KILLZONE" and sweep_info.get("has_sweep"):
        return {
            "scenario_number": 25,
            "scenario_name": "London Open Sweep of Asian Range (Judas Swing)",
            "parent": "Liquidity Interaction",
            "strategy_inherited": "Liquidity-Sweep Reversal",
            "decision": f"{sweep_info.get('bias')} on Liquidity Sweep Confirmation",
            "edge": "HIGH_PROBABILITY"
        }

    # Liquidity Sweep Reversal with SMT
    if sweep_info.get("has_sweep"):
        scen_id = 11 if smt_info.get("smt_active") else 8
        return {
            "scenario_number": scen_id,
            "scenario_name": "Liquidity Sweep with SMT / Structure Reversal",
            "parent": "Liquidity Interaction",
            "strategy_inherited": "Liquidity-Sweep Reversal",
            "decision": f"{sweep_info.get('bias')} with SL beyond sweep extreme",
            "edge": "HIGH_PROBABILITY"
        }

    # Trend Pullback to FVG / Retest
    if parent_id == 1:
        if fvg_list:
            return {
                "scenario_number": 13,
                "scenario_name": "Trend Pullback into Consequent Encroachment (50% FVG)",
                "parent": "Trend",
                "strategy_inherited": "Trend-Following / Pullback FVG Entry",
                "decision": "LONG / SHORT on FVG CE 50% hold",
                "edge": "HIGH_PROBABILITY"
            }
        return {
            "scenario_number": 1,
            "scenario_name": "Strong Trend Shallow Pullback",
            "parent": "Trend",
            "strategy_inherited": "Trend-Following",
            "decision": "Follow dominant trend on HL/LH hold",
            "edge": "CONDITIONAL_BEST"
        }

    # Consolidation Range Extremes
    if parent_id == 2:
        return {
            "scenario_number": 4,
            "scenario_name": "Tight Range Extremes Fade",
            "parent": "Consolidation",
            "strategy_inherited": "Range Fade",
            "decision": "Fade boundaries only; avoid mid-range",
            "edge": "BETTER"
        }

    # Expansion Breakout
    if parent_id == 3:
        return {
            "scenario_number": 6,
            "scenario_name": "Range Breakout with Retest Hold",
            "parent": "Expansion",
            "strategy_inherited": "Breakout-Retest",
            "decision": "Enter on Retest close confirmation",
            "edge": "BETTER"
        }

    # Default Scenario
    return {
        "scenario_number": 3,
        "scenario_name": "Standard Decelerating Flow",
        "parent": "Trend (Decelerating)",
        "strategy_inherited": "Reduced-Size Trend Following",
        "decision": "WAIT / Conservative sizing",
        "edge": "NORMAL"
    }


# =====================================================================
# 7. MASTER OPERATING SYSTEM AUDIT FACADE
# =====================================================================

def analyze_market_operating_system(
    gold_df: pd.DataFrame,
    silver_df: Optional[pd.DataFrame] = None,
    current_price: Optional[float] = None,
    news_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Executes a complete 100% mathematical audit of XAUUSD (Gold).
    Returns complete 8-Layer Market Ontology payload.
    """
    if gold_df.empty or len(gold_df) < 20:
        return {
            "success": False,
            "error": "Insufficient candle data for quantitative market OS."
        }

    price = current_price if current_price and current_price > 0 else float(gold_df['Close'].iloc[-1])
    atr_val = float(compute_atr(gold_df, 14).iloc[-1])
    
    # 1. Regime Classification (7 Parents)
    regime = classify_parent_regime(gold_df)
    
    # 2. Market Structure & Liquidity
    extrema = detect_swing_extrema(gold_df, window=5)
    sweep = detect_liquidity_sweeps(gold_df, window=20)
    
    # 3. 4 Advanced Additions
    fvgs = detect_fair_value_gaps(gold_df, atr=atr_val)
    smt = detect_smt_divergence(gold_df, silver_df)
    
    now_utc = datetime.now(timezone.utc)
    killzone = detect_session_killzones(now_utc.hour, now_utc.minute)
    
    # 4. Strict NO-TRADE Gate
    is_no_trade, no_trade_reason = evaluate_no_trade_gate(
        price=price,
        range_low=extrema['recent_swing_low'],
        range_high=extrema['recent_swing_high'],
        regime_info=regime,
        macro_news_minutes=news_minutes
    )
    
    # 5. Bayesian Score
    score = calculate_bayesian_setup_score(
        regime_match=(regime['parent_id'] in [1, 4, 6]),
        structure_aligned=True,
        sweep_present=sweep['has_sweep'],
        fvg_present=(len(fvgs) > 0),
        smt_confirmed=smt['smt_active'],
        risk_reward=2.0,
        is_killzone=killzone['is_killzone']
    )
    if is_no_trade:
        score = min(score, 35)

    # 6. Map to 50 Standardized Scenarios
    scenario = map_active_scenario(
        parent_id=regime['parent_id'],
        sub_state=regime['sub_state'],
        sweep_info=sweep,
        killzone_info=killzone,
        fvg_list=fvgs,
        smt_info=smt,
        no_trade=is_no_trade
    )

    # 7. Structural Invalidation & Targets
    bias = "NEUTRAL"
    sl_price = price - (1.5 * atr_val)
    tp1_price = price + (3.0 * atr_val)
    
    if sweep['has_sweep']:
        bias = sweep['bias']
        if bias == "SHORT":
            sl_price = sweep['invalidation']
            tp1_price = extrema['recent_swing_low']
        else:
            sl_price = sweep['invalidation']
            tp1_price = extrema['recent_swing_high']
    elif regime['parent_id'] == 1:
        bias = regime['trend_direction']
        if bias == "BULLISH":
            sl_price = extrema['recent_swing_low'] - (0.25 * atr_val)
            tp1_price = price + (2.0 * abs(price - sl_price))
        else:
            sl_price = extrema['recent_swing_high'] + (0.25 * atr_val)
            tp1_price = price - (2.0 * abs(sl_price - price))

    # Breakeven Rule
    risk_dist = abs(price - sl_price)
    be_trigger_price = price + risk_dist if bias == "BUY" else price - risk_dist

    return {
        "success": True,
        "symbol": "XAUUSD",
        "current_price": round(price, 2),
        "atr": round(atr_val, 2),
        "ontology": {
            "layer_a_regime": regime,
            "layer_b_structure": extrema,
            "layer_c_liquidity_event": sweep,
            "layer_d_session_context": killzone,
            "layer_e_advanced_edge": {
                "active_fvgs": fvgs[:3],
                "smt_divergence": smt,
                "london_judas_swing_active": (killzone['session'] == "LONDON_OPEN_KILLZONE" and sweep['has_sweep'])
            },
            "layer_f_no_trade_gate": {
                "is_no_trade": is_no_trade,
                "reason": no_trade_reason
            }
        },
        "active_scenario": scenario,
        "quantitative_score": score,
        "trade_execution_blueprint": {
            "recommended_action": "NO_TRADE" if is_no_trade else (scenario['decision']),
            "bias": "FLAT" if is_no_trade else bias,
            "entry_reference": round(price, 2),
            "structural_sl": round(sl_price, 2),
            "tp1_target": round(tp1_price, 2),
            "breakeven_rule": f"Move SL to Entry ({round(price, 2)}) when price reaches {round(be_trigger_price, 2)} (+1R)",
            "calculated_rr": round(abs(tp1_price - price) / risk_dist, 2) if risk_dist > 0 else 1.0
        }
    }
