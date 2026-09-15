import React, { useState, useEffect } from "react";
import TradingViewWidget from "../components/TradingViewWidget";

interface Asset {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change24h: number;
  shariah_status?: string;
  tradingview_symbol?: string;
}

interface TradeScreenProps {
  assets: Asset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenDeepDive: () => void;
  isDark: boolean;
  onTradeExecuted?: () => void;
  prefilledSignal?: any;
}

export const TradeScreen: React.FC<TradeScreenProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  onOpenDeepDive,
  isDark,
  onTradeExecuted,
  prefilledSignal,
}) => {
  // In-place UI states
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [timeframe, setTimeframe] = useState<"5m" | "1h" | "8h" | "1D" | "1W">("8h");
  const [amount, setAmount] = useState<number>(5000);
  const [leverage, setLeverage] = useState<number>(25);
  const [selectedSlPreset, setSelectedSlPreset] = useState<number>(-10);
  const [selectedTpPreset, setSelectedTpPreset] = useState<number>(35);
  const [showTVWidget, setShowTVWidget] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Custom typed parameters & Demo Capital state
  const [customLot, setCustomLot] = useState<string>("");
  const [customSlPrice, setCustomSlPrice] = useState<string>("");
  const [customTpPrice, setCustomTpPrice] = useState<string>("");
  const [accountState, setAccountState] = useState<any>(null);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState<boolean>(false);
  const [inputCapital, setInputCapital] = useState<string>("10000");
  const [capitalLoading, setCapitalLoading] = useState<boolean>(false);

  const fetchExecutionState = () => {
    fetch("/api/execution/state")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.account) {
          setAccountState(d.account);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchExecutionState();
    const interval = setInterval(fetchExecutionState, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleResetCapital = (hardReset: boolean = true) => {
    setCapitalLoading(true);
    fetch("/api/execution/capital/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capital: parseFloat(inputCapital) || 10000, hard_reset: hardReset }),
    })
      .then((r) => r.json())
      .then((d) => {
        setCapitalLoading(false);
        if (d && d.success) {
          setAccountState(d.state.account);
          setIsCapitalModalOpen(false);
          setOrderToast({
            message: `Demo Capital set to $${parseFloat(inputCapital).toLocaleString()}! Ready for testing.`,
            type: "success",
          });
          if (onTradeExecuted) onTradeExecuted();
        }
      })
      .catch(() => setCapitalLoading(false));
  };

  useEffect(() => {
    if (prefilledSignal) {
      if (prefilledSignal.type === "SELL" || prefilledSignal.side === "SELL" || prefilledSignal.direction === "SELL") {
        setSide("SELL");
      } else if (prefilledSignal.type === "BUY" || prefilledSignal.side === "BUY" || prefilledSignal.direction === "BUY") {
        setSide("BUY");
      }
      if (prefilledSignal.stop_loss && currentAsset.price) {
        const pctDiff = ((prefilledSignal.stop_loss - currentAsset.price) / currentAsset.price) * 100;
        setSelectedSlPreset(Math.round(pctDiff));
      }
      if (prefilledSignal.take_profit_targets && prefilledSignal.take_profit_targets.length > 0 && currentAsset.price) {
        const pctDiff = ((prefilledSignal.take_profit_targets[0] - currentAsset.price) / currentAsset.price) * 100;
        setSelectedTpPreset(Math.round(pctDiff));
      }
    }
  }, [prefilledSignal]);

  // Asset data
  const currentAsset = assets.find((a) => a.symbol === selectedSymbol) || {
    symbol: "XAUUSD",
    name: "Gold Spot",
    category: "commodity",
    price: 2684.40,
    change24h: 1.84,
    shariah_status: "Shariah Compliant",
  };

  const currentPrice = currentAsset.price || 2684.40;
  const isGold = currentAsset.symbol === "XAUUSD";

  // Calculations for Order sizing
  const notionalExposure = amount * leverage;
  const marginRequired = amount;
  const slPrice = (currentPrice * (1 + (side === "BUY" ? selectedSlPreset / 100 : -selectedSlPreset / 100))).toFixed(2);
  const tpPrice = (currentPrice * (1 + (side === "BUY" ? selectedTpPreset / 100 : -selectedTpPreset / 100))).toFixed(2);

  // Risk rating based on leverage
  const riskBadge =
    leverage <= 10
      ? { label: "Low Risk", color: "bg-emerald-500/15 text-[#10B981] border-emerald-500/30" }
      : leverage <= 30
      ? { label: "Moderate Risk", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { label: "High Risk", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" };

  // Core assets for bottom carousel
  const miniAssetsList = [
    { symbol: "ETH", pair: "ETH/USD", price: 2642.15, change: "+2.45%", isUp: true },
    { symbol: "BTC", pair: "BTC/USD", price: 68420.50, change: "+1.18%", isUp: true },
    { symbol: "SOL", pair: "SOL/USD", price: 178.90, change: "-3.12%", isUp: false },
    { symbol: "EURUSD", pair: "EUR/USD", price: 1.0842, change: "+0.42%", isUp: true },
    { symbol: "XAGUSD", pair: "XAG/USD", price: 31.48, change: "+1.64%", isUp: true },
    { symbol: "BNB", pair: "BNB/USD", price: 588.20, change: "+0.85%", isUp: true },
    { symbol: "NDX100", pair: "NDX100", price: 20384.50, change: "+1.22%", isUp: true },
    { symbol: "GBPUSD", pair: "GBP/USD", price: 1.3065, change: "-0.18%", isUp: false },
  ];

  // Map real assets to mini list if available
  const displayMiniAssets = miniAssetsList.map((m) => {
    const real = assets.find((a) => a.symbol === m.symbol || (m.symbol === "BTC" && a.symbol.includes("BTC")));
    if (real && real.price > 0) {
      return {
        ...m,
        price: real.price,
        change: `${real.change24h >= 0 ? "+" : ""}${real.change24h.toFixed(2)}%`,
        isUp: real.change24h >= 0,
      };
    }
    return m;
  });

  const handlePlaceOrder = async () => {
    setExecuting(true);
    try {
      const autoLot = Math.max(0.01, Number((notionalExposure / (currentPrice * (isGold ? 100 : 1))).toFixed(2)));
      const lotSize = customLot ? Math.max(0.01, parseFloat(customLot)) : autoLot;
      const finalSl = customSlPrice ? parseFloat(customSlPrice) : parseFloat(slPrice);
      const finalTp = customTpPrice ? parseFloat(customTpPrice) : parseFloat(tpPrice);

      const res = await fetch("/api/execution/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: currentAsset.symbol,
          side: side,
          order_type: "MARKET",
          quantity: lotSize,
          entry_price: currentPrice,
          stop_loss: finalSl,
          take_profit: finalTp,
          leverage: leverage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderToast({
          message: `${side} Order for ${currentAsset.symbol} filled at $${currentPrice.toFixed(2)} (${lotSize} Lots)!`,
          type: "success",
        });
        fetchExecutionState();
        if (onTradeExecuted) onTradeExecuted();
      } else {
        setOrderToast({
          message: data.detail || "Order execution rejected",
          type: "error",
        });
      }
    } catch (err: any) {
      setOrderToast({
        message: err.message || "Execution error",
        type: "error",
      });
    } finally {
      setExecuting(false);
      setTimeout(() => setOrderToast(null), 4000);
    }
  };

  return (
    <main className="w-full px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Toast Notification */}
      {orderToast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl transition-all animate-fade-in ${
            orderToast.type === "success"
              ? "bg-surface border border-emerald-500/40 text-main"
              : "bg-surface border border-rose-500/40 text-main"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              orderToast.type === "success" ? "text-[#10B981]" : "text-rose-500"
            }`}
          >
            {orderToast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-[13px] font-bold">{orderToast.message}</span>
        </div>
      )}

      {/* Paper Trading Demo Account Header Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-surface border border-border-subtle card-shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-main tracking-tight">Paper Trading Demo Account</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Live Practice Mode
              </span>
            </div>
            <p className="text-[11px] text-muted">
              Apna custom capital choose karein, strategies test karein, aur balance grow karein.
            </p>
          </div>
        </div>

        {/* Demo Account Stats */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end overflow-x-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted block">Demo Balance</span>
            <span className="font-mono text-[16px] font-bold text-main">
              ${(accountState?.equity ?? 100000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-8 w-px bg-border-subtle hidden sm:block" />

          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-muted block">Available Margin</span>
            <span className="font-mono text-[14px] font-bold text-muted">
              ${(accountState?.available_margin ?? 100000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-8 w-px bg-border-subtle" />

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted block">Realized PnL</span>
            <span className={`font-mono text-[14px] font-bold ${(accountState?.realized_pnl ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {(accountState?.realized_pnl ?? 0) >= 0 ? "+" : ""}${(accountState?.realized_pnl ?? 0).toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsCapitalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-well hover:bg-well-subtle border border-border-subtle text-main font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-500">tune</span>
            <span>Set Custom Capital</span>
          </button>
        </div>
      </div>

      {/* Set Custom Capital Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border-subtle rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">account_balance</span>
                <h3 className="text-[15px] font-bold text-main">Demo Capital Fix Karein</h3>
              </div>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="w-7 h-7 rounded-full bg-well flex items-center justify-center text-muted hover:text-main"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Aap apne demo paper account ka initial balance apni marzi se set kar sakte hain (e.g. $1,000, $5,000, $10,000) taake real trading jaisi practice ho sake.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                Custom Demo Capital ($)
              </label>
              <input
                type="number"
                value={inputCapital}
                onChange={(e) => setInputCapital(e.target.value)}
                className="w-full text-lg font-mono font-bold px-4 py-2.5 rounded-xl bg-well border border-border-subtle text-main outline-none"
                placeholder="e.g. 5000"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              {[1000, 5000, 10000, 25000, 50000].map((val) => (
                <button
                  key={val}
                  onClick={() => setInputCapital(String(val))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold bg-well border border-border-subtle hover:bg-well-subtle text-muted hover:text-main transition-colors"
                >
                  ${val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleResetCapital(false)}
                disabled={capitalLoading}
                className="flex-1 py-3 rounded-xl bg-well border border-border-subtle hover:bg-well-subtle text-main font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Update Capital
              </button>
              <button
                onClick={() => handleResetCapital(true)}
                disabled={capitalLoading}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {capitalLoading ? "Setting..." : "Reset & Start Fresh"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN (~65% width: 8 of 12 columns)                    */}
        {/* ============================================================ */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Chart & Asset Container Card */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 card-shadow relative overflow-hidden">
            {/* Asset Header Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <span className="material-symbols-outlined text-[22px]">
                      {isGold ? "monetization_on" : "currency_bitcoin"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      {/* Asset Switcher Dropdown */}
                      <select
                        value={selectedSymbol}
                        onChange={(e) => onSelectSymbol(e.target.value)}
                        className="font-bold text-[18px] text-main bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-0 p-0 pr-1 tracking-tight"
                      >
                        {assets.map((a) => (
                          <option key={a.symbol} value={a.symbol} className="bg-surface text-main">
                            {a.symbol} ({a.name})
                          </option>
                        ))}
                      </select>

                      <span className="text-[12px] text-muted hidden sm:inline">
                        {currentAsset.name}
                      </span>

                      <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">
                          verified
                        </span>
                        Shariah Verified
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="font-mono text-[30px] font-extrabold tracking-tight text-main tabular-nums">
                        ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`font-mono text-[13px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          currentAsset.change24h >= 0
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-[#10B981]"
                            : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {currentAsset.change24h >= 0 ? "arrow_drop_up" : "arrow_drop_down"}
                        </span>
                        {currentAsset.change24h >= 0 ? "+" : ""}
                        {currentAsset.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeframe Pills & Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-well border border-border-subtle rounded-full p-1">
                  {(["5m", "1h", "8h", "1D", "1W"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        timeframe === tf
                          ? isDark
                            ? "bg-white text-black font-bold shadow-sm"
                            : "bg-black text-white font-bold shadow-sm"
                          : "text-muted hover:text-main"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-well border border-border-subtle rounded-full p-1">
                  <button
                    onClick={() => setShowTVWidget(!showTVWidget)}
                    title={showTVWidget ? "Switch to Interactive SVG" : "Switch to TradingView Chart"}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      showTVWidget ? "bg-amber-400 text-black font-bold" : "text-muted hover:text-main"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      candlestick_chart
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive Candlestick Chart Area */}
            <div className="w-full h-[500px] relative mt-2 select-none bg-well rounded-2xl border border-border-subtle p-2 overflow-hidden">
              {showTVWidget ? (
                <TradingViewWidget
                  symbol={
                    currentAsset.tradingview_symbol ||
                    (currentAsset.symbol === "XAUUSD"
                      ? "OANDA:XAUUSD"
                      : currentAsset.symbol === "BTCUSD" || currentAsset.symbol === "BTC"
                      ? "BINANCE:BTCUSDT"
                      : currentAsset.symbol === "ETHUSD" || currentAsset.symbol === "ETH"
                      ? "BINANCE:ETHUSDT"
                      : "OANDA:" + currentAsset.symbol)
                  }
                  theme={isDark ? "dark" : "light"}
                />
              ) : (
                /* High-Fidelity Interactive SVG Candlestick Simulation */
                <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 860 480">
                  <defs>
                    <linearGradient id="chartAmbientGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
                      <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <rect x="0" y="0" width="860" height="430" fill="url(#chartAmbientGrad)" />

                  {/* Grid Lines */}
                  {[40, 105, 170, 235, 300, 365].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={y}
                      x2="840"
                      y2={y}
                      stroke={isDark ? "#FFFFFF" : "#000000"}
                      strokeDasharray="3 3"
                      opacity={isDark ? "0.1" : "0.07"}
                      strokeWidth="1"
                    />
                  ))}
                  <line
                    x1="50"
                    y1="430"
                    x2="840"
                    y2="430"
                    stroke={isDark ? "#FFFFFF" : "#000000"}
                    opacity="0.15"
                    strokeWidth="1"
                  />

                  {/* Y-Axis Price Labels */}
                  <text x="40" y="44" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 1.006).toFixed(1)}
                  </text>
                  <text x="40" y="109" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 1.004).toFixed(1)}
                  </text>
                  <text x="40" y="174" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 1.002).toFixed(1)}
                  </text>
                  <text x="40" y="239" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {currentPrice.toFixed(1)}
                  </text>
                  <text x="40" y="304" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 0.998).toFixed(1)}
                  </text>
                  <text x="40" y="369" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 0.996).toFixed(1)}
                  </text>
                  <text x="40" y="434" fill="#8A8F98" fontFamily="JetBrains Mono" fontSize="11" textAnchor="end">
                    {(currentPrice * 0.994).toFixed(1)}
                  </text>

                  {/* Simulated Dynamic Institutional Candles */}
                  <line x1="80" y1="270" x2="80" y2="380" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="74" y="290" width="12" height="55" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="108" y1="240" x2="108" y2="340" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="102" y="250" width="12" height="65" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="136" y1="220" x2="136" y2="310" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="130" y="240" width="12" height="48" rx="3" fill="#F59E0B" filter="url(#glowAmber)" />

                  <line x1="164" y1="250" x2="164" y2="350" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="158" y="270" width="12" height="60" rx="3" fill="#F59E0B" filter="url(#glowAmber)" />

                  <line x1="220" y1="280" x2="220" y2="370" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="214" y="295" width="12" height="46" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="304" y1="325" x2="304" y2="415" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="298" y="340" width="12" height="52" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="360" y1="245" x2="360" y2="335" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="354" y="260" width="12" height="54" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="416" y1="195" x2="416" y2="305" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="410" y="210" width="12" height="72" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="444" y1="165" x2="444" y2="255" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="438" y="180" width="12" height="54" rx="3" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="500" y1="95" x2="500" y2="225" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  <rect x="493" y="115" width="14" height="98" rx="4" fill="#10B981" filter="url(#glowGreen)" />

                  <line x1="556" y1="110" x2="556" y2="200" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="550" y="125" width="12" height="52" rx="3" fill="#F59E0B" filter="url(#glowAmber)" />

                  <line x1="640" y1="120" x2="640" y2="195" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  <rect x="633" y="135" width="14" height="44" rx="4" fill="#10B981" filter="url(#glowGreen)" />

                  {/* Active Tick Crosshair */}
                  <line
                    x1="50"
                    y1="145"
                    x2="840"
                    y2="145"
                    stroke={isDark ? "#FFFFFF" : "#000000"}
                    strokeDasharray="4 4"
                    opacity="0.4"
                    strokeWidth="1"
                  />
                  <line
                    x1="500"
                    y1="40"
                    x2="500"
                    y2="430"
                    stroke={isDark ? "#FFFFFF" : "#000000"}
                    strokeDasharray="4 4"
                    opacity="0.4"
                    strokeWidth="1"
                  />
                  <circle cx="500" cy="145" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" filter="url(#glowGreen)" />

                  {/* Price Tag Box */}
                  <g transform="translate(425, 82)">
                    <rect
                      x="0"
                      y="0"
                      width="150"
                      height="44"
                      rx="10"
                      fill={isDark ? "#16171B" : "#FFFFFF"}
                      stroke="rgba(140, 140, 150, 0.3)"
                      strokeWidth="1"
                    />
                    <text x="75" y="17" fill="#8A8F98" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle">
                      Live Swarm Tick
                    </text>
                    <text x="75" y="33" fill={isDark ? "#FFFFFF" : "#000000"} fontFamily="JetBrains Mono" fontSize="13" fontWeight="700" textAnchor="middle">
                      ${currentPrice.toFixed(2)}
                    </text>
                  </g>

                  {/* X-Axis Time Labels */}
                  {["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((t, idx) => (
                    <text
                      key={t}
                      x={80 + idx * 112}
                      y="460"
                      fill="#8A8F98"
                      fontFamily="JetBrains Mono"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {t}
                    </text>
                  ))}
                </svg>
              )}
            </div>
          </div>

          {/* Mini Asset Carousel / Bottom Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {displayMiniAssets.map((item) => (
              <div
                key={item.pair}
                onClick={() => onSelectSymbol(item.symbol)}
                className="bg-surface border border-border-subtle rounded-2xl p-4 card-shadow hover:border-border-strong cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-main">
                      {item.pair}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.isUp
                        ? "bg-emerald-500/15 text-[#10B981]"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>

                <div className="font-mono text-[16px] font-bold text-main mb-2 tabular-nums">
                  ${typeof item.price === "number" ? item.price.toLocaleString() : item.price}
                </div>

                <svg className="w-full h-8" fill="none" viewBox="0 0 120 30">
                  <path
                    d={
                      item.isUp
                        ? "M0 24 Q 20 28, 40 18 T 80 12 T 120 4"
                        : "M0 6 Q 35 8, 70 20 T 120 26"
                    }
                    stroke={item.isUp ? "#10B981" : "#F59E0B"}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d={
                      item.isUp
                        ? "M0 24 Q 20 28, 40 18 T 80 12 T 120 4 L 120 30 L 0 30 Z"
                        : "M0 6 Q 35 8, 70 20 T 120 26 L 120 30 L 0 30 Z"
                    }
                    fill={item.isUp ? "#10B981" : "#F59E0B"}
                    fillOpacity="0.1"
                  />
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (~35% width: 4 of 12 columns, Order & Stance)  */}
        {/* ============================================================ */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* BUY / SELL Toggle */}
          <div className="w-full bg-well border border-border-subtle p-1 rounded-full flex items-center shadow-sm">
            <button
              onClick={() => setSide("BUY")}
              className={`w-1/2 py-2.5 rounded-full font-bold text-[13px] transition-all text-center ${
                side === "BUY"
                  ? isDark
                    ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                    : "bg-black text-white shadow-sm"
                  : "text-muted hover:text-main"
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSide("SELL")}
              className={`w-1/2 py-2.5 rounded-full font-bold text-[13px] transition-all text-center ${
                side === "SELL"
                  ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                  : "text-muted hover:text-main"
              }`}
            >
              SELL
            </button>
          </div>

          {/* AI Master Stance Card */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-5 card-shadow">
            <div className="flex items-center justify-between pb-3">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  AI Master Stance
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-1.5 ${
                      side === "BUY"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-[#10B981]"
                        : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        side === "BUY" ? "bg-[#10B981] animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    {side === "BUY" ? "STRONG BUY" : "TACTICAL SHORT"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Radial Gauge */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/20"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={side === "BUY" ? "text-[#10B981]" : "text-rose-500"}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="89, 100"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute font-mono text-[12px] font-bold text-main">
                    89%
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[12px] font-bold text-main block">
                    High Conviction
                  </span>
                  <span className="text-[11px] text-muted">Macro Sync</span>
                </div>
              </div>
            </div>

            {/* Levels Well */}
            <div className="bg-well border border-border-subtle rounded-xl p-3.5 my-2 space-y-2 text-[12px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans font-medium">Entry Zone</span>
                <span className="font-bold text-main">
                  ${(currentPrice * 0.999).toFixed(2)} — ${(currentPrice * 1.001).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans font-medium">Stop Loss</span>
                <span className="font-bold text-rose-400">
                  ${slPrice} ({selectedSlPreset}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans font-medium">Target 1</span>
                <span className="font-semibold text-[#10B981]">
                  ${(currentPrice * 1.01).toFixed(2)} (1:1.8)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans font-medium">Target 2</span>
                <span className="font-semibold text-[#10B981]">
                  ${tpPrice} (+{selectedTpPreset}%)
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                <span className="text-muted font-sans font-bold">Risk : Reward</span>
                <span className="font-bold text-main">1 : 3.4</span>
              </div>
            </div>

            {/* Trigger Drawer Link */}
            <div className="mt-2 text-right">
              <button
                onClick={onOpenDeepDive}
                className="text-[12px] font-bold text-muted hover:text-main inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View full analysis</span>
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Order Input & Leverage Card */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-5 card-shadow flex flex-col gap-4">
            {/* Amount Section (Typed + Presets) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-muted">Amount ($)</label>
                <span className="text-[11px] text-muted">Type custom or pick preset</span>
              </div>
              <div className="flex items-center justify-between bg-well border border-border-subtle rounded-xl px-3.5 py-1.5 focus-within:border-blue-500 transition-colors">
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full bg-transparent font-mono text-[22px] font-bold text-main tabular-nums outline-none"
                />
                <span className="bg-surface border border-border-subtle px-3 py-1 rounded-full text-[11px] font-bold text-main shrink-0">
                  USD
                </span>
              </div>

              {/* Amount Quick Presets */}
              <div className="flex items-center justify-between gap-1.5 mt-2">
                {[1000, 2500, 5000, 10000, 25000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                      amount === val
                        ? isDark
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-black text-white font-bold shadow-sm"
                        : "bg-well border border-border-subtle text-muted hover:text-main"
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage Section (Typed + Slider) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-muted">Leverage</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadge.color}`}>
                    {riskBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leverage}
                    onChange={(e) => setLeverage(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-14 text-right font-mono text-[13px] font-bold px-2 py-0.5 rounded-lg bg-well border border-border-subtle text-main outline-none focus:border-blue-500"
                  />
                  <span className="font-mono text-[13px] font-bold text-main">x</span>
                </div>
              </div>
              <div className="relative w-full py-1">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-well rounded-lg appearance-none cursor-pointer focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-muted font-mono mt-1 px-1">
                  <span>1x</span>
                  <span>25x</span>
                  <span>50x</span>
                  <span>75x</span>
                  <span>100x</span>
                </div>
              </div>
            </div>

            {/* Lot Size Section (Typed Custom Lot or Auto-Calculated) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-muted">Lot Size (Contracts)</label>
                <div className="flex items-center gap-1">
                  {customLot && (
                    <button
                      onClick={() => setCustomLot("")}
                      className="text-[10px] text-blue-500 hover:underline font-bold"
                    >
                      Reset Auto
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-muted">
                    Auto: {Math.max(0.01, Number((notionalExposure / (currentPrice * (isGold ? 100 : 1))).toFixed(2)))} Lots
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-well border border-border-subtle rounded-xl px-3.5 py-1.5 focus-within:border-blue-500 transition-colors">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={String(Math.max(0.01, Number((notionalExposure / (currentPrice * (isGold ? 100 : 1))).toFixed(2))))}
                  value={customLot}
                  onChange={(e) => setCustomLot(e.target.value)}
                  className="w-full bg-transparent font-mono text-base font-bold text-main outline-none"
                />
                <span className="bg-surface border border-border-subtle px-2.5 py-0.5 rounded-full text-[10px] font-bold text-muted shrink-0">
                  {customLot ? "Custom Lot" : "Auto Calculated"}
                </span>
              </div>
            </div>

            {/* Stop Loss (Presets + Typed Price) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] font-semibold text-muted">Stop Loss Price</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder={slPrice}
                  value={customSlPrice}
                  onChange={(e) => setCustomSlPrice(e.target.value)}
                  className="w-28 text-right font-mono text-xs px-2 py-1 rounded-lg bg-well border border-border-subtle text-main outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {[-5, -10, -15, -25].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      setSelectedSlPreset(pct);
                      setCustomSlPrice("");
                    }}
                    className={`flex-1 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                      selectedSlPreset === pct && !customSlPrice
                        ? isDark
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-black text-white font-bold shadow-sm"
                        : "bg-well border border-border-subtle text-muted hover:text-main"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Take Profit (Presets + Typed Price) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] font-semibold text-muted">Take Profit Price</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder={tpPrice}
                  value={customTpPrice}
                  onChange={(e) => setCustomTpPrice(e.target.value)}
                  className="w-28 text-right font-mono text-xs px-2 py-1 rounded-lg bg-well border border-border-subtle text-[#10B981] outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {[15, 35, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      setSelectedTpPreset(pct);
                      setCustomTpPrice("");
                    }}
                    className={`flex-1 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                      selectedTpPreset === pct && !customTpPrice
                        ? isDark
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-black text-white font-bold shadow-sm"
                        : "bg-well border border-border-subtle text-muted hover:text-main"
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Required & Notional Exposure */}
            <div className="flex justify-between items-center pt-3 border-t border-border-subtle text-muted text-[12px] font-mono">
              <div>
                <span className="text-[11px] block text-muted font-sans">Margin Required</span>
                <span className="font-bold text-main font-mono tabular-nums">
                  ${marginRequired.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] block text-muted font-sans">Notional Exposure</span>
                <span className="font-bold text-main font-mono tabular-nums">
                  ${notionalExposure.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={executing}
              className={`w-full py-4 rounded-full font-extrabold text-[15px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer ${
                side === "BUY"
                  ? isDark
                    ? "bg-white hover:bg-neutral-200 text-black shadow-[0_0_24px_rgba(255,255,255,0.28)]"
                    : "bg-black hover:bg-neutral-800 text-white shadow-md"
                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.35)]"
              }`}
            >
              <span>{executing ? "Executing Trade..." : `Place ${side} Order`}</span>
              <span className="material-symbols-outlined text-[18px] font-bold">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Execution Specs List */}
          <div className="px-2 py-1 space-y-2 text-muted text-[12px] font-mono">
            <div className="flex justify-between items-center">
              <span className="font-sans text-muted">Execution price</span>
              <span className="font-semibold text-main">${currentPrice.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-muted">Spread</span>
              <span className="font-semibold text-main">0.12 pts (0.004%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-muted">Slippage tolerance</span>
              <span className="font-semibold text-main">0.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-muted">Daily limit remaining</span>
              <span className="font-semibold text-main">$450,000.00 USD</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};
