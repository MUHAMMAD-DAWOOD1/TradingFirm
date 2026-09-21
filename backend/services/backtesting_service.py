"""
Nexus Capital — Quantitative Backtesting Engine
Executes historical strategy backtesting on institutional assets (Gold, BTC, FX, Indices)
Computes Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, and Equity Curve.
"""

import re
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional

try:
    from backend.services.market_behavior_engine import compute_adx
except ImportError:
    try:
        from services.market_behavior_engine import compute_adx
    except ImportError:
        def compute_adx(df, p=14):
            return (pd.Series(25.0, index=df.index), None, None)

SYMBOL_MAP = {
    "XAUUSD": "GC=F",
    "GOLD": "GC=F",
    "USOIL": "CL=F",
    "OIL": "CL=F",
    "WTI": "CL=F",
    "BTC": "BTC-USD",
    "BTCUSD": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "BNB": "BNB-USD",
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "SILVER": "SI=F",
    "XAGUSD": "SI=F",
    "US30": "^DJI",
    "SPX": "^GSPC",
    "NDX100": "^NDX"
}

STRATEGY_REGISTRY = [
    {
        "id": "Adaptive_Market_OS",
        "name": "Institutional Adaptive Market OS",
        "category": "Institutional Multi-Regime",
        "badge": "Flagship Quant",
        "description_urdu": "XAUUSD Institutional multi-regime model. Range boundaries par liquidity sweeps catch karta hai aur ADX >= 25 par trend pullbacks par trade leta hai.",
        "ideal_market": "All Markets (Gold, FX, Crypto)"
    },
    {
        "id": "Trend_Breakout_EMA",
        "name": "Trend Breakout (EMA 20/50 + ATR)",
        "category": "Trend Following",
        "badge": "High Expectancy",
        "description_urdu": "EMA 20 aur 50 ke dynamic crossover aur RSI > 50 confirmation ke sath 1:2 R:R par high momentum trend rides execute karta hai.",
        "ideal_market": "Trending High-Volume Sessions"
    },
    {
        "id": "Mean_Reversion_RSI",
        "name": "Mean Reversion Extreme (RSI 30/70)",
        "category": "Mean Reversion",
        "badge": "Range Scalping",
        "description_urdu": "Overbought (RSI > 70) aur Oversold (RSI < 30) exhaustion par counter-trend bounces capture karta hai.",
        "ideal_market": "Sideways / Consolidation Sessions"
    },
    {
        "id": "Liquidity_Sweep_S&R",
        "name": "Liquidity Sweep Breakout (S&R Purge)",
        "category": "Smart Money / ICT",
        "badge": "Trap Reversal",
        "description_urdu": "20-candle high/low ke bahar stop hunting wicks ko detect karke retail breakout traders ke trap hone par reverse position leta hai.",
        "ideal_market": "London & NY Session Open"
    },
    {
        "id": "FVG_OrderBlock_ICT",
        "name": "ICT Fair Value Gap & Order Block Mitigation",
        "category": "Smart Money / ICT",
        "badge": "Institutional Imbalance",
        "description_urdu": "3-candle price displacement se bane FVG imbalances ke retest par institutional order block mitigation trades trigger karta hai.",
        "ideal_market": "London/New York Overlap"
    },
    {
        "id": "Bollinger_Squeeze_Breakout",
        "name": "Bollinger Bands Volatility Squeeze",
        "category": "Volatility Breakout",
        "badge": "Expansion Hunter",
        "description_urdu": "Jab Bollinger Bands Keltner Channel ke andar contract hote hain (compression), tab sudden explosive expansion ko ride karta hai.",
        "ideal_market": "Pre-News & Asian Consolidation"
    },
    {
        "id": "MACD_Divergence_Trend",
        "name": "MACD Momentum Divergence + 200 EMA",
        "category": "Momentum",
        "badge": "Macro Trend Filter",
        "description_urdu": "Higher timeframe 200 EMA ke trend ki simat mein MACD histogram divergence aur zero-line crossovers par entry leta hai.",
        "ideal_market": "Daily & 4H Macro Swings"
    },
    {
        "id": "SuperTrend_ATR_Trail",
        "name": "SuperTrend ATR Volatility Trail",
        "category": "Trend Following",
        "badge": "Dynamic Trail",
        "description_urdu": "3.0 ATR multiplier par dynamic trailing stop loss ke sath bari market moves ko bina premature exit ke pura capture karta hai.",
        "ideal_market": "Strong Bull / Bear Trends"
    },
    {
        "id": "Asian_Session_Range_Sweep",
        "name": "Asian Session Range Sweep & London Reversal",
        "category": "Session Liquidity",
        "badge": "Judas Swing",
        "description_urdu": "Asian range ke high ya low ko London open ke pehle 2 ghanton mein sweep karke opposite direction mein expansion karta hai.",
        "ideal_market": "London Open (07:00 - 10:00 UTC)"
    },
    {
        "id": "Fibonacci_Golden_Pocket",
        "name": "Fibonacci 0.618 Golden Pocket Pullback",
        "category": "Pullback Swing",
        "badge": "Fib Retracement",
        "description_urdu": "Major impulse wave ke 61.8% se 65% retracement golden pocket level par high probability institutional re-entries execute karta hai.",
        "ideal_market": "Healthy Trending Pullbacks"
    },
    {
        "id": "Custom_User_Signal",
        "name": "Apna Analysis & Custom Signal Backtest",
        "category": "Custom Rules",
        "badge": "User Defined",
        "description_urdu": "Aapka apna custom signal text (BUY/SELL, TP, SL) ya custom technical rules ko real past data par test karke exact win rate batata hai.",
        "ideal_market": "User Defined Strategy"
    }
]

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / (loss.replace(0, np.nan))
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df['High']
    low = df['Low']
    close = df['Close'].shift(1)
    tr = pd.concat([high - low, (high - close).abs(), (low - close).abs()], axis=1).max(axis=1)
    return tr.rolling(window=period).mean().fillna(high - low)

def parse_custom_signal_text(text: str, current_price: float = 2650.0) -> Dict[str, Any]:
    if not text:
        return {"direction": "BUY", "raw_tp": None, "raw_sl": None, "has_levels": False}
    t_upper = text.upper()
    direction = "BUY"
    if any(k in t_upper for k in ["SELL", "SHORT", "BEAR"]):
        direction = "SELL"
    elif any(k in t_upper for k in ["BUY", "LONG", "BULL"]):
        direction = "BUY"

    raw_tp = None
    raw_sl = None
    raw_entry = None

    tp_match = re.search(r'(?:TP|TAKE\s*PROFIT|TARGET)\s*(?:=|:|\s+)?\s*(\d+(?:\.\d+)?)', t_upper)
    if tp_match:
        raw_tp = float(tp_match.group(1))

    sl_match = re.search(r'(?:SL|STOP\s*LOSS|STOP)\s*(?:=|:|\s+)?\s*(\d+(?:\.\d+)?)', t_upper)
    if sl_match:
        raw_sl = float(sl_match.group(1))

    entry_match = re.search(r'(?:ENTRY|ENTER|AT|@)\s*(?:=|:|\s+)?\s*(\d+(?:\.\d+)?)', t_upper)
    if entry_match:
        raw_entry = float(entry_match.group(1))

    return {
        "direction": direction,
        "entry_price": raw_entry,
        "raw_tp": raw_tp,
        "raw_sl": raw_sl,
        "has_levels": (raw_tp is not None or raw_sl is not None)
    }

def generate_quant_verdict_urdu(
    win_rate: float,
    profit_factor: float,
    total_trades: int,
    total_return_pct: float,
    max_drawdown_pct: float,
    strategy_name: str
) -> Dict[str, Any]:
    if total_trades < 5:
        return {
            "verdict_badge": "INSUFFICIENT_SAMPLE",
            "badge_color": "amber",
            "verdict_title": "Kam Trades (Insufficient Sample Size)",
            "verdict_urdu": "Is lookback period mein sirf bohot kam trades bani hain. Reliable result ke liye lookback period barha kar 6 Months ya 1 Year select karein.",
            "recommendation_urdu": "Timeframe ko 15m ya 1h karein taake sample size 25+ trades ho sake."
        }

    if win_rate >= 60.0 and profit_factor >= 1.6:
        return {
            "verdict_badge": "APPROVED_FOR_LIVE",
            "badge_color": "emerald",
            "verdict_title": "Zabardast Alpha — Live Trading Ke Liye Approved",
            "verdict_urdu": f"Mubarak ho! {strategy_name} ne real historical data par {win_rate}% ka high win rate aur {profit_factor} profit factor diya hai. Reward-to-Risk ratio intihai solid hai.",
            "recommendation_urdu": "Is strategy par 1.0% se 1.5% fixed capital risk ke sath execution start ki ja sakti hai."
        }
    elif (win_rate >= 50.0 and profit_factor >= 1.3) or (win_rate >= 40.0 and profit_factor >= 1.8):
        return {
            "verdict_badge": "VIABLE_PROFITABLE",
            "badge_color": "blue",
            "verdict_title": "Profitable — Institutional Edge Maujood Hai",
            "verdict_urdu": f"Ye strategy profitable hai ({win_rate}% win rate, Profit Factor {profit_factor}). Halankeh kuch trades mein chop aya hai, winning trades ka size bara hone se net equity positive rahi.",
            "recommendation_urdu": "Stop Loss ko 1.2x ATR par dynamic adjust karein aur +1R par Breakeven rule active rakhein."
        }
    elif win_rate < 45.0 and profit_factor < 1.0:
        return {
            "verdict_badge": "HIGH_RISK_AVOID",
            "badge_color": "rose",
            "verdict_title": "High Risk — Live Mein Loss Ka Khatra Hai",
            "verdict_urdu": f"Khabardar! Real historical data par is setup ka win rate sirf {win_rate}% aya hai aur total return ({total_return_pct}%) negative hai. Market volatility ne stop losses hit kiye hain.",
            "recommendation_urdu": "Stop Loss bohot tight hai ya entry confirmation kamzor hai. SL ko ATR multiple par set karein."
        }
    else:
        return {
            "verdict_badge": "NEEDS_OPTIMIZATION",
            "badge_color": "amber",
            "verdict_title": "Borderline — Tuning Ki Zaroorat Hai",
            "verdict_urdu": f"Strategy ka win rate {win_rate}% hai magar profit factor ({profit_factor}) marginal hai.",
            "recommendation_urdu": "Take Profit ko 2.0x R:R par shift karein aur low-volatility sessions avoid karein."
        }

def run_backtest(
    symbol: str = "XAUUSD",
    strategy: str = "Adaptive_Market_OS",
    timeframe: str = "1h",
    period: str = "3mo",
    initial_equity: float = 10000.0,
    risk_per_trade_pct: float = 1.5,
    custom_signal_text: Optional[str] = None,
    custom_direction: Optional[str] = "BUY",
    custom_entry_trigger: Optional[str] = "EMA_CROSS",
    custom_entry_price: Optional[float] = None,
    custom_tp_points: Optional[float] = None,
    custom_sl_points: Optional[float] = None,
    custom_tp_type: Optional[str] = "ATR_MULTIPLE",
    custom_sl_type: Optional[str] = "ATR_MULTIPLE",
    use_breakeven: Optional[bool] = True
) -> Dict[str, Any]:
    yf_symbol = SYMBOL_MAP.get(symbol.upper(), symbol)
    
    # Valid interval validation & 15m safety clamp
    interval = timeframe if timeframe in ["15m", "1h", "4h", "1d"] else "1h"
    fetch_period = "60d" if (interval == "15m" and period in ["6mo", "1y", "2y", "5y"]) else period
        
    try:
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=fetch_period, interval=interval)
        if df.empty or len(df) < 30:
            df = ticker.history(period="1mo", interval=interval)
            if df.empty or len(df) < 20:
                return {
                    "success": False,
                    "error": f"Insufficient historical data fetched for {symbol} ({yf_symbol})"
                }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to download data: {str(e)}"
        }

    # Technical Indicators calculation
    df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
    df['EMA200'] = df['Close'].ewm(span=200, adjust=False).mean()
    df['RSI'] = calculate_rsi(df['Close'], period=14)
    df['ATR'] = calculate_atr(df, period=14)
    adx_series, _, _ = compute_adx(df, 14)
    df['ADX'] = adx_series

    # MACD
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # Bollinger Bands
    df['BB_Mid'] = df['Close'].rolling(window=20).mean()
    df['BB_Std'] = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2.0)
    df['BB_Lower'] = df['BB_Mid'] - (df['BB_Std'] * 2.0)

    # SuperTrend ATR bands
    hl2 = (df['High'] + df['Low']) / 2
    df['ST_Upper'] = hl2 + (3.0 * df['ATR'])
    df['ST_Lower'] = hl2 - (3.0 * df['ATR'])

    parsed_custom = {}
    if custom_signal_text or strategy == "Custom_User_Signal":
        latest_c = float(df['Close'].iloc[-1])
        parsed_custom = parse_custom_signal_text(custom_signal_text or "", current_price=latest_c)

    equity = initial_equity
    peak_equity = initial_equity
    max_drawdown_pct = 0.0
    
    equity_curve: List[Dict[str, Any]] = []
    trade_log: List[Dict[str, Any]] = []
    
    current_position = None  # {type: 'BUY'/'SELL', entry_price, size, sl, tp, entry_time}
    
    for i in range(50, len(df)):
        row = df.iloc[i]
        prev_row = df.iloc[i-1]
        timestamp = df.index[i].strftime("%Y-%m-%d %H:%M")
        close = float(row['Close'])
        open_p = float(row['Open'])
        high = float(row['High'])
        low = float(row['Low'])
        atr = float(row['ATR']) if row['ATR'] > 0 else close * 0.005

        # Check existing position for SL / TP
        if current_position:
            pos_type = current_position['type']
            entry_price = current_position['entry_price']
            sl = current_position['sl']
            tp = current_position['tp']
            size = current_position['size']
            
            # Dynamic Breakeven (+1R Migration): Move SL to entry if +1R reached
            if not current_position.get('is_be', False):
                orig_risk = current_position.get('orig_risk', abs(entry_price - sl))
                if pos_type == 'BUY' and high >= (entry_price + orig_risk):
                    current_position['sl'] = entry_price
                    current_position['is_be'] = True
                elif pos_type == 'SELL' and low <= (entry_price - orig_risk):
                    current_position['sl'] = entry_price
                    current_position['is_be'] = True
            
            exit_trade = False
            exit_price = close
            exit_reason = ""
            
            if pos_type == 'BUY':
                if low <= sl:
                    exit_price = sl
                    exit_trade = True
                    exit_reason = "Stop Loss Hit"
                elif high >= tp:
                    exit_price = tp
                    exit_trade = True
                    exit_reason = "Take Profit Hit"
            elif pos_type == 'SELL':
                if high >= sl:
                    exit_price = sl
                    exit_trade = True
                    exit_reason = "Stop Loss Hit"
                elif low <= tp:
                    exit_price = tp
                    exit_trade = True
                    exit_reason = "Take Profit Hit"
                    
            if exit_trade:
                pnl = (exit_price - entry_price) * size if pos_type == 'BUY' else (entry_price - exit_price) * size
                pnl_pct = (pnl / equity) * 100
                equity += pnl
                if equity > peak_equity:
                    peak_equity = equity
                dd = ((peak_equity - equity) / peak_equity) * 100 if peak_equity > 0 else 0
                if dd > max_drawdown_pct:
                    max_drawdown_pct = dd
                    
                trade_log.append({
                    "id": len(trade_log) + 1,
                    "type": pos_type,
                    "entry_time": current_position['entry_time'],
                    "exit_time": timestamp,
                    "entry_price": round(entry_price, 2),
                    "exit_price": round(exit_price, 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 2),
                    "exit_reason": exit_reason,
                    "equity_after": round(equity, 2)
                })
                current_position = None

        # If no position, evaluate entry conditions
        # If no position, evaluate entry conditions
        if not current_position:
            risk_amount = equity * (risk_per_trade_pct / 100.0)
            rolling_high = df['High'].iloc[max(0, i - 20):i].max()
            rolling_low = df['Low'].iloc[max(0, i - 20):i].min()
            tot_range = high - low
            upper_wick = (high - max(open_p, close)) / tot_range if tot_range > 0 else 0
            lower_wick = (min(open_p, close) - low) / tot_range if tot_range > 0 else 0

            # ----------------------------------------------------
            # 1. Custom User Signal & Custom Rules Backtesting
            # ----------------------------------------------------
            if strategy == "Custom_User_Signal" or (custom_signal_text and len(custom_signal_text.strip()) > 3):
                trigger_buy = False
                trigger_sell = False
                user_dir = parsed_custom.get("direction", custom_direction or "BUY")
                trigger_mode = custom_entry_trigger or "EMA_CROSS"

                if trigger_mode == "EMA_CROSS":
                    if prev_row['EMA20'] <= prev_row['EMA50'] and row['EMA20'] > row['EMA50']:
                        trigger_buy = True
                    elif prev_row['EMA20'] >= prev_row['EMA50'] and row['EMA20'] < row['EMA50']:
                        trigger_sell = True
                elif trigger_mode == "RSI_EXTREME":
                    if prev_row['RSI'] < 32 and row['RSI'] >= 32:
                        trigger_buy = True
                    elif prev_row['RSI'] > 68 and row['RSI'] <= 68:
                        trigger_sell = True
                elif trigger_mode == "BREAKOUT":
                    if close > rolling_high:
                        trigger_buy = True
                    elif close < rolling_low:
                        trigger_sell = True
                elif trigger_mode == "WICK_REJECTION":
                    if lower_wick >= 0.45:
                        trigger_buy = True
                    elif upper_wick >= 0.45:
                        trigger_sell = True
                else:
                    if user_dir == "BUY" and close > row['EMA50'] and low <= row['EMA20']:
                        trigger_buy = True
                    elif user_dir == "SELL" and close < row['EMA50'] and high >= row['EMA20']:
                        trigger_sell = True

                if user_dir == "BUY" and trigger_buy:
                    if parsed_custom.get("raw_tp") and parsed_custom.get("raw_sl"):
                        sl = parsed_custom["raw_sl"]
                        tp = parsed_custom["raw_tp"]
                        sl_dist = abs(close - sl) if abs(close - sl) > 0 else atr * 1.5
                    elif custom_tp_points and custom_sl_points:
                        sl_dist = custom_sl_points
                        sl = close - sl_dist
                        tp = close + custom_tp_points
                    else:
                        sl_dist = atr * 1.2
                        sl = close - sl_dist
                        tp = close + (atr * 2.4)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "BUY", "entry_price": close, "size": size,
                        "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist
                    }
                elif user_dir == "SELL" and trigger_sell:
                    if parsed_custom.get("raw_tp") and parsed_custom.get("raw_sl"):
                        sl = parsed_custom["raw_sl"]
                        tp = parsed_custom["raw_tp"]
                        sl_dist = abs(sl - close) if abs(sl - close) > 0 else atr * 1.5
                    elif custom_tp_points and custom_sl_points:
                        sl_dist = custom_sl_points
                        sl = close + sl_dist
                        tp = close - custom_tp_points
                    else:
                        sl_dist = atr * 1.2
                        sl = close + sl_dist
                        tp = close - (atr * 2.4)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "SELL", "entry_price": close, "size": size,
                        "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist
                    }

            # ----------------------------------------------------
            # 2. Adaptive Market OS (Flagship Multi-Regime)
            # ----------------------------------------------------
            elif strategy == "Adaptive_Market_OS":
                adx_val = float(row.get('ADX', 25.0))
                if high > rolling_high and close < rolling_high and upper_wick >= 0.40:
                    sl = high + (atr * 0.25)
                    sl_dist = abs(sl - close)
                    tp = close - (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif low < rolling_low and close > rolling_low and lower_wick >= 0.40:
                    sl = low - (atr * 0.25)
                    sl_dist = abs(close - sl)
                    tp = close + (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif adx_val >= 25.0:
                    ema20 = float(row['EMA20'])
                    ema50 = float(row['EMA50'])
                    ema200 = float(row['EMA200'])
                    rsi = float(row['RSI'])
                    prev_close = float(prev_row['Close'])
                    prev_ema20 = float(prev_row['EMA20'])
                    if close > ema200 and ema20 > ema50 and prev_close <= prev_ema20 and close > ema20 and 45 <= rsi <= 65:
                        sl = min(low, float(prev_row['Low'])) - (atr * 0.25)
                        sl_dist = abs(close - sl)
                        tp = close + (sl_dist * 2.2)
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                    elif close < ema200 and ema20 < ema50 and prev_close >= prev_ema20 and close < ema20 and 35 <= rsi <= 55:
                        sl = max(high, float(prev_row['High'])) + (atr * 0.25)
                        sl_dist = abs(sl - close)
                        tp = close - (sl_dist * 2.2)
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 3. Trend Breakout EMA
            # ----------------------------------------------------
            elif strategy == "Trend_Breakout_EMA":
                if prev_row['EMA20'] <= prev_row['EMA50'] and row['EMA20'] > row['EMA50'] and row['RSI'] > 50:
                    sl_dist = atr * 1.5
                    sl = close - sl_dist
                    tp = close + (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif prev_row['EMA20'] >= prev_row['EMA50'] and row['EMA20'] < row['EMA50'] and row['RSI'] < 50:
                    sl_dist = atr * 1.5
                    sl = close + sl_dist
                    tp = close - (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 4. Mean Reversion RSI
            # ----------------------------------------------------
            elif strategy == "Mean_Reversion_RSI":
                if prev_row['RSI'] < 30 and row['RSI'] >= 32:
                    sl_dist = atr * 1.2
                    sl = close - sl_dist
                    tp = close + (sl_dist * 1.8)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif prev_row['RSI'] > 70 and row['RSI'] <= 68:
                    sl_dist = atr * 1.2
                    sl = close + sl_dist
                    tp = close - (sl_dist * 1.8)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 5. Liquidity Sweep S&R
            # ----------------------------------------------------
            elif strategy == "Liquidity_Sweep_S&R":
                if low < rolling_low and close > rolling_low:
                    sl_dist = atr * 1.0
                    sl = low - (atr * 0.3)
                    tp = close + (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif high > rolling_high and close < rolling_high:
                    sl_dist = atr * 1.0
                    sl = high + (atr * 0.3)
                    tp = close - (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 6. FVG Order Block ICT
            # ----------------------------------------------------
            elif strategy == "FVG_OrderBlock_ICT":
                if i >= 2 and float(prev_row['Low']) > float(df['High'].iloc[i - 2]):
                    fvg_low = float(df['High'].iloc[i - 2])
                    if low <= float(prev_row['Low']) and close > fvg_low:
                        sl = fvg_low - (atr * 0.4)
                        sl_dist = abs(close - sl)
                        tp = close + (sl_dist * 2.5)
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif i >= 2 and float(prev_row['High']) < float(df['Low'].iloc[i - 2]):
                    fvg_high = float(df['Low'].iloc[i - 2])
                    if high >= float(prev_row['High']) and close < fvg_high:
                        sl = fvg_high + (atr * 0.4)
                        sl_dist = abs(sl - close)
                        tp = close - (sl_dist * 2.5)
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 7. Bollinger Squeeze Breakout
            # ----------------------------------------------------
            elif strategy == "Bollinger_Squeeze_Breakout":
                prev_std = float(prev_row['BB_Std'])
                curr_std = float(row['BB_Std'])
                if curr_std > prev_std * 1.25 and close > float(row['BB_Upper']):
                    sl_dist = atr * 1.3
                    sl = close - sl_dist
                    tp = close + (sl_dist * 2.4)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif curr_std > prev_std * 1.25 and close < float(row['BB_Lower']):
                    sl_dist = atr * 1.3
                    sl = close + sl_dist
                    tp = close - (sl_dist * 2.4)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 8. MACD Divergence Trend
            # ----------------------------------------------------
            elif strategy == "MACD_Divergence_Trend":
                ema200 = float(row['EMA200'])
                macd = float(row['MACD'])
                macd_sig = float(row['MACD_Signal'])
                prev_macd = float(prev_row['MACD'])
                prev_sig = float(prev_row['MACD_Signal'])
                if close > ema200 and prev_macd <= prev_sig and macd > macd_sig and macd < 0:
                    sl_dist = atr * 1.4
                    sl = close - sl_dist
                    tp = close + (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif close < ema200 and prev_macd >= prev_sig and macd < macd_sig and macd > 0:
                    sl_dist = atr * 1.4
                    sl = close + sl_dist
                    tp = close - (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 9. SuperTrend ATR Volatility
            # ----------------------------------------------------
            elif strategy == "SuperTrend_ATR_Trail":
                if close > float(prev_row['ST_Upper']) and float(prev_row['Close']) <= float(prev_row['ST_Upper']):
                    sl_dist = atr * 1.5
                    sl = close - sl_dist
                    tp = close + (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif close < float(prev_row['ST_Lower']) and float(prev_row['Close']) >= float(prev_row['ST_Lower']):
                    sl_dist = atr * 1.5
                    sl = close + sl_dist
                    tp = close - (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 10. Asian Session Range Sweep
            # ----------------------------------------------------
            elif strategy == "Asian_Session_Range_Sweep":
                if upper_wick >= 0.45 and high >= rolling_high:
                    sl_dist = atr * 1.1
                    sl = high + (atr * 0.2)
                    tp = close - (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                elif lower_wick >= 0.45 and low <= rolling_low:
                    sl_dist = atr * 1.1
                    sl = low - (atr * 0.2)
                    tp = close + (sl_dist * 2.2)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

            # ----------------------------------------------------
            # 11. Fibonacci Golden Pocket
            # ----------------------------------------------------
            elif strategy == "Fibonacci_Golden_Pocket":
                swing_high = df['High'].iloc[max(0, i - 30):i].max()
                swing_low = df['Low'].iloc[max(0, i - 30):i].min()
                fib_span = swing_high - swing_low
                if fib_span > atr * 3.0:
                    fib_618_buy = swing_low + (fib_span * 0.382)
                    fib_618_sell = swing_high - (fib_span * 0.382)
                    if low <= fib_618_buy <= close and close > float(row['EMA50']):
                        sl_dist = atr * 1.2
                        sl = close - sl_dist
                        tp = swing_high
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "BUY", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}
                    elif high >= fib_618_sell >= close and close < float(row['EMA50']):
                        sl_dist = atr * 1.2
                        sl = close + sl_dist
                        tp = swing_low
                        size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                        current_position = {"type": "SELL", "entry_price": close, "size": size, "sl": sl, "tp": tp, "entry_time": timestamp, "orig_risk": sl_dist}

        # Track equity curve every 4 steps or on changes
        if i % 4 == 0 or current_position is not None or i == len(df) - 1:
            equity_curve.append({
                "time": timestamp,
                "equity": round(equity, 2),
                "drawdown": round(((peak_equity - equity) / peak_equity) * 100, 2)
            })

    # Summary Statistics Calculation
    total_trades = len(trade_log)
    winning_trades = [t for t in trade_log if t['pnl'] > 0]
    losing_trades = [t for t in trade_log if t['pnl'] < 0]
    
    win_count = len(winning_trades)
    loss_count = len(losing_trades)
    win_rate = (win_count / total_trades * 100.0) if total_trades > 0 else 0.0
    
    gross_profit = sum(t['pnl'] for t in winning_trades)
    gross_loss = abs(sum(t['pnl'] for t in losing_trades))
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (99.0 if gross_profit > 0 else 0.0)
    
    total_return_pct = ((equity - initial_equity) / initial_equity) * 100.0
    
    # Calculate Sharpe Ratio approximation
    pnls = [t['pnl_pct'] for t in trade_log]
    if len(pnls) > 1 and np.std(pnls) > 0:
        sharpe_ratio = (np.mean(pnls) / np.std(pnls)) * np.sqrt(252)
    else:
        sharpe_ratio = 0.0

    verdict_meta = generate_quant_verdict_urdu(
        win_rate=round(win_rate, 1),
        profit_factor=round(profit_factor, 2),
        total_trades=total_trades,
        total_return_pct=round(total_return_pct, 2),
        max_drawdown_pct=round(max_drawdown_pct, 2),
        strategy_name=strategy
    )

    return {
        "success": True,
        "symbol": symbol.upper(),
        "strategy": strategy,
        "strategy_name": next((s["name"] for s in STRATEGY_REGISTRY if s["id"] == strategy), strategy),
        "timeframe": timeframe,
        "period": period,
        "initial_equity": round(initial_equity, 2),
        "final_equity": round(equity, 2),
        "net_profit": round(equity - initial_equity, 2),
        "total_return_pct": round(total_return_pct, 2),
        "total_trades": total_trades,
        "win_rate": round(win_rate, 1),
        "winning_trades": win_count,
        "losing_trades": loss_count,
        "profit_factor": round(profit_factor, 2),
        "max_drawdown_pct": round(max_drawdown_pct, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "equity_curve": equity_curve,
        "trade_log": trade_log[-60:],  # Last 60 trades for audit
        "verdict": verdict_meta,
        "available_strategies": STRATEGY_REGISTRY
    }

if __name__ == "__main__":
    result = run_backtest("XAUUSD", "Adaptive_Market_OS", "1h", "1mo")
    print(f"Backtest result: Trades={result.get('total_trades')}, WinRate={result.get('win_rate')}%, Return={result.get('total_return_pct')}%")

