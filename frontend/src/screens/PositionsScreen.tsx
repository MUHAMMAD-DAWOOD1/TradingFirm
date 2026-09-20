import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Settings2,
  Sparkles,
  Info,
  DollarSign
} from "lucide-react";

interface Position {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  entry_price: number;
  current_price: number;
  close_price?: number;
  unrealized_pnl: number;
  realized_pnl?: number;
  stop_loss?: number;
  take_profit?: number;
  opened_at: string;
  closed_at?: string;
  status?: string;
  close_reason?: string;
  leverage?: number;
  margin_usd?: number;
}

interface AccountState {
  initial_capital: number;
  equity: number;
  margin_used: number;
  available_margin: number;
  realized_pnl: number;
  win_count: number;
  loss_count: number;
  total_trades: number;
  win_rate_pct: number;
}

interface ExecutionState {
  account: AccountState;
  open_positions: Position[];
  closed_positions: Position[];
}

interface PositionsScreenProps {
  onNewOrder: () => void;
  isDark: boolean;
  activeAccount?: any;
  onOpenAccountManager?: () => void;
}

export const PositionsScreen: React.FC<PositionsScreenProps> = ({
  onNewOrder,
  isDark,
  activeAccount,
  onOpenAccountManager,
}) => {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [tab, setTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [closingId, setClosingId] = useState<string | null>(null);
  const [isAdjustCapitalOpen, setIsAdjustCapitalOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState("100");
  const [hardResetOption, setHardResetOption] = useState(true);
  const [updatingCapital, setUpdatingCapital] = useState(false);

  const fetchState = () => {
    const url = activeAccount?.id ? `/api/execution/state?account_id=${activeAccount.id}` : "/api/execution/state";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.account) {
          setState(d);
          setCapitalInput(String(d.account.initial_capital || 100));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2500); // 2.5s fast polling for live mark-to-market
    return () => clearInterval(interval);
  }, [activeAccount?.id]);

  const handleClosePosition = async (posId: string) => {
    setClosingId(posId);
    try {
      await fetch(`/api/execution/close/${posId}`, { method: "POST" });
      fetchState();
    } catch (err) {
      console.error(err);
    } finally {
      setClosingId(null);
    }
  };

  const handleAdjustCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(capitalInput);
    if (isNaN(cap) || cap <= 0) return;
    setUpdatingCapital(true);

    try {
      const res = await fetch("/api/execution/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capital: cap,
          hard_reset: hardResetOption
        }),
      });
      if (res.ok) {
        setIsAdjustCapitalOpen(false);
        fetchState();
      }
    } catch (err) {
      console.error("Capital update error:", err);
    } finally {
      setUpdatingCapital(false);
    }
  };

  // Safe numerical fallbacks directly from SQLite persistent account
  const initialCap = state?.account?.initial_capital ?? 100.0;
  const equity = state?.account?.equity ?? initialCap;
  const freeMargin = state?.account?.available_margin ?? initialCap;
  const usedMargin = state?.account?.margin_used ?? 0.0;
  const realizedPnl = state?.account?.realized_pnl ?? 0.0;
  const winRate = state?.account?.win_rate_pct ?? 0.0;
  const winCount = state?.account?.win_count ?? 0;
  const lossCount = state?.account?.loss_count ?? 0;
  const openPositions = state?.open_positions || [];
  const closedPositions = state?.closed_positions || [];
  const totalTrades = openPositions.length + closedPositions.length;

  // Calculate total unrealized PnL from open positions
  const totalUnrealized = openPositions.reduce((acc, p) => acc + (p.unrealized_pnl || 0), 0);
  const netGrowthPct = initialCap > 0 ? (((equity - initialCap) / initialCap) * 100).toFixed(2) : "0.00";
  const isNetPositive = parseFloat(netGrowthPct) >= 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Live Portfolio &amp; Risk Terminal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              2s Mark-to-Market Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Portfolio &amp; Positions (اکاؤنٹ بیلنس اور پوزیشنز)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Aap ka set kiya hua Custom Capital, Live Equity, Open Trades aur Win Rate ka mukammal institutional record.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Adjust Capital Trigger Button */}
          <button
            onClick={() => {
              if (onOpenAccountManager) {
                onOpenAccountManager();
              } else {
                setIsAdjustCapitalOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Manage Demo Accounts ({activeAccount?.name || `$${initialCap.toFixed(0)}`})</span>
          </button>

          <button
            onClick={onNewOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR PRIMARY METRIC CARDS (Custom Capital, Equity, Win Rate, Execution Flow) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Custom Initial Capital */}
        <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              Custom Capital
            </span>
            <button
              onClick={() => setIsAdjustCapitalOpen(true)}
              className="text-[10px] font-mono font-bold text-amber-500 hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
              ${initialCap.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono flex items-center justify-between">
              <span>Deposit Baseline</span>
              <span className="text-neutral-400">Fixed Anchor</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Equity & Net Growth */}
        <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Current Live Equity
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isNetPositive
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-500 border-rose-500/30"
            }`}>
              {isNetPositive ? "+" : ""}{netGrowthPct}%
            </span>
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono flex items-center justify-between">
              <span>Free: ${freeMargin.toFixed(0)}</span>
              <span className="text-neutral-400">Margin Used: ${usedMargin.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Win Rate & Closed Trades Record */}
        <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Demo Trades Win Rate
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {winCount}W - {lossCount}L
            </span>
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono flex items-center justify-between">
              <span>{closedPositions.length} Closed Trades</span>
              <span className="text-neutral-400">Real PnL: ${realizedPnl.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Execution Flow (Engine Telemetry) */}
        <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Execution Flow
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
              {totalTrades}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono flex items-center justify-between">
              <span>{openPositions.length} Active • {closedPositions.length} Closed</span>
              <span className="text-emerald-500 font-bold">2s Auto-Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ROMAN URDU PORTFOLIO HEALTH & RISK ADVISORY */}
      <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Portfolio Telemetry &amp; Capital Protection Rule
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-400">
                Active Capital: ${initialCap.toFixed(0)}
              </span>
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Aap ki trades aap ke <strong>Custom Capital (${initialCap.toFixed(0)})</strong> ke hisab se dynamically position size hoti hain.
              Har trade par 1.0% - 1.5% se zyada risk hargiz na lein taake 5 musalsal loss mein bhi account equity safe rahe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-neutral-400">
            Unrealized PnL:
          </span>
          <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
            totalUnrealized >= 0
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          }`}>
            {totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* 4. POSITIONS TABLE (OPEN VS CLOSED TABS) */}
      <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md space-y-4">
        {/* Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-2xl">
            <button
              onClick={() => setTab("OPEN")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === "OPEN"
                  ? "bg-white text-black dark:bg-white dark:text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span>Open Positions</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-black/20">
                {openPositions.length}
              </span>
            </button>

            <button
              onClick={() => setTab("CLOSED")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === "CLOSED"
                  ? "bg-white text-black dark:bg-white dark:text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span>Closed History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-black/20">
                {closedPositions.length}
              </span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-neutral-400">
            {tab === "OPEN" ? "Live Real-Time PnL Tracking" : "Audited Historical Settlements"}
          </span>
        </div>

        {/* TAB 1: OPEN POSITIONS TABLE */}
        {tab === "OPEN" && (
          <div className="overflow-x-auto">
            {openPositions.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <p>No active open positions on your custom account.</p>
                <button
                  onClick={onNewOrder}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  Place a Trade on Trade Screen
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Size / Lots</th>
                    <th className="pb-3">Entry</th>
                    <th className="pb-3">Live Mark</th>
                    <th className="pb-3">SL / TP Targets</th>
                    <th className="pb-3">Unrealized PnL</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-mono">
                  {openPositions.map((pos) => {
                    const isProfit = (pos.unrealized_pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-neutral-900 dark:text-white">
                          {pos.symbol}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === "BUY"
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          }`}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-3.5 text-neutral-700 dark:text-neutral-300">
                          {pos.quantity} Lots
                        </td>
                        <td className="py-3.5 text-neutral-700 dark:text-neutral-300">
                          ${pos.entry_price.toFixed(2)}
                        </td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">
                          ${(pos.current_price || pos.entry_price).toFixed(2)}
                        </td>
                        <td className="py-3.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="text-rose-400">{pos.stop_loss ? `$${pos.stop_loss.toFixed(2)}` : "—"}</span>
                          {" / "}
                          <span className="text-emerald-400">{pos.take_profit ? `$${pos.take_profit.toFixed(2)}` : "—"}</span>
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className={`px-2 py-0.5 rounded border ${
                            isProfit
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {isProfit ? "+" : ""}${(pos.unrealized_pnl || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            disabled={closingId === pos.id}
                            className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-rose-500/20 hover:text-rose-500 dark:bg-neutral-800 text-neutral-400 dark:hover:text-rose-400 transition-all font-bold text-[11px] cursor-pointer"
                          >
                            {closingId === pos.id ? "Closing..." : "Close Market"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: CLOSED HISTORY TABLE */}
        {tab === "CLOSED" && (
          <div className="overflow-x-auto">
            {closedPositions.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                No closed trades logged yet. As soon as a trade hits TP or SL, its audited record will appear here.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Entry &rarr; Exit</th>
                    <th className="pb-3">Resolution Reason</th>
                    <th className="pb-3">Realized PnL ($)</th>
                    <th className="pb-3 text-right pr-2">Settlement Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-mono">
                  {closedPositions.map((pos) => {
                    const pnl = pos.realized_pnl || 0;
                    const isWin = pnl >= 0;
                    const isTP = pos.close_reason === "CLOSED_TP";
                    const isSL = pos.close_reason === "CLOSED_SL";

                    return (
                      <tr key={pos.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-neutral-900 dark:text-white">
                          {pos.symbol}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === "BUY"
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                          }`}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-3.5 text-neutral-700 dark:text-neutral-300">
                          ${pos.entry_price.toFixed(2)} &rarr; ${Number(pos.close_price || pos.current_price).toFixed(2)}
                        </td>
                        <td className="py-3.5">
                          {isTP ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              ✓ Take Profit Hit
                            </span>
                          ) : isSL ? (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              ✗ Stop Loss Hit
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">
                              Manual Exit
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className={`px-2 py-0.5 rounded border ${
                            isWin
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {isWin ? "+" : ""}${pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2 text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {pos.closed_at || pos.opened_at}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 5. ADJUST CAPITAL MODAL (POPUP) */}
      {isAdjustCapitalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  Set Custom Capital (کیپیٹل سیٹ کریں)
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustCapitalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustCapital} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Select Quick Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["50", "100", "250", "500", "1000", "5000"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapitalInput(preset)}
                      className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        capitalInput === preset
                          ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-white"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Or Enter Custom Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-neutral-400 font-mono text-sm font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-mono font-bold text-neutral-900 dark:text-white text-sm border border-neutral-200 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50 flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Reset previous trade history?</span>
                <input
                  type="checkbox"
                  checked={hardResetOption}
                  onChange={(e) => setHardResetOption(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustCapitalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCapital}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {updatingCapital ? "Updating..." : "Save Capital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default PositionsScreen;
