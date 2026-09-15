"""
Nexus Capital — Quantitative Backtesting Engine
Executes historical strategy backtesting on institutional assets (Gold, BTC, FX, Indices)
Computes Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, and Equity Curve.
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

SYMBOL_MAP = {
    "XAUUSD": "GC=F",
    "GOLD": "GC=F",
    "BTC": "BTC-USD",
    "BTCUSD": "BTC-USD",
    "EURUSD": "EURUSD=X",
    "SILVER": "SI=F",
    "US30": "^DJI",
    "SPX": "^GSPC",
    "ETH": "ETH-USD"
}

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

def run_backtest(
    symbol: str = "XAUUSD",
    strategy: str = "Trend_Breakout_EMA",
    timeframe: str = "1h",
    period: str = "3mo",
    initial_equity: float = 10000.0,
    risk_per_trade_pct: float = 1.5
) -> Dict[str, Any]:
    yf_symbol = SYMBOL_MAP.get(symbol.upper(), symbol)
    
    # Valid interval validation
    interval = timeframe
    if timeframe not in ["15m", "1h", "1d"]:
        interval = "1h"
        
    try:
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=period, interval=interval)
        if df.empty or len(df) < 30:
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
    df['RSI'] = calculate_rsi(df['Close'], period=14)
    df['ATR'] = calculate_atr(df, period=14)

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
        if not current_position:
            risk_amount = equity * (risk_per_trade_pct / 100.0)
            
            if strategy == "Trend_Breakout_EMA":
                # Buy when EMA20 crosses above EMA50 and RSI > 50
                if prev_row['EMA20'] <= prev_row['EMA50'] and row['EMA20'] > row['EMA50'] and row['RSI'] > 50:
                    sl_dist = atr * 1.5
                    sl = close - sl_dist
                    tp = close + (sl_dist * 2.0)  # 1:2 R:R
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "BUY",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }
                # Sell when EMA20 crosses below EMA50 and RSI < 50
                elif prev_row['EMA20'] >= prev_row['EMA50'] and row['EMA20'] < row['EMA50'] and row['RSI'] < 50:
                    sl_dist = atr * 1.5
                    sl = close + sl_dist
                    tp = close - (sl_dist * 2.0)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "SELL",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }
                    
            elif strategy == "Mean_Reversion_RSI":
                # Oversold rebound: RSI crossed below 30 and now back above 32
                if prev_row['RSI'] < 30 and row['RSI'] >= 32:
                    sl_dist = atr * 1.2
                    sl = close - sl_dist
                    tp = close + (sl_dist * 1.8)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "BUY",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }
                # Overbought reversal: RSI crossed above 70 and now back below 68
                elif prev_row['RSI'] > 70 and row['RSI'] <= 68:
                    sl_dist = atr * 1.2
                    sl = close + sl_dist
                    tp = close - (sl_dist * 1.8)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "SELL",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }
                    
            elif strategy == "Liquidity_Sweep_S&R":
                # Highest high and lowest low of last 20 candles
                rolling_high = df['High'].iloc[i-20:i].max()
                rolling_low = df['Low'].iloc[i-20:i].min()
                # Bullish sweep: Low dipped below rolling_low but closed back inside
                if low < rolling_low and close > rolling_low:
                    sl_dist = atr * 1.0
                    sl = low - (atr * 0.3)
                    tp = close + (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "BUY",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }
                elif high > rolling_high and close < rolling_high:
                    sl_dist = atr * 1.0
                    sl = high + (atr * 0.3)
                    tp = close - (sl_dist * 2.5)
                    size = risk_amount / sl_dist if sl_dist > 0 else 1.0
                    current_position = {
                        "type": "SELL",
                        "entry_price": close,
                        "size": size,
                        "sl": sl,
                        "tp": tp,
                        "entry_time": timestamp
                    }

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

    return {
        "success": True,
        "symbol": symbol.upper(),
        "strategy": strategy,
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
        "trade_log": trade_log[-50:]  # Last 50 trades for inspectability
    }

if __name__ == "__main__":
    result = run_backtest("XAUUSD", "Trend_Breakout_EMA", "1h", "1mo")
    print(f"Backtest result: Trades={result.get('total_trades')}, WinRate={result.get('win_rate')}%, Return={result.get('total_return_pct')}%")
