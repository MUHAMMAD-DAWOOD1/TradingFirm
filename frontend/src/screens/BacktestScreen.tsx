import React, { useState, useEffect } from "react";

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

interface BacktestResult {
  success: boolean;
  symbol: string;
  strategy: string;
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
  error?: string;
}

interface BacktestScreenProps {
  isDark: boolean;
}

export const BacktestScreen: React.FC<BacktestScreenProps> = ({ isDark }) => {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [strategy, setStrategy] = useState("Trend_Breakout_EMA");
  const [timeframe, setTimeframe] = useState("1h");
  const [period, setPeriod] = useState("3mo");
  const [equity, setEquity] = useState(10000);
  const [riskPct, setRiskPct] = useState(1.5);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const runSimulation = () => {
    setLoading(true);
    fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        strategy,
        timeframe,
        period,
        initial_equity: Number(equity),
        risk_per_trade_pct: Number(riskPct),
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
  }, []);

  // Compute SVG chart points for Equity Curve
  const renderEquityChart = () => {
    if (!result || !result.equity_curve || result.equity_curve.length < 2) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
          No equity points generated for this configuration.
        </div>
      );
    }

    const points = result.equity_curve;
    const minVal = Math.min(...points.map((p) => p.equity)) * 0.995;
    const maxVal = Math.max(...points.map((p) => p.equity)) * 1.005;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = 30;

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
    const fillColor = isProfit ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)";

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            strokeDasharray="4"
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            strokeDasharray="4"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            strokeDasharray="4"
          />

          {/* Shaded Area */}
          <path d={areaD} fill="url(#eqGrad)" />

          {/* Equity Line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Min and Max Labels */}
          <text
            x={padding}
            y={padding - 8}
            fill={isDark ? "#94a3b8" : "#64748b"}
            fontSize="10"
            fontWeight="bold"
          >
            ${maxVal.toFixed(0)}
          </text>
          <text
            x={padding}
            y={height - padding + 18}
            fill={isDark ? "#94a3b8" : "#64748b"}
            fontSize="10"
            fontWeight="bold"
          >
            ${minVal.toFixed(0)}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDark ? "text-white" : "text-neutral-900"}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Institutional Lab
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Historical OHLCV Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Quantitative Strategy Backtesting Lab</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Test institutional rules, drawdown metrics, and profit expectancy on real historical data before deploying capital.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="mt-4 md:mt-0 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Computing Alpha...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run Quantitative Simulation
            </>
          )}
        </button>
      </div>

      {/* Control Panel Parameters */}
      <div className={`p-4 rounded-xl mb-6 border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Asset Symbol
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="XAUUSD">Gold (XAU/USD)</option>
              <option value="BTCUSD">Bitcoin (BTC/USD)</option>
              <option value="EURUSD">Euro FX (EUR/USD)</option>
              <option value="SILVER">Silver (XAG/USD)</option>
              <option value="US30">Dow Jones (US30)</option>
              <option value="SPX">S&P 500 (SPX)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Strategy Algorithm
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="Trend_Breakout_EMA">Trend Breakout (EMA 20/50 + ATR)</option>
              <option value="Mean_Reversion_RSI">Mean Reversion (RSI 30/70)</option>
              <option value="Liquidity_Sweep_S&R">Liquidity Sweep Breakout</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour (Institutional)</option>
              <option value="1d">Daily Swing</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Lookback Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            >
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Initial Capital ($)
            </label>
            <input
              type="number"
              value={equity}
              onChange={(e) => setEquity(Number(e.target.value))}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className={`w-full text-xs font-semibold px-2.5 py-2 rounded-lg border outline-none ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800"
              }`}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Win Rate</span>
            <div className={`text-xl font-black mt-1 ${result.win_rate >= 50 ? "text-emerald-500" : "text-amber-500"}`}>
              {result.win_rate}%
            </div>
            <span className="text-[10px] text-neutral-500">
              {result.winning_trades}W / {result.losing_trades}L ({result.total_trades} Total)
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Return</span>
            <div className={`text-xl font-black mt-1 ${result.total_return_pct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {result.total_return_pct >= 0 ? "+" : ""}
              {result.total_return_pct}%
            </div>
            <span className="text-[10px] text-neutral-500">
              ${result.final_equity.toLocaleString()} Final Equity
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Max Drawdown</span>
            <div className="text-xl font-black mt-1 text-rose-500">
              {result.max_drawdown_pct}%
            </div>
            <span className="text-[10px] text-neutral-500">
              Peak-to-Trough Risk
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Profit Factor</span>
            <div className={`text-xl font-black mt-1 ${result.profit_factor >= 1.5 ? "text-emerald-500" : "text-neutral-400"}`}>
              {result.profit_factor}
            </div>
            <span className="text-[10px] text-neutral-500">
              Gross Win / Loss
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sharpe Ratio</span>
            <div className="text-xl font-black mt-1 text-blue-500">
              {result.sharpe_ratio}
            </div>
            <span className="text-[10px] text-neutral-500">
              Annualized Risk-Adj
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Net Profit ($)</span>
            <div className={`text-xl font-black mt-1 ${result.net_profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {result.net_profit >= 0 ? "+" : ""}${result.net_profit.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-500">
              Risk: {riskPct}% / trade
            </span>
          </div>
        </div>
      )}

      {/* Equity Curve Visualizer */}
      <div className={`p-5 rounded-xl border mb-6 ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Cumulative Capital Growth (Equity Curve)</h2>
            <p className="text-[11px] text-neutral-500">Mark-to-market progression over backtested window</p>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-400">
            {symbol} &bull; {strategy} &bull; {period}
          </span>
        </div>
        {renderEquityChart()}
      </div>

      {/* Trade Log Table */}
      {result && result.trade_log && (
        <div className={`p-5 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Historical Trades Audit Trail</h2>
              <p className="text-[11px] text-neutral-500">Inspect individual trade entries, exits, slippage, and reasons</p>
            </div>
            <span className="text-xs text-neutral-400 font-bold">Showing last {result.trade_log.length} trades</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? "border-neutral-800 text-neutral-400" : "border-neutral-200 text-neutral-600"}`}>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3">Exit Time</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Exit Price</th>
                  <th className="py-2.5 px-3">PnL ($)</th>
                  <th className="py-2.5 px-3">Return</th>
                  <th className="py-2.5 px-3">Exit Trigger</th>
                </tr>
              </thead>
              <tbody>
                {result.trade_log.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b font-mono ${
                      isDark ? "border-neutral-800/50 hover:bg-neutral-800/30" : "border-neutral-100 hover:bg-neutral-50"
                    }`}
                  >
                    <td className="py-2 px-3 text-neutral-400 font-bold">{t.id}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.type === "BUY"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-neutral-400">{t.entry_time}</td>
                    <td className="py-2 px-3 text-neutral-400">{t.exit_time}</td>
                    <td className="py-2 px-3 font-semibold">${t.entry_price}</td>
                    <td className="py-2 px-3 font-semibold">${t.exit_price}</td>
                    <td className={`py-2 px-3 font-black ${t.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl}
                    </td>
                    <td className={`py-2 px-3 font-bold ${t.pnl_pct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct}%
                    </td>
                    <td className="py-2 px-3 text-neutral-400 text-[11px] font-sans">{t.exit_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
