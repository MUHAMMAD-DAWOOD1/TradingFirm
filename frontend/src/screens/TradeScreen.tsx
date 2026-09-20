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
  activeAccount?: any;
  onOpenAccountManager?: () => void;
}

export const TradeScreen: React.FC<TradeScreenProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  onOpenDeepDive,
  isDark,
  onTradeExecuted,
  prefilledSignal,
  activeAccount,
  onOpenAccountManager,
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
  const [customLeverage, setCustomLeverage] = useState<string>("");
  const [customSlPrice, setCustomSlPrice] = useState<string>("");
  const [customTpPrice, setCustomTpPrice] = useState<string>("");
  const [selectedAiTp, setSelectedAiTp] = useState<"TP1" | "TP2" | "CUSTOM">("TP2");
  const [isAiSynced, setIsAiSynced] = useState<boolean>(true);
  const [accountState, setAccountState] = useState<any>(null);

  // Real-time AI Master Stance state
  const [aiStanceData, setAiStanceData] = useState<any>(null);
  const [isAnalyzingStance, setIsAnalyzingStance] = useState<boolean>(false);
  const [lastStanceTimestamp, setLastStanceTimestamp] = useState<string>("");

  const fetchLiveAIStance = async (symToAnalyze?: string) => {
    const sym = symToAnalyze || selectedSymbol || "XAUUSD";
    setIsAnalyzingStance(true);
    try {
      const activeLev = customLeverage !== "" ? Math.max(1, Number(customLeverage)) : leverage;
      const curCap = Number(activeAccount?.balance ?? accountState?.balance ?? 100);
      const isMetal = sym.includes("XAU") || sym.includes("GOLD");
      const computedLot = customLot
        ? Math.max(0.01, parseFloat(customLot))
        : (curCap <= 500 ? 0.01 : Math.max(0.01, Number(((curCap * 0.5 * activeLev) / ((currentPrice || 2684.4) * (isMetal ? 100 : 1))).toFixed(2))));

      const res = await fetch("/api/agents/deep-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          account_id: activeAccount?.id || "ACC_DEFAULT",
          user_capital: curCap,
          leverage: activeLev,
          lot_size: computedLot,
          risk_pct: 2.0,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setAiStanceData(data);
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastStanceTimestamp(timeFormatted);

        // 1. Auto-set Direction from AI solution
        if (data.direction === "BUY" || data.direction === "SELL") {
          setSide(data.direction);
        }

        // 2. Auto-set Stop Loss from AI solution
        if (data.levels?.stop_loss) {
          setCustomSlPrice(String(Number(data.levels.stop_loss).toFixed(2)));
        }

        // 3. Auto-set Take Profit from AI solution (Default to TP2 or TP1)
        const primaryTp = data.levels?.target_2 || data.levels?.target_1;
        if (primaryTp) {
          setCustomTpPrice(String(Number(primaryTp).toFixed(2)));
          setSelectedAiTp(data.levels?.target_2 ? "TP2" : "TP1");
        }
        setIsAiSynced(true);
      }
    } catch (err) {
      console.error("Error fetching live AI stance:", err);
    } finally {
      setIsAnalyzingStance(false);
    }
  };

  const syncToAiLevels = (targetType: "TP1" | "TP2" = "TP2") => {
    if (!aiStanceData) return;
    if (aiStanceData.direction === "BUY" || aiStanceData.direction === "SELL") {
      setSide(aiStanceData.direction);
    }
    if (aiStanceData.levels?.stop_loss) {
      setCustomSlPrice(String(Number(aiStanceData.levels.stop_loss).toFixed(2)));
    }
    const targetPrice = targetType === "TP1"
      ? (aiStanceData.levels?.target_1 || aiStanceData.levels?.target_2)
      : (aiStanceData.levels?.target_2 || aiStanceData.levels?.target_1);

    if (targetPrice) {
      setCustomTpPrice(String(Number(targetPrice).toFixed(2)));
      setSelectedAiTp(targetType);
    }
    setIsAiSynced(true);
    setOrderToast({
      message: `Order synced to AI Solution (${aiStanceData.direction}): SL $${Number(aiStanceData.levels?.stop_loss).toFixed(2)} | ${targetType} $${Number(targetPrice).toFixed(2)}`,
      type: "success",
    });
  };

  useEffect(() => {
    fetchLiveAIStance(selectedSymbol);
  }, [selectedSymbol, activeAccount?.id, activeAccount?.balance, leverage, customLeverage]);

  const fetchExecutionState = () => {
    const url = activeAccount?.id ? `/api/execution/state?account_id=${activeAccount.id}` : "/api/execution/state";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          if (d.account) {
            setAccountState(d.account);
            setAmount((prev) => {
              if (prev === 5000 && d.account.equity < 5000) {
                return Math.max(10, Math.round((d.account.available_margin || d.account.equity || 100) * 0.5));
              }
              return prev;
            });
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchExecutionState();
    const interval = setInterval(fetchExecutionState, 2000);
    return () => clearInterval(interval);
  }, [activeAccount?.id]);

  useEffect(() => {
    if (prefilledSignal) {
      if (prefilledSignal.type === "SELL" || prefilledSignal.side === "SELL" || prefilledSignal.direction === "SELL") {
        setSide("SELL");
      } else if (prefilledSignal.type === "BUY" || prefilledSignal.side === "BUY" || prefilledSignal.direction === "BUY") {
        setSide("BUY");
      }
      if (prefilledSignal.stop_loss) {
        setCustomSlPrice(String(prefilledSignal.stop_loss));
      }
      if (prefilledSignal.take_profit_targets && prefilledSignal.take_profit_targets.length > 0) {
        setCustomTpPrice(String(prefilledSignal.take_profit_targets[0]));
      } else if (prefilledSignal.take_profit) {
        setCustomTpPrice(String(prefilledSignal.take_profit));
      }
      if (prefilledSignal.leverage) {
        setLeverage(prefilledSignal.leverage);
        setCustomLeverage(String(prefilledSignal.leverage));
      }
      setIsAiSynced(true);
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

  // Calculations for Order sizing with Account-Level Leverage support
  const activeLeverage = activeAccount?.leverage || (customLeverage !== "" ? Math.max(1, Number(customLeverage)) : leverage);
  const notionalExposure = amount * activeLeverage;
  const marginRequired = amount;
  const autoLot = Math.max(0.01, Number((notionalExposure / (currentPrice * (isGold ? 100 : 1))).toFixed(2)));
  const lotSize = customLot ? Math.max(0.01, parseFloat(customLot)) : autoLot;

  const slPrice = (currentPrice * (1 + (side === "BUY" ? selectedSlPreset / 100 : -selectedSlPreset / 100))).toFixed(2);
  const tpPrice = (currentPrice * (1 + (side === "BUY" ? selectedTpPreset / 100 : -selectedTpPreset / 100))).toFixed(2);

  // Risk rating based on active leverage
  const riskBadge =
    activeLeverage <= 10
      ? { label: "Low Risk", color: "bg-emerald-500/15 text-[#10B981] border-emerald-500/30" }
      : activeLeverage <= 30
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

  const handlePlaceOrder = async (overrideSide?: "BUY" | "SELL") => {
    setExecuting(true);
    try {
      const activeSide = overrideSide || side || aiStanceData?.direction || "BUY";
      const finalSl = customSlPrice
        ? parseFloat(customSlPrice)
        : (aiStanceData?.levels?.stop_loss ? Number(aiStanceData.levels.stop_loss) : parseFloat(slPrice));
      const finalTp = customTpPrice
        ? parseFloat(customTpPrice)
        : (aiStanceData?.levels?.target_2 ? Number(aiStanceData.levels.target_2) : (aiStanceData?.levels?.target_1 ? Number(aiStanceData.levels.target_1) : parseFloat(tpPrice)));

      const res = await fetch("/api/execution/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: currentAsset.symbol,
          side: activeSide,
          order_type: "MARKET",
          quantity: lotSize,
          entry_price: currentPrice,
          stop_loss: finalSl,
          take_profit: finalTp,
          leverage: activeLeverage,
          account_id: activeAccount?.id || "ACC_DEFAULT",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderToast({
          message: `${activeSide} Order placed on [${activeAccount?.name || 'Demo'}]: Filled at $${currentPrice.toFixed(2)} (${lotSize} Lots, ${activeLeverage}x, SL: $${finalSl}, TP: $${finalTp})`,
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
      setTimeout(() => setOrderToast(null), 5000);
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

          {onOpenAccountManager && (
            <button
              onClick={onOpenAccountManager}
              className="px-3.5 py-2 rounded-xl bg-well hover:bg-well-subtle border border-border-subtle text-main font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-500">manage_accounts</span>
              <span>Manage Accounts</span>
            </button>
          )}
        </div>
      </div>

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

                      {currentAsset.shariah_status === "Shariah Compliant" && (
                        <span className="text-[11px] text-muted font-medium ml-1">
                          • Halal
                        </span>
                      )}
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

          {/* Live Market Watch & Quick Switch Grid (Balances layout height & provides 1-click asset switching) */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-5 card-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">candlestick_chart</span>
                <span className="text-[13px] font-extrabold text-main">Live Market Watch &amp; Quick Switch</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Click asset to analyze &amp; trade</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {assets.slice(0, 8).map((asset) => {
                const isSelected = asset.symbol === selectedSymbol;
                const isPositive = (asset.change_24h ?? 0) >= 0;
                return (
                  <button
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? isDark
                          ? "bg-white/10 border-white/40 shadow-sm"
                          : "bg-black/5 border-black/30 shadow-sm"
                        : "bg-well border-border-subtle hover:border-border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-black text-xs text-main">{asset.symbol}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}{(asset.change_24h ?? 0).toFixed(2)}%
                      </span>
                    </div>

                    <div>
                      <div className="font-mono font-bold text-[13px] text-main tabular-nums">
                        ${(asset.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </div>
                      <div className="text-[10px] text-muted font-sans truncate mt-0.5">
                        {asset.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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

          {/* AI Master Stance Card (Real-Time Live Analysis) */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-5 card-shadow flex flex-col gap-3">
            {/* Top Row: Title, Live Timestamp & Re-Analyze Live Button */}
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  AI Master Stance
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted">
                    {isAnalyzingStance
                      ? "AI Analyzing Live..."
                      : lastStanceTimestamp
                      ? `Live at ${lastStanceTimestamp}`
                      : "Real-Time Synced"}
                  </span>
                </div>
              </div>

              {/* Manual Re-Analyze Live Now Button */}
              <button
                onClick={() => fetchLiveAIStance(currentAsset.symbol)}
                disabled={isAnalyzingStance}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Run fresh live AI multi-agent analysis on current price tick"
              >
                <span className={`material-symbols-outlined text-[14px] ${isAnalyzingStance ? "animate-spin" : ""}`}>
                  {isAnalyzingStance ? "sync" : "refresh"}
                </span>
                <span>{isAnalyzingStance ? "Analyzing..." : "Re-Analyze"}</span>
              </button>
            </div>

            {/* Stance Banner & Confidence Gauge */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-[13px] font-black flex items-center gap-1.5 ${
                      isAnalyzingStance
                        ? "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                        : (aiStanceData?.direction || side) === "BUY"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-[#10B981]"
                        : (aiStanceData?.direction || side) === "SELL"
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAnalyzingStance
                          ? "bg-blue-400 animate-spin"
                          : (aiStanceData?.direction || side) === "BUY"
                          ? "bg-[#10B981] animate-pulse"
                          : (aiStanceData?.direction || side) === "SELL"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }`}
                    />
                    {isAnalyzingStance
                      ? "ANALYZING..."
                      : (aiStanceData?.direction || side) === "BUY"
                      ? "STRONG BUY"
                      : (aiStanceData?.direction || side) === "SELL"
                      ? "TACTICAL SHORT"
                      : "WAIT FOR RETEST"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Radial Gauge */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/20"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={
                        (aiStanceData?.direction || side) === "BUY" ? "text-[#10B981]" : "text-rose-500"
                      }
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${aiStanceData?.confidence_score || 84}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono text-[11px] font-bold text-main">
                    {aiStanceData?.confidence_score || 84}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Calculated Levels Well */}
            <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-2.5 text-[12px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans font-medium">Entry Zone</span>
                <span className="font-bold text-main">
                  {aiStanceData?.levels?.entry_zone ||
                    `$${(currentPrice * 0.9998).toFixed(2)} — $${(currentPrice * 1.0002).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted font-sans font-medium">Stop Loss</span>
                  {aiStanceData?.levels?.max_risk_usd !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-400 font-bold border border-rose-500/25">
                      Max Loss: -${Number(aiStanceData.levels.max_risk_usd).toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="font-bold text-rose-400">
                  ${aiStanceData?.levels?.stop_loss ? Number(aiStanceData.levels.stop_loss).toFixed(2) : slPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted font-sans font-medium">Target 1</span>
                  {aiStanceData?.levels?.tp1_gain_usd !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                      +${Number(aiStanceData.levels.tp1_gain_usd).toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#10B981]">
                  ${aiStanceData?.levels?.target_1 ? Number(aiStanceData.levels.target_1).toFixed(2) : (currentPrice * 1.01).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted font-sans font-medium">Target 2</span>
                  {aiStanceData?.levels?.tp2_gain_usd !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                      +${Number(aiStanceData.levels.tp2_gain_usd).toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#10B981]">
                  ${aiStanceData?.levels?.target_2 ? Number(aiStanceData.levels.target_2).toFixed(2) : tpPrice}
                </span>
              </div>

              {/* Liquidation Buffer & Account Protection Indicator */}
              {aiStanceData?.levels?.liquidation_price && (
                <div className="flex justify-between items-center pt-2 border-t border-border-subtle text-[11px]">
                  <span className="text-muted font-sans flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">shield</span>
                    Account Buffer:
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>SAFE</span>
                    <span className="text-muted font-normal text-[10px]">
                      (Stopout at ${Number(aiStanceData.levels.liquidation_price).toFixed(2)})
                    </span>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-border-subtle">
                <span className="text-muted font-sans font-bold">Risk : Reward</span>
                <span className="font-bold text-main">
                  {aiStanceData?.levels?.risk_reward || "1 : 2.0"}
                </span>
              </div>
            </div>



            {/* Risk Management Note (Roman Urdu) */}
            {aiStanceData?.risk_officer_urdu && (
              <div className="p-3 rounded-2xl bg-well border border-border-subtle text-[11px]">
                <span className="text-muted font-bold text-[10px] uppercase tracking-wider block mb-1">
                  Risk Management Note
                </span>
                <p className="text-main leading-relaxed font-sans">
                  {aiStanceData.risk_officer_urdu}
                </p>
              </div>
            )}

            {/* Trigger Drawer Link */}
            <div className="text-right">
              <button
                onClick={onOpenDeepDive}
                className="text-[12px] font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View full analysis &amp; debate</span>
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Order Input & Leverage Card */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-5 card-shadow flex flex-col gap-4">

            {/* Targets (TP1 & TP2) Selector */}
            <div className="p-3.5 rounded-2xl bg-well border border-border-subtle flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Target Selection ({side})
                </span>
                <button
                  type="button"
                  onClick={() => syncToAiLevels(selectedAiTp === "TP1" ? "TP1" : "TP2")}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-muted hover:text-main cursor-pointer flex items-center gap-1 transition-all"
                  title="Sync SL & TP to current analysis"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span>
                  <span>Sync Targets</span>
                </button>
              </div>

              {/* Both Positions / Targets given by AI */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAiTp("TP1");
                    if (aiStanceData?.levels?.target_1) {
                      setCustomTpPrice(String(Number(aiStanceData.levels.target_1).toFixed(2)));
                    }
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedAiTp === "TP1"
                      ? "bg-emerald-500/20 border-emerald-400 text-white font-black shadow-sm"
                      : "bg-well border-border-subtle text-muted hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted font-sans font-bold">
                    <span>Position 1: TP 1</span>
                    {selectedAiTp === "TP1" && <span className="text-emerald-400 font-bold">✓ Active</span>}
                  </div>
                  <div className="text-emerald-400 font-black font-mono mt-0.5">
                    ${aiStanceData?.levels?.target_1 ? Number(aiStanceData.levels.target_1).toFixed(2) : "—"}
                  </div>
                  <div className="text-[9px] text-muted font-sans mt-0.5">Conservative Target</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAiTp("TP2");
                    if (aiStanceData?.levels?.target_2) {
                      setCustomTpPrice(String(Number(aiStanceData.levels.target_2).toFixed(2)));
                    }
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedAiTp === "TP2"
                      ? "bg-emerald-500/20 border-emerald-400 text-white font-black shadow-sm"
                      : "bg-well border-border-subtle text-muted hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted font-sans font-bold">
                    <span>Position 2: TP 2</span>
                    {selectedAiTp === "TP2" && <span className="text-emerald-400 font-bold">✓ Active</span>}
                  </div>
                  <div className="text-emerald-400 font-black font-mono mt-0.5">
                    ${aiStanceData?.levels?.target_2 ? Number(aiStanceData.levels.target_2).toFixed(2) : "—"}
                  </div>
                  <div className="text-[9px] text-muted font-sans mt-0.5">Extended Runner TP</div>
                </button>
              </div>
            </div>

            {/* Amount Section (Typed + Equity % Presets) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-muted">Amount ($)</label>
                <span className="text-[11px] text-muted">Type custom capital or pick %</span>
              </div>
              <div className="flex items-center justify-between bg-well border border-border-subtle rounded-xl px-3.5 py-1.5 focus-within:border-blue-500 transition-colors">
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="100"
                  className="w-full bg-transparent font-mono text-[22px] font-bold text-main tabular-nums outline-none"
                />
                <span className="bg-surface border border-border-subtle px-3 py-1 rounded-full text-[11px] font-bold text-main shrink-0">
                  USD
                </span>
              </div>

              {/* Amount Quick Percentage of Equity Presets */}
              <div className="flex items-center justify-between gap-1.5 mt-2">
                {[0.25, 0.50, 0.75, 1.0].map((pct) => {
                  const avail = accountState?.available_margin || accountState?.equity || 100;
                  const targetAmt = Math.max(10, Math.round(avail * pct));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setAmount(targetAmt)}
                      className={`flex-1 py-1 rounded-full font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                        amount === targetAmt
                          ? isDark
                            ? "bg-white text-black font-bold shadow-sm"
                            : "bg-black text-white font-bold shadow-sm"
                          : "bg-well border border-border-subtle text-muted hover:text-main"
                      }`}
                    >
                      {pct * 100}% (${targetAmt})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Leverage Setting Spec */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-well border border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Account Leverage</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-mono font-black text-main">
                      1:{activeAccount?.leverage || leverage || 100} Fixed (Broker Standard)
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${riskBadge.color}`}>
                      {riskBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {onOpenAccountManager && (
                <button
                  type="button"
                  onClick={onOpenAccountManager}
                  className="px-2.5 py-1 rounded-xl bg-surface border border-border-subtle hover:border-amber-400/50 text-[11px] font-mono font-bold text-muted hover:text-main flex items-center gap-1 transition-all cursor-pointer"
                  title="Modify leverage in Account Settings"
                >
                  <span className="material-symbols-outlined text-[13px]">settings</span>
                  <span>Settings</span>
                </button>
              )}
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

            {/* Stop Loss (Presets + Typed Price + AI Sync Badge) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-muted">Stop Loss Price</span>
                  {customSlPrice && customSlPrice === String(Number(aiStanceData?.levels?.stop_loss).toFixed(2)) && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      AI SL Synced
                    </span>
                  )}
                </div>
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

            {/* Take Profit (Presets + Typed Price + AI Sync Badge) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-muted">Take Profit Price</span>
                  {customTpPrice && (customTpPrice === String(Number(aiStanceData?.levels?.target_2).toFixed(2)) || customTpPrice === String(Number(aiStanceData?.levels?.target_1).toFixed(2))) && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      AI TP Synced
                    </span>
                  )}
                </div>
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
              onClick={() => handlePlaceOrder()}
              disabled={executing}
              className={`w-full py-4 rounded-full font-extrabold text-[14px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer ${
                side === "BUY"
                  ? isDark
                    ? "bg-white hover:bg-neutral-200 text-black shadow-[0_0_24px_rgba(255,255,255,0.28)]"
                    : "bg-black hover:bg-neutral-800 text-white shadow-md"
                  : "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.35)]"
              }`}
            >
              <span>
                {executing
                  ? "Executing Trade..."
                  : `⚡ Place ${side} Order on AI Signal (SL: $${customSlPrice || (aiStanceData?.levels?.stop_loss ? Number(aiStanceData.levels.stop_loss).toFixed(2) : slPrice)} | TP: $${customTpPrice || (aiStanceData?.levels?.target_2 ? Number(aiStanceData.levels.target_2).toFixed(2) : tpPrice)})`}
              </span>
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
