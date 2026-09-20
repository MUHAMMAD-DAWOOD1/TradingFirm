import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Search,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  HelpCircle
} from "lucide-react";

interface TradeRecord {
  id: number;
  type: "BUY" | "SELL";
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  pnl_pct: number;
  exit_reason: string;
  equity_after: number;
}

interface EquityPoint {
  time: string;
  equity: number;
  drawdown: number;
}

interface QuantVerdict {
  verdict_badge: string;
  badge_color: string;
  verdict_title: string;
  verdict_urdu: string;
  recommendation_urdu: string;
}

interface StrategyMeta {
  id: string;
  name: string;
  category: string;
  badge: string;
  description_urdu: string;
  ideal_market: string;
}

interface BacktestResult {
  success: boolean;
  symbol: string;
  strategy: string;
  strategy_name?: string;
  timeframe: string;
  period: string;
  initial_equity: number;
  final_equity: number;
  net_profit: number;
  total_return_pct: number;
  total_trades: number;
  win_rate: number;
  winning_trades: number;
  losing_trades: number;
  profit_factor: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  equity_curve: EquityPoint[];
  trade_log: TradeRecord[];
  verdict?: QuantVerdict;
  available_strategies?: StrategyMeta[];
  error?: string;
}

const ALL_STRATEGIES: StrategyMeta[] = [
  {
    id: "Adaptive_Market_OS",
    name: "Adaptive Market OS (Multi-Regime)",
    category: "Institutional Flagship",
    badge: "Multi-Regime Quant",
    description_urdu: "Range boundaries par liquidity sweeps catch karta hai aur ADX >= 25 par trend pullbacks par trade leta hai.",
    ideal_market: "Gold, Bitcoin & Forex"
  },
  {
    id: "Trend_Breakout_EMA",
    name: "Trend Breakout (EMA 20/50 + ATR)",
    category: "Trend Following",
    badge: "High Expectancy",
    description_urdu: "EMA 20/50 crossover aur RSI > 50 filter ke sath 1:2 R:R dynamic trend rides execute karta hai.",
    ideal_market: "London & NY High Volume Sessions"
  },
  {
    id: "Mean_Reversion_RSI",
    name: "Mean Reversion Extreme (RSI 30/70)",
    category: "Mean Reversion",
    badge: "Range Scalping",
    description_urdu: "Overbought (RSI > 70) aur Oversold (RSI < 30) exhaustion par counter-trend bounces capture karta hai.",
    ideal_market: "Sideways / Asian Consolidation"
  },
  {
    id: "Liquidity_Sweep_S&R",
    name: "Liquidity Sweep Breakout (S&R Purge)",
    category: "Smart Money / ICT",
    badge: "Trap Reversal",
    description_urdu: "20-candle high/low ke bahar stop-loss hunting wicks par retail breakout traders trap hone par opposite trade leta hai.",
    ideal_market: "London Open & New York 09:30 EDT"
  },
  {
    id: "FVG_OrderBlock_ICT",
    name: "ICT Fair Value Gap & Order Block Mitigation",
    category: "Smart Money / ICT",
    badge: "Institutional Imbalance",
    description_urdu: "3-candle price displacement se bane FVG imbalances ke retest par institutional order block mitigation execute karta hai.",
    ideal_market: "London/NY Overlap (High Volatility)"
  },
  {
    id: "Bollinger_Squeeze_Breakout",
    name: "Bollinger Bands Volatility Squeeze",
    category: "Volatility Breakout",
    badge: "Expansion Hunter",
    description_urdu: "Jab volatility band contract hoti hai (compression), tab sudden explosive price expansion ko ride karta hai.",
    ideal_market: "Pre-News Consolidation & Asian Session"
  },
  {
    id: "MACD_Divergence_Trend",
    name: "MACD Divergence + 200 EMA Filter",
    category: "Momentum",
    badge: "Macro Trend Filter",
    description_urdu: "200 EMA ke trend ki simat mein MACD histogram divergence aur zero-line crossovers par entry leta hai.",
    ideal_market: "Daily & 4H Macro Swings"
  },
  {
    id: "SuperTrend_ATR_Trail",
    name: "SuperTrend ATR Volatility Trail",
    category: "Trend Following",
    badge: "Dynamic Trail",
    description_urdu: "3.0 ATR multiplier par dynamic trailing stop loss ke sath bari market moves ko bina premature exit ke pura capture karta hai.",
    ideal_market: "Strong Bull / Bear Trends"
  },
  {
    id: "Asian_Session_Range_Sweep",
    name: "Asian Range Sweep & London Reversal",
    category: "Session Liquidity",
    badge: "Judas Swing",
    description_urdu: "Asian range ke high ya low ko London open ke pehle 2 ghanton mein sweep karke opposite direction mein expansion karta hai.",
    ideal_market: "London Open (07:00 - 10:00 UTC)"
  },
  {
    id: "Fibonacci_Golden_Pocket",
    name: "Fibonacci 0.618 Golden Pocket Pullback",
    category: "Pullback Swing",
    badge: "Fib Retracement",
    description_urdu: "Major impulse wave ke 61.8% se 65% retracement golden pocket level par high probability institutional re-entries execute karta hai.",
    ideal_market: "Healthy Trending Pullbacks"
  },
  {
    id: "Custom_User_Signal",
    name: "Apna Analysis & Custom Signal Backtest",
    category: "Custom Analysis",
    badge: "Aapka Setup",
    description_urdu: "Aapka apna custom signal text (BUY/SELL, TP, SL) ya custom technical rules ko real past data par test karke exact win rate batata hai.",
    ideal_market: "User Defined Strategy"
  }
];

interface BacktestScreenProps {
  isDark: boolean;
  activeAccount?: any;
}

export const BacktestScreen: React.FC<BacktestScreenProps> = ({ isDark, activeAccount }) => {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [strategy, setStrategy] = useState("Adaptive_Market_OS");
  const [timeframe, setTimeframe] = useState("1h");
  const [period, setPeriod] = useState("3mo");
  const [equity, setEquity] = useState(1000);
  const [riskPct, setRiskPct] = useState(1.5);

  // Custom Signal / Analysis State
  const [customSignalText, setCustomSignalText] = useState("");
  const [customDirection, setCustomDirection] = useState<"BUY" | "SELL">("BUY");
  const [customTrigger, setCustomTrigger] = useState("EMA_CROSS");
  const [customTpPoints, setCustomTpPoints] = useState<number | "">(40);
  const [customSlPoints, setCustomSlPoints] = useState<number | "">(20);
  const [useBreakeven, setUseBreakeven] = useState(true);
  const [showCustomWorkspace, setShowCustomWorkspace] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Synchronize initial capital from user's active demo account
  useEffect(() => {
    if (activeAccount?.initial_capital) {
      setEquity(Number(activeAccount.initial_capital));
    } else {
      fetch("/api/execution/state")
        .then((r) => r.json())
        .then((data) => {
          if (data && data.account && data.account.initial_capital) {
            setEquity(Number(data.account.initial_capital));
          }
        })
        .catch(() => {});
    }
  }, [activeAccount?.id, activeAccount?.initial_capital]);

  const runSimulation = () => {
    setLoading(true);
    const isCustomMode = strategy === "Custom_User_Signal" || customSignalText.trim().length > 3;

    fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        strategy: isCustomMode ? "Custom_User_Signal" : strategy,
        timeframe,
        period,
        initial_equity: Number(equity) || 1000,
        risk_per_trade_pct: Number(riskPct) || 1.5,
        custom_signal_text: customSignalText.trim() || undefined,
        custom_direction: customDirection,
        custom_entry_trigger: customTrigger,
        custom_tp_points: customTpPoints !== "" ? Number(customTpPoints) : undefined,
        custom_sl_points: customSlPoints !== "" ? Number(customSlPoints) : undefined,
        use_breakeven: useBreakeven
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data && data.success) {
          setResult(data);
        } else {
          alert(data?.error || "Backtest execution failed.");
        }
      })
      .catch((err) => {
        setLoading(false);
        alert("Error executing backtest: " + err);
      });
  };

  useEffect(() => {
    runSimulation();
  }, [strategy, period, timeframe, symbol]);

  const activeStratMeta = ALL_STRATEGIES.find((s) => s.id === strategy) || ALL_STRATEGIES[0];

  // Quick preset loader for custom signal
  const loadCustomPreset = (presetText: string, dir: "BUY" | "SELL", tp: number, sl: number) => {
    setStrategy("Custom_User_Signal");
    setShowCustomWorkspace(true);
    setCustomSignalText(presetText);
    setCustomDirection(dir);
    setCustomTpPoints(tp);
    setCustomSlPoints(sl);
  };

  // Compute SVG chart points for Equity Curve
  const renderEquityChart = () => {
    if (!result || !result.equity_curve || result.equity_curve.length < 2) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-neutral-400 font-mono">
          Is configuration par koi trade trigger nahi hui. Timeframe ya Lookback barha kar dekhein.
        </div>
      );
    }

    const points = result.equity_curve;
    const minVal = Math.min(...points.map((p) => p.equity)) * 0.995;
    const maxVal = Math.max(...points.map((p) => p.equity)) * 1.005;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = 35;

    const coords = points.map((pt, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((pt.equity - minVal) / range) * (height - padding * 2);
      return { x, y, pt };
    });

    const pathD = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
      ""
    );

    const isProfit = result.net_profit >= 0;
    const strokeColor = isProfit ? "#10b981" : "#ef4444";
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
          <defs>
            <linearGradient id="eqGradBacktest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeDasharray="4" />

          <path d={areaD} fill="url(#eqGradBacktest)" />
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          <text x={padding} y={padding - 10} fill={isDark ? "#94a3b8" : "#64748b"} fontSize="10" fontWeight="bold" fontFamily="monospace">
            ${maxVal.toFixed(2)} Peak
          </text>
          <text x={padding} y={height - padding + 18} fill={isDark ? "#94a3b8" : "#64748b"} fontSize="10" fontWeight="bold" fontFamily="monospace">
            ${minVal.toFixed(2)} Trough
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto space-y-6 ${isDark ? "text-white" : "text-neutral-900"}`}>
      {/* 1. HEADER HERO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Quantitative Strategy &amp; Signal Backtest Lab</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl leading-relaxed">
            Apne analysis, custom signals, aur institutional algorithms ko real past market data par test karein. Exact Win Rate, Profit Factor, aur Roman Urdu Quant Verdict se check karein ke strategy live trading ke qabil hai ya nahi.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              Computing Past Candles...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run Backtest Simulation
            </>
          )}
        </button>
      </div>

      {/* 2. ROMAN URDU QUANT RELIABILITY VERDICT BANNER (HIGH CONTRAST) */}
      {result && result.verdict && (
        <div
          className={`p-5 rounded-3xl border-2 transition-all shadow-md ${
            result.verdict.badge_color === "rose"
              ? isDark
                ? "bg-rose-950/40 border-rose-600 text-rose-200"
                : "bg-rose-50 border-rose-400 text-rose-950"
              : result.verdict.badge_color === "emerald"
              ? isDark
                ? "bg-emerald-950/40 border-emerald-600 text-emerald-200"
                : "bg-emerald-50 border-emerald-400 text-emerald-950"
              : isDark
              ? "bg-amber-950/40 border-amber-600 text-amber-200"
              : "bg-amber-50 border-amber-400 text-amber-950"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {result.verdict.badge_color === "emerald" ? (
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                ) : result.verdict.badge_color === "rose" ? (
                  <ShieldAlert className={`w-5 h-5 shrink-0 ${isDark ? "text-rose-400" : "text-rose-700"}`} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${isDark ? "text-amber-400" : "text-amber-700"}`} />
                )}
                <h3 className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                  {result.verdict.verdict_title}
                </h3>
              </div>
              <p className={`text-xs leading-relaxed max-w-4xl font-sans ${isDark ? "text-slate-200 font-medium" : "text-slate-900 font-semibold"}`}>
                {result.verdict.verdict_urdu}
              </p>
              <div className={`pt-1 text-[11px] flex items-center gap-1.5 font-sans font-bold ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                <span className={`font-black uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded border ${
                  isDark
                    ? "bg-black/50 text-amber-300 border-amber-500/40"
                    : "bg-white text-slate-950 border-slate-300 shadow-sm"
                }`}>
                  Quant Recommendation:
                </span>
                <span>{result.verdict.recommendation_urdu}</span>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 font-mono">
              <div className={`text-[10px] uppercase font-black tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                Expectancy Win Rate
              </div>
              <div className={`text-2xl font-black ${
                result.win_rate >= 50
                  ? isDark ? "text-emerald-400" : "text-emerald-800"
                  : isDark ? "text-rose-400" : "text-rose-800"
              }`}>
                {result.win_rate}%
              </div>
              <div className={`text-[10px] font-bold ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                {result.winning_trades} Wins / {result.losing_trades} Losses
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. APNA ANALYSIS & CUSTOM SIGNAL TEXT BAR */}
      <div className={`p-5 rounded-3xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black tracking-tight">
              Apna Analysis &amp; Custom Signal Backtest Bar
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Natural Language &amp; Rules
            </span>
          </div>

          <button
            onClick={() => setShowCustomWorkspace(!showCustomWorkspace)}
            className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showCustomWorkspace ? "Hide Advanced Rules" : "Customize Rules & TP/SL"}
          </button>
        </div>

        {/* Text Input Bar */}
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={customSignalText}
              onChange={(e) => {
                setCustomSignalText(e.target.value);
                if (strategy !== "Custom_User_Signal") setStrategy("Custom_User_Signal");
              }}
              placeholder="Yahan apna signal likhein (e.g. BUY XAUUSD @ 2650 TP 2685 SL 2635 ya SELL BTC TP 62000 SL 66000)..."
              className={`w-full text-xs font-mono px-4 py-3 rounded-2xl border outline-none transition-all ${
                isDark
                  ? "bg-neutral-950 border-neutral-700 focus:border-amber-500 text-white placeholder:text-neutral-500"
                  : "bg-neutral-50 border-neutral-300 focus:border-amber-500 text-neutral-800 placeholder:text-neutral-400"
              }`}
            />
            {customSignalText && (
              <button
                onClick={() => setCustomSignalText("")}
                className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setStrategy("Custom_User_Signal");
              runSimulation();
            }}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-black" />
            Backtest Apna Signal
          </button>
        </div>

        {/* Quick Presets Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-[11px]">
          <span className="text-neutral-400 font-bold shrink-0">Quick Presets:</span>
          <button
            onClick={() => loadCustomPreset("BUY XAUUSD @ 2650 TP 2685 SL 2635", "BUY", 35, 15)}
            className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/20 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer whitespace-nowrap border border-neutral-300 dark:border-neutral-700"
          >
            Gold 1:2.3 Dip Buy
          </button>
          <button
            onClick={() => loadCustomPreset("SELL XAUUSD @ 2690 TP 2650 SL 2710", "SELL", 40, 20)}
            className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/20 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer whitespace-nowrap border border-neutral-300 dark:border-neutral-700"
          >
            Gold Key Resistance Rejection
          </button>
          <button
            onClick={() => loadCustomPreset("BUY BTC @ 63500 TP 66000 SL 62000", "BUY", 2500, 1500)}
            className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-500/20 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer whitespace-nowrap border border-neutral-300 dark:border-neutral-700"
          >
            Bitcoin Breakout Long
          </button>
        </div>

        {/* Advanced Rules Drawer */}
        {showCustomWorkspace && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Direction Bias
              </label>
              <select
                value={customDirection}
                onChange={(e) => setCustomDirection(e.target.value as any)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
                }`}
              >
                <option value="BUY">BUY / LONG Setup</option>
                <option value="SELL">SELL / SHORT Setup</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Entry Trigger Rule
              </label>
              <select
                value={customTrigger}
                onChange={(e) => setCustomTrigger(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
                }`}
              >
                <option value="EMA_CROSS">EMA 20/50 Crossover</option>
                <option value="RSI_EXTREME">RSI Extreme Rebound (30/70)</option>
                <option value="BREAKOUT">20-Candle High/Low Breakout</option>
                <option value="WICK_REJECTION">Candle Wick Rejection</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Take Profit (Points)
              </label>
              <input
                type="number"
                value={customTpPoints}
                onChange={(e) => setCustomTpPoints(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="40"
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Stop Loss (Points)
              </label>
              <input
                type="number"
                value={customSlPoints}
                onChange={(e) => setCustomSlPoints(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="20"
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
                }`}
              />
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Breakeven Protection
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer py-1.5">
                <input
                  type="checkbox"
                  checked={useBreakeven}
                  onChange={(e) => setUseBreakeven(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                Move SL to BE at +1R
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. STRATEGY REGISTRY SELECTOR & PARAMETERS */}
      <div className={`p-5 rounded-3xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          {/* Asset Symbol */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Asset Symbol
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="XAUUSD">Gold (XAU/USD)</option>
              <option value="BTCUSD">Bitcoin (BTC/USD)</option>
              <option value="EURUSD">Euro FX (EUR/USD)</option>
              <option value="SILVER">Silver (XAG/USD)</option>
              <option value="US30">Dow Jones (US30)</option>
              <option value="SPX">S&amp;P 500 (SPX)</option>
            </select>
          </div>

          {/* Strategy Dropdown with ALL strategies */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Strategy Algorithm ({ALL_STRATEGIES.length} Available)
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              {ALL_STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} [{s.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="15m">15 Minutes (Scalp)</option>
              <option value="1h">1 Hour (Institutional)</option>
              <option value="4h">4 Hours (Swing)</option>
              <option value="1d">Daily Macro</option>
            </select>
          </div>

          {/* Granular Lookback Months */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Lookback Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="1mo">1 Month</option>
              <option value="2mo">2 Months</option>
              <option value="3mo">3 Months (Quarterly)</option>
              <option value="6mo">6 Months (Semi-Annual)</option>
              <option value="1y">1 Year (Annual Cycle)</option>
              <option value="2y">2 Years (Deep Past Data)</option>
            </select>
          </div>

          {/* Custom Capital */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Custom Capital ($)
            </label>
            <input
              type="number"
              value={equity}
              onChange={(e) => setEquity(Number(e.target.value))}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            />
          </div>
        </div>

        {/* Selected Strategy Quant Explanation Card */}
        <div className="p-3.5 rounded-2xl bg-black/30 border border-neutral-200/20 dark:border-neutral-800 flex items-start gap-2.5 text-xs">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              <span>{activeStratMeta.name}</span>
              <span className="text-[9px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeStratMeta.badge}
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed font-sans">
              {activeStratMeta.description_urdu}
            </p>
          </div>
        </div>
      </div>

      {/* 5. KPI CARDS GRID (HIGH CONTRAST) */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Win Rate</span>
            <div className={`text-xl font-black mt-1 ${result.win_rate >= 50 ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-rose-400" : "text-rose-700")}`}>
              {result.win_rate}%
            </div>
            <span className={`text-[10px] font-mono font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              {result.winning_trades}W / {result.losing_trades}L ({result.total_trades} Total)
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Net Return</span>
            <div className={`text-xl font-black mt-1 ${result.total_return_pct >= 0 ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-rose-400" : "text-rose-700")}`}>
              {result.total_return_pct >= 0 ? "+" : ""}{result.total_return_pct}%
            </div>
            <span className={`text-[10px] font-mono font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              ${result.final_equity.toLocaleString()} Equity
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Net Profit ($)</span>
            <div className={`text-xl font-black mt-1 ${result.net_profit >= 0 ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-rose-400" : "text-rose-700")}`}>
              {result.net_profit >= 0 ? "+" : ""}${result.net_profit.toLocaleString()}
            </div>
            <span className={`text-[10px] font-mono font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              Initial: ${result.initial_equity.toLocaleString()}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Max Drawdown</span>
            <div className={`text-xl font-black mt-1 ${isDark ? "text-rose-400" : "text-rose-700"}`}>
              {result.max_drawdown_pct}%
            </div>
            <span className={`text-[10px] font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>Peak-to-Trough Risk</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Profit Factor</span>
            <div className={`text-xl font-black mt-1 ${result.profit_factor >= 1.5 ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-neutral-300" : "text-slate-800")}`}>
              {result.profit_factor}
            </div>
            <span className={`text-[10px] font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>Gross Win / Loss</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-neutral-300" : "text-slate-700"}`}>Sharpe Ratio</span>
            <div className={`text-xl font-black mt-1 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
              {result.sharpe_ratio}
            </div>
            <span className={`text-[10px] font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>Annualized Risk-Adj</span>
          </div>
        </div>
      )}

      {/* 6. EQUITY CURVE VISUALIZER */}
      <div className={`p-5 rounded-3xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>Cumulative Capital Growth (Equity Curve)</h2>
            <p className={`text-[11px] font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>Real mark-to-market progression over backtested historical window</p>
          </div>
          <span className={`text-xs font-mono font-bold ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
            {symbol} &bull; {result?.strategy_name || strategy} &bull; {period}
          </span>
        </div>
        {renderEquityChart()}
      </div>

      {/* 7. TRADE LOG AUDIT TRAIL TABLE (HIGH CONTRAST) */}
      {result && result.trade_log && (
        <div className={`p-5 rounded-3xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>Historical Trades Audit Trail</h2>
              <p className={`text-[11px] font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>Inspect individual entries, exits, TP hits, SL hits, and exact dates</p>
            </div>
            <span className={`text-xs font-bold font-mono ${isDark ? "text-neutral-300" : "text-slate-800"}`}>Showing last {result.trade_log.length} trades</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b-2 ${isDark ? "border-neutral-700 text-neutral-200 bg-neutral-800/80" : "border-slate-300 text-slate-900 bg-slate-100/90 font-black uppercase text-[11px]"}`}>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Entry Time</th>
                  <th className="py-3 px-3">Exit Time</th>
                  <th className="py-3 px-3 font-mono">Entry</th>
                  <th className="py-3 px-3 font-mono">Exit</th>
                  <th className="py-3 px-3 font-mono">PnL ($)</th>
                  <th className="py-3 px-3 font-mono">Return</th>
                  <th className="py-3 px-3">Exit Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800/60 font-mono">
                {result.trade_log.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 font-bold">
                      No trades matched the criteria in this lookback.
                    </td>
                  </tr>
                ) : (
                  result.trade_log.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className={`py-3 px-3 font-bold ${isDark ? "text-neutral-400" : "text-slate-700"}`}>#{t.id}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black border ${
                          t.type === "BUY"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600"
                            : "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border border-rose-400 dark:border-rose-600"
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-xs font-mono font-medium ${isDark ? "text-neutral-300" : "text-slate-800"}`}>{t.entry_time}</td>
                      <td className={`py-3 px-3 text-xs font-mono font-medium ${isDark ? "text-neutral-300" : "text-slate-800"}`}>{t.exit_time}</td>
                      <td className={`py-3 px-3 font-bold text-xs ${isDark ? "text-white" : "text-slate-950"}`}>${t.entry_price.toFixed(2)}</td>
                      <td className={`py-3 px-3 font-bold text-xs ${isDark ? "text-white" : "text-slate-950"}`}>${t.exit_price.toFixed(2)}</td>
                      <td className={`py-3 px-3 font-black text-xs ${t.pnl >= 0 ? (isDark ? "text-emerald-400" : "text-emerald-800") : (isDark ? "text-rose-400" : "text-rose-800")}`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                      </td>
                      <td className={`py-3 px-3 font-black text-xs ${t.pnl_pct >= 0 ? (isDark ? "text-emerald-400" : "text-emerald-800") : (isDark ? "text-rose-400" : "text-rose-800")}`}>
                        {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shadow-sm ${
                          t.exit_reason.includes("Take Profit")
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600"
                            : "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border border-rose-400 dark:border-rose-600"
                        }`}>
                          {t.exit_reason.includes("Take Profit") ? "✓ Take Profit Hit" : "✗ Stop Loss Hit"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestScreen;
