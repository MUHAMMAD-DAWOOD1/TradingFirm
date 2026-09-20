import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  ClipboardPaste,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Flame,
  Zap,
  Target
} from "lucide-react";

interface Signal {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  source: string;
  channel_name: string;
  entry_min?: number;
  entry_max?: number;
  stop_loss?: number;
  take_profit_targets?: number[];
  risk_reward?: string;
  trap_status: "VERIFIED_ALPHA" | "RETAIL_TRAP_SUSPECTED" | "HIGH_RISK_VOLATILE" | "MACRO_HAZARD";
  trap_score: number;
  trap_reasons: string[];
  swarm_confidence: number;
  outcome_status: "PENDING" | "ACTIVE" | "SUCCESS_TP" | "FAILED_SL" | "TRAP_AVOIDED_SL" | "CANCELLED";
  resolved_at?: string;
  resolved_price?: number;
  resolution_notes?: string;
  realized_rr?: number;
  is_user_custom?: number;
  user_notes?: string;
  cro_verdict_urdu?: string;
  raw_text: string;
  created_at?: string;
}

interface PerformanceMetrics {
  total_signals_audited: number;
  pending_signals_count: number;
  resolved_signals_count: number;
  tp_hit_count: number;
  sl_hit_count: number;
  traps_avoided_count: number;
  ai_accuracy_rate: number;
  alpha_win_rate: number;
  custom_user_signals_count: number;
  custom_user_win_rate: number;
}

interface SignalsScreenProps {
  onOpenManageChannels: () => void;
  onDeploySignal: (signal: Signal) => void;
  isDark: boolean;
}

export const SignalsScreen: React.FC<SignalsScreenProps> = ({
  onOpenManageChannels,
  onDeploySignal,
  isDark,
}) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [activeInputTab, setActiveInputTab] = useState<"CUSTOM" | "PASTE">("CUSTOM");
  const [filter, setFilter] = useState<
    "ALL" | "CUSTOM" | "PASTED" | "VERIFIED" | "TRAP" | "WON" | "LOST" | "TRAP_AVOIDED"
  >("ALL");
  const [loading, setLoading] = useState(false);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  // Form State: Apna Signal (Custom Trade Plan)
  const [customAsset, setCustomAsset] = useState("XAUUSD");
  const [customDirection, setCustomDirection] = useState<"BUY" | "SELL">("BUY");
  const [customEntry, setCustomEntry] = useState("2685.00");
  const [customSL, setCustomSL] = useState("2670.00");
  const [customTP, setCustomTP] = useState("2715.00");
  const [customRiskPct, setCustomRiskPct] = useState("1.5");
  const [customNotes, setCustomNotes] = useState("");
  const [submittingCustom, setSubmittingCustom] = useState(false);

  // Form State: Logon Ka Signal (Paste Text)
  const [rawText, setRawText] = useState("");
  const [pasteSource, setPasteSource] = useState("TELEGRAM");
  const [parsing, setParsing] = useState(false);

  // Fetch Signals Feed and Performance Metrics
  const fetchFeedAndMetrics = () => {
    fetch("/api/signals/feed?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.signals)) {
          setSignals(d.signals);
        }
      })
      .catch(() => {});

    fetch("/api/signals/performance")
      .then((r) => r.json())
      .then((m) => {
        if (m && typeof m.total_signals_audited === "number") {
          setMetrics(m);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFeedAndMetrics();
    const interval = setInterval(fetchFeedAndMetrics, 6000);
    return () => clearInterval(interval);
  }, []);

  // Quick populate live price into Custom Entry
  const handleUseLivePrice = async () => {
    try {
      const res = await fetch(`/api/market-price/${customAsset}`);
      if (res.ok) {
        const d = await res.json();
        if (d && d.price) {
          const p = Number(d.price);
          setCustomEntry(p.toFixed(2));
          if (customDirection === "BUY") {
            setCustomSL((p * 0.992).toFixed(2));
            setCustomTP((p * 1.018).toFixed(2));
          } else {
            setCustomSL((p * 1.008).toFixed(2));
            setCustomTP((p * 0.982).toFixed(2));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Custom Trade Plan (Apna Signal)
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEntry || !customSL || !customTP) return;
    setSubmittingCustom(true);

    try {
      const res = await fetch("/api/signals/custom-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: customAsset,
          direction: customDirection,
          entry_price: parseFloat(customEntry),
          stop_loss: parseFloat(customSL),
          take_profit: parseFloat(customTP),
          risk_pct: parseFloat(customRiskPct) || 1.0,
          user_notes: customNotes.trim()
        }),
      });
      const newSig = await res.json();
      if (res.ok && newSig && newSig.id) {
        setCustomNotes("");
        fetchFeedAndMetrics();
      }
    } catch (err) {
      console.error("Custom trade submission failed:", err);
    } finally {
      setSubmittingCustom(false);
    }
  };

  // Submit Pasted Signal (Logon Ka Signal)
  const handleParseAndAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setParsing(true);

    try {
      const res = await fetch("/api/signals/parse-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText.trim(),
          source: pasteSource,
          channel_name: `${pasteSource} Quick-Paste`,
        }),
      });
      const newSig = await res.json();
      if (res.ok && newSig && newSig.id) {
        setRawText("");
        fetchFeedAndMetrics();
      }
    } catch (err) {
      console.error("Signal parse error:", err);
    } finally {
      setParsing(false);
    }
  };

  // Trigger Immediate Outcome Validation
  const handleValidateNow = async () => {
    try {
      setLoading(true);
      await fetch("/api/signals/validate-now", { method: "POST" });
      fetchFeedAndMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter Signals
  const filteredSignals = signals.filter((s) => {
    if (filter === "CUSTOM") return s.is_user_custom === 1;
    if (filter === "PASTED") return s.is_user_custom === 0;
    if (filter === "VERIFIED") return s.trap_status === "VERIFIED_ALPHA";
    if (filter === "TRAP") return s.trap_status === "RETAIL_TRAP_SUSPECTED";
    if (filter === "WON") return s.outcome_status === "SUCCESS_TP";
    if (filter === "LOST") return s.outcome_status === "FAILED_SL";
    if (filter === "TRAP_AVOIDED") return s.outcome_status === "TRAP_AVOIDED_SL";
    return true;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Signals &amp; Alpha Audit (سگنل ویریفکیشن اور ٹریڈ پلان)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Apna custom trade plan audit karein ya Telegram/VIP signals paste karein. Multi-agent trap detection aur automated TP/SL verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleValidateNow}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
            title="Check live market prices and validate outcomes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
            <span>Validate Outcomes Now</span>
          </button>

          <button
            onClick={onOpenManageChannels}
            className="inline-flex items-center gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span>Manage Channels</span>
          </button>
        </div>
      </div>

      {/* 2. SELF-LEARNING PERFORMANCE STATISTICS BAR */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Audited */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center justify-between">
              <span>Signals Audited</span>
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
              {metrics.total_signals_audited}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">
              {metrics.custom_user_signals_count} Custom • {metrics.total_signals_audited - metrics.custom_user_signals_count} Pasted
            </div>
          </div>

          {/* Card 2: AI Accuracy Rate */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm backdrop-blur-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center justify-between">
              <span>AI Accuracy Score</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
              {metrics.ai_accuracy_rate}%
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">
              True Positives + Traps Blocked
            </div>
          </div>

          {/* Card 3: Validated TP Hits */}
          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm backdrop-blur-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mb-1 flex items-center justify-between">
              <span>Validated TP Hits</span>
              <Target className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-500 dark:text-blue-400 font-mono">
              {metrics.tp_hit_count} <span className="text-xs font-sans text-neutral-400 font-normal">Wins</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">
              {metrics.alpha_win_rate}% Alpha Win Rate
            </div>
          </div>

          {/* Card 4: Traps Avoided (Capital Saved) */}
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm backdrop-blur-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-1 flex items-center justify-between">
              <span>Traps Avoided</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
              {metrics.traps_avoided_count} <span className="text-xs font-sans text-neutral-400 font-normal">Saved</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">
              Fakeouts Flagged (Capital Safe)
            </div>
          </div>
        </div>
      )}

      {/* 3. DUAL INPUT WORKSPACE: Apna Signal vs Logon Ka Signal */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md">
        {/* Workspace Mode Switcher */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveInputTab("CUSTOM")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeInputTab === "CUSTOM"
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Apna Signal (My Custom Trade Plan)</span>
            </button>

            <button
              onClick={() => setActiveInputTab("PASTE")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeInputTab === "PASTE"
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Logon Ka Signal (Telegram / VIP Paste)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline-block">
            {activeInputTab === "CUSTOM" ? "Discretionary Analysis Engine" : "Multi-Platform NLP Parser"}
          </span>
        </div>

        {/* TAB 1: APNA SIGNAL (CUSTOM TRADE PLAN FORM) */}
        {activeInputTab === "CUSTOM" && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Asset Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Asset Pair
                </label>
                <select
                  value={customAsset}
                  onChange={(e) => setCustomAsset(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                >
                  <option value="XAUUSD">Gold (XAUUSD)</option>
                  <option value="BTC">Bitcoin (BTCUSDT)</option>
                  <option value="ETH">Ethereum (ETHUSDT)</option>
                  <option value="SOL">Solana (SOLUSDT)</option>
                  <option value="EURUSD">Euro (EURUSD)</option>
                  <option value="GBPUSD">British Pound (GBPUSD)</option>
                </select>
              </div>

              {/* Direction Toggle */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomDirection("BUY")}
                    className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      customDirection === "BUY"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>BUY / LONG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomDirection("SELL")}
                    className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      customDirection === "SELL"
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>SELL / SHORT</span>
                  </button>
                </div>
              </div>

              {/* Entry Price */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Entry Price ($)
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLivePrice}
                    className="text-[10px] font-bold text-amber-500 hover:underline cursor-pointer"
                  >
                    Use Live
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={customEntry}
                  onChange={(e) => setCustomEntry(e.target.value)}
                  placeholder="e.g. 2685.50"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                  required
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customSL}
                  onChange={(e) => setCustomSL(e.target.value)}
                  placeholder="e.g. 2670.00"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-rose-500 font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-rose-500/30 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Take Profit */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Take Profit Target ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customTP}
                  onChange={(e) => setCustomTP(e.target.value)}
                  placeholder="e.g. 2715.00"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-emerald-500 font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold"
                  required
                />
              </div>

              {/* Risk Exposure % */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Planned Risk %
                </label>
                <select
                  value={customRiskPct}
                  onChange={(e) => setCustomRiskPct(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none font-bold"
                >
                  <option value="0.5">0.5% (Conservative)</option>
                  <option value="1.0">1.0% (Standard Institutional)</option>
                  <option value="1.5">1.5% (Moderate Aggression)</option>
                  <option value="2.0">2.0% (Maximum Allowed)</option>
                </select>
              </div>

              {/* Trader Notes */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Aap Ki Trade Ka Reason / Rationale (Notes)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. 1H FVG retest, London low swept, waiting for breaker block..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={submittingCustom}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>{submittingCustom ? "Auditing Trade Plan via Swarm..." : "Analyze & Verify My Signal (تجزیہ کریں)"}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: LOGON KA SIGNAL (PASTE TEXT FORM) */}
        {activeInputTab === "PASTE" && (
          <form onSubmit={handleParseAndAudit} className="space-y-4">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste any unformatted signal from Telegram, WhatsApp, Discord, or X (e.g. 🚀 VIP GOLD: BUY XAUUSD @ 2682.00 | SL: 2670.00 | TP1: 2695.00 | TP2: 2715.00)..."
              rows={3}
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 text-xs p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-mono"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3.5 py-1.5 rounded-xl">
                <Send className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  value={pasteSource}
                  onChange={(e) => setPasteSource(e.target.value)}
                  className="bg-transparent text-neutral-900 dark:text-white text-xs font-bold focus:outline-none border-0 p-0 cursor-pointer"
                >
                  <option value="TELEGRAM">Telegram VIP Channel</option>
                  <option value="DISCORD">Discord Server Drop</option>
                  <option value="WHATSAPP">WhatsApp Signal Forward</option>
                  <option value="TWITTER">X / Twitter VIP Post</option>
                  <option value="TRADINGVIEW">TradingView PineScript Alert</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={parsing || !rawText.trim()}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>{parsing ? "Parsing via Swarm..." : "Parse & Audit Signal (ویریفائی کریں)"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. SIGNAL AUDIT HISTORY & LIVE OUTCOME STREAM */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight">
              Signal History &amp; Real-Time Track Record
            </h2>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All Signals" },
              { id: "CUSTOM", label: "Apne Signals" },
              { id: "PASTED", label: "Pasted Signals" },
              { id: "VERIFIED", label: "Verified Alpha" },
              { id: "TRAP", label: "Retail Traps" },
              { id: "WON", label: "✓ TP Hits" },
              { id: "LOST", label: "✗ SL Hits" },
              { id: "TRAP_AVOIDED", label: "🛡️ Traps Avoided" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filter === item.id
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Signals List */}
        <div className="space-y-4">
          {filteredSignals.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 font-mono text-xs text-neutral-500">
              No signals found for this filter. Submit a custom trade plan or paste a signal above to start tracking.
            </div>
          ) : (
            filteredSignals.map((sig) => {
              const isCustom = sig.is_user_custom === 1;
              const isVerified = sig.trap_status === "VERIFIED_ALPHA";
              const isTrap = sig.trap_status === "RETAIL_TRAP_SUSPECTED";
              const isExpanded = expandedSignalId === sig.id;
              const isTP = sig.outcome_status === "SUCCESS_TP";
              const isSL = sig.outcome_status === "FAILED_SL";
              const isTrapAvoided = sig.outcome_status === "TRAP_AVOIDED_SL";

              return (
                <article
                  key={sig.id}
                  className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md space-y-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  {/* Top Bar: Badges & Source */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Asset */}
                      <span className="font-mono font-black text-base text-neutral-900 dark:text-white">
                        {sig.asset}
                      </span>

                      {/* Direction */}
                      <span
                        className={`font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          sig.direction === "BUY"
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                        }`}
                      >
                        {sig.direction}
                      </span>

                      {/* Source Tag */}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isCustom
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}>
                        {isCustom ? "★ APNA SIGNAL" : sig.channel_name || sig.source}
                      </span>

                      <span className="text-[10px] font-mono text-neutral-400">
                        {sig.created_at}
                      </span>
                    </div>

                    {/* Outcome Status Badge */}
                    <div className="flex items-center gap-2">
                      {isTP ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✓ TP HIT ({sig.realized_rr ? `+${sig.realized_rr}R` : "WIN"})</span>
                        </span>
                      ) : isTrapAvoided ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>🛡️ TRAP AVOIDED (SL HIT)</span>
                        </span>
                      ) : isSL ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30 shadow-sm">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>✗ SL HIT (-1.0R)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-700">
                          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                          <span>TRACKING LIVE</span>
                        </span>
                      )}

                      {/* Verdict Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                          isVerified
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : isTrap
                            ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                        }`}
                      >
                        {isVerified ? "VERIFIED ALPHA" : isTrap ? "RETAIL TRAP" : "VOLATILE"}
                      </span>
                    </div>
                  </div>

                  {/* Chief Risk Officer Roman Urdu Verdict Banner */}
                  {sig.cro_verdict_urdu && (
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                      isVerified
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : isTrap
                        ? "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300"
                    }`}>
                      {isVerified ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                          Chief Risk Officer Ka Faisla:
                        </span>
                        {sig.cro_verdict_urdu}
                      </div>
                    </div>
                  )}

                  {/* Quantitative Levels Strip */}
                  <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 block font-sans font-bold">Entry</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        ${sig.entry_min || sig.entry_max || "Market"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 block font-sans font-bold">Stop Loss</span>
                      <span className="font-bold text-rose-500">
                        ${sig.stop_loss || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 block font-sans font-bold">Take Profit</span>
                      <span className="font-bold text-emerald-500">
                        ${sig.take_profit_targets?.[0] || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 block font-sans font-bold">Risk:Reward</span>
                      <span className="font-bold text-amber-500">
                        {sig.risk_reward || "1:2.0"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 block font-sans font-bold">Swarm Conf.</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {sig.swarm_confidence || 85}%
                      </span>
                    </div>
                  </div>

                  {/* Outcome Resolution Banner (If resolved) */}
                  {sig.resolution_notes && (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/40 text-xs font-mono flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {sig.resolution_notes}
                      </span>
                      {sig.resolved_price && (
                        <span className="text-[11px] text-neutral-400">
                          Price: ${Number(sig.resolved_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 text-xs border-t border-neutral-200 dark:border-neutral-800">
                      {/* Raw Text or Notes */}
                      <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                        <span className="font-bold block uppercase text-[10px] text-neutral-400 mb-1">
                          {isCustom ? "Custom Trader Notes:" : "Raw Intercepted Signal Message:"}
                        </span>
                        {sig.raw_text}
                      </div>

                      {/* Trap Reasons List */}
                      {sig.trap_reasons && sig.trap_reasons.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[10px] text-neutral-400 block">
                            Audit Telemetry Points:
                          </span>
                          {sig.trap_reasons.map((r, i) => (
                            <div key={i} className="text-[11px] text-neutral-600 dark:text-neutral-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                      className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? "Hide Telemetry" : "Show Full Audit Details"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onDeploySignal(sig)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Deploy to Trade Desk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
};

export default SignalsScreen;
