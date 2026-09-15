import React, { useState, useEffect } from "react";

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
}

export const PositionsScreen: React.FC<PositionsScreenProps> = ({
  onNewOrder,
  isDark,
}) => {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [tab, setTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [closingId, setClosingId] = useState<string | null>(null);

  const fetchState = () => {
    fetch("/api/execution/state")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.account) {
          setState(d);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const equity = state?.account?.equity ?? 100000.00;
  const freeMargin = state?.account?.available_margin ?? 100000.00;
  const usedMargin = state?.account?.margin_used ?? 0.00;
  const winRate = state?.account?.win_rate_pct ?? 0.0;
  const winCount = state?.account?.win_count ?? 0;
  const lossCount = state?.account?.loss_count ?? 0;
  const totalTrades = state?.account?.total_trades ?? (winCount + lossCount);
  const openPositions = state?.open_positions || [];
  const closedPositions = state?.closed_positions || [];

  return (
    <main className="max-w-[1520px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-main tracking-tight">
            Portfolio &amp; Positions
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Real-time institutional exposure and trade lifecycle execution
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href="/api/history-export"
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface border border-border-subtle card-shadow text-[13px] font-semibold text-main hover:border-border-strong active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Audit</span>
          </a>

          <button
            onClick={onNewOrder}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold active:scale-[0.98] transition-all ${
              isDark
                ? "bg-white text-black hover:bg-neutral-200 shadow-sm"
                : "bg-black text-white hover:bg-neutral-800 shadow-sm"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 4 Sleek Stat Chips Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Equity */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Total Equity</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
              +2.4%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-extrabold text-main tabular-nums">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-[11px] text-muted">USD</span>
          </div>
        </div>

        {/* Stat 2: Free Margin */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Free Margin</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-well text-muted border border-border-subtle">
              {((freeMargin / equity) * 100).toFixed(0)}% avail
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-extrabold text-main tabular-nums">
              ${freeMargin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-[11px] text-muted">
              Used ${usedMargin.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Stat 3: Win Rate */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Win Rate</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
              {winCount}W - {lossCount}L
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-extrabold text-main tabular-nums">
              {winRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted">Institutional Target</span>
          </div>
        </div>

        {/* Stat 4: Execution Flow */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Execution Flow</span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-extrabold text-main tabular-nums">
              {totalTrades}
            </span>
            <span className="text-[11px] text-muted">Positions Logged</span>
          </div>
        </div>
      </section>

      {/* In-Place Open / Closed Toggle & Table Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 card-shadow flex flex-col gap-5">
        {/* Toggle bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-well border border-border-subtle p-1 rounded-full">
            <button
              onClick={() => setTab("OPEN")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                tab === "OPEN"
                  ? isDark
                    ? "bg-white text-black shadow-sm"
                    : "bg-black text-white shadow-sm"
                  : "text-muted hover:text-main"
              }`}
            >
              Open Positions ({openPositions.length})
            </button>
            <button
              onClick={() => setTab("CLOSED")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                tab === "CLOSED"
                  ? isDark
                    ? "bg-white text-black shadow-sm"
                    : "bg-black text-white shadow-sm"
                  : "text-muted hover:text-main"
              }`}
            >
              Closed History ({closedPositions.length})
            </button>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto">
          {tab === "OPEN" ? (
            openPositions.length === 0 ? (
              <div className="p-12 text-center text-muted text-[13px]">
                <span className="material-symbols-outlined text-[32px] mb-2 block text-muted">
                  layers_clear
                </span>
                No active open positions. Place an order on the Trade screen or deploy a signal!
              </div>
            ) : (
              <table className="w-full text-left text-[13px] font-mono">
                <thead>
                  <tr className="text-muted border-b border-border-subtle font-sans text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-bold">Asset</th>
                    <th className="pb-3 font-bold">Side</th>
                    <th className="pb-3 font-bold">Size</th>
                    <th className="pb-3 font-bold">Entry</th>
                    <th className="pb-3 font-bold">Mark</th>
                    <th className="pb-3 font-bold">SL / TP</th>
                    <th className="pb-3 font-bold">Unrealized PnL</th>
                    <th className="pb-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {openPositions.map((pos) => {
                    const isProfit = (pos.unrealized_pnl || 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-well/40 transition-colors">
                        <td className="py-4 font-bold text-main">{pos.symbol}</td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pos.side === "BUY"
                                ? "bg-emerald-500/15 text-[#10B981] border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-4 text-main">{pos.quantity} Lots</td>
                        <td className="py-4 text-main">${pos.entry_price.toFixed(2)}</td>
                        <td className="py-4 text-main">${(pos.current_price || pos.entry_price).toFixed(2)}</td>
                        <td className="py-4 text-muted text-[11px]">
                          {pos.stop_loss ? `$${pos.stop_loss}` : "—"} / {pos.take_profit ? `$${pos.take_profit}` : "—"}
                        </td>
                        <td className="py-4">
                          <span
                            className={`font-bold ${
                              isProfit ? "text-[#10B981]" : "text-rose-400"
                            }`}
                          >
                            {isProfit ? "+" : ""}${(pos.unrealized_pnl || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            disabled={closingId === pos.id}
                            className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all text-[11px] font-bold active:scale-95 cursor-pointer"
                          >
                            {closingId === pos.id ? "Closing..." : "Close Position"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            closedPositions.length === 0 ? (
              <div className="p-12 text-center text-muted text-[13px]">
                No closed trades yet.
              </div>
            ) : (
              <table className="w-full text-left text-[13px] font-mono">
                <thead>
                  <tr className="text-muted border-b border-border-subtle font-sans text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-bold">Asset</th>
                    <th className="pb-3 font-bold">Side</th>
                    <th className="pb-3 font-bold">Size</th>
                    <th className="pb-3 font-bold">Entry</th>
                    <th className="pb-3 font-bold">Exit</th>
                    <th className="pb-3 font-bold">Realized PnL</th>
                    <th className="pb-3 font-bold text-right">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border-subtle">
                  {closedPositions.map((pos) => {
                    const isProfit = (pos.realized_pnl ?? pos.unrealized_pnl ?? 0) >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-well/40 transition-colors">
                        <td className="py-4 font-bold text-main">{pos.symbol}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pos.side === "BUY"
                                ? "bg-emerald-500/15 text-[#10B981]"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-4 text-main">{pos.quantity} Lots</td>
                        <td className="py-4 text-main">${pos.entry_price.toFixed(2)}</td>
                        <td className="py-4 text-main">${(pos.close_price || pos.current_price || pos.entry_price).toFixed(2)}</td>
                        <td className="py-4">
                          <span
                            className={`font-bold ${
                              isProfit ? "text-[#10B981]" : "text-rose-400"
                            }`}
                          >
                            {isProfit ? "+" : ""}${(pos.realized_pnl ?? pos.unrealized_pnl ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 text-right text-muted text-[11px]">
                          {pos.status || pos.close_reason || "MANUAL_CLOSE"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </main>
  );
};
