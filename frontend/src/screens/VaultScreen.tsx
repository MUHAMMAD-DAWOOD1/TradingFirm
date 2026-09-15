import React, { useState, useEffect } from "react";

interface DecisionRecord {
  id: string;
  asset: string;
  direction: string;
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward?: string;
  timestamp: string;
  outcome_status?: "PENDING" | "WIN" | "LOSS";
  outcome_pnl?: number;
  verified_at?: string;
}

interface VaultScreenProps {
  isDark: boolean;
  onViewReport?: (report: any) => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({ isDark, onViewReport }) => {
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const fetchHistory = () => {
    fetch("/api/history?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.history)) {
          setHistory(d.history);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleVerifyOutcome = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/history/verify/${id}`, { method: "POST" });
      const data = await res.json();
      if (data && data.status) {
        setVerifyMessage(`Audit Result for #${id.slice(0, 6)}: ${data.status} (${data.details || ""})`);
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
      setTimeout(() => setVerifyMessage(null), 5000);
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.asset?.toLowerCase().includes(q) ||
      item.direction?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="max-w-[1520px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header & Actions */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-main tracking-tight">
            Vault &amp; Audit Archive
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Immutable historical log of multi-agent institutional execution and heuristic verdicts
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href="/api/history-export"
            download
            className="flex items-center gap-2 bg-surface border border-border-subtle card-shadow text-main px-4 py-2 rounded-full text-[13px] font-semibold hover:border-border-strong active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Archive</span>
          </a>
        </div>
      </section>

      {/* Verification Feedback Banner */}
      {verifyMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[13px] font-bold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{verifyMessage}</span>
        </div>
      )}

      {/* Main Archival Card Module */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 lg:p-8 card-shadow flex flex-col gap-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex items-center bg-well border border-border-subtle rounded-full px-4 py-2 w-full sm:w-80">
            <span className="material-symbols-outlined text-muted text-[19px] mr-2">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by asset, direction, or ID..."
              className="bg-transparent border-0 p-0 text-main placeholder:text-muted text-[13px] focus:outline-none w-full"
            />
          </div>

          <div className="text-[12px] text-muted font-mono">
            {filteredHistory.length} Historical Decision Records
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-muted text-[13px]">
              <span className="material-symbols-outlined text-[36px] text-muted mb-2 block">
                folder_open
              </span>
              No archived decisions match your query.
            </div>
          ) : (
            <table className="w-full text-left text-[13px] font-mono">
              <thead>
                <tr className="text-muted border-b border-border-subtle font-sans text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-bold">Record ID / Time</th>
                  <th className="pb-3 font-bold">Asset</th>
                  <th className="pb-3 font-bold">Stance</th>
                  <th className="pb-3 font-bold">Conviction</th>
                  <th className="pb-3 font-bold">Entry Zone</th>
                  <th className="pb-3 font-bold">Stop Loss / TP</th>
                  <th className="pb-3 font-bold">Outcome Status</th>
                  <th className="pb-3 font-bold text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredHistory.map((rec) => {
                  const isBuy = (rec.direction || "").toUpperCase() === "BUY";
                  const status = rec.outcome_status || "PENDING";
                  const isWin = status === "WIN";
                  const isLoss = status === "LOSS";

                  return (
                    <tr key={rec.id} className="hover:bg-well/40 transition-colors">
                      <td className="py-4">
                        <span className="font-bold text-main block">
                          #{rec.id?.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-muted font-sans">
                          {rec.timestamp}
                        </span>
                      </td>

                      <td className="py-4 font-bold text-main">{rec.asset}</td>

                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isBuy
                              ? "bg-emerald-500/15 text-[#10B981] border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {rec.direction}
                        </span>
                      </td>

                      <td className="py-4 font-bold text-main">
                        {rec.confidence || 85}%
                      </td>

                      <td className="py-4 text-main font-semibold">
                        ${typeof rec.entry_price === "number" ? rec.entry_price.toFixed(2) : rec.entry_price}
                      </td>

                      <td className="py-4 text-muted text-[11px]">
                        <span className="text-rose-400">
                          ${typeof rec.stop_loss === "number" ? rec.stop_loss.toFixed(2) : rec.stop_loss}
                        </span>
                        {" / "}
                        <span className="text-[#10B981]">
                          ${typeof rec.take_profit === "number" ? rec.take_profit.toFixed(2) : rec.take_profit}
                        </span>
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isWin
                              ? "bg-emerald-500/15 text-[#10B981] border border-emerald-500/30"
                              : isLoss
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleVerifyOutcome(rec.id)}
                          disabled={verifyingId === rec.id}
                          className="px-3 py-1 rounded-full bg-well border border-border-subtle hover:border-border-strong text-[11px] font-bold text-main transition-all active:scale-95 cursor-pointer"
                        >
                          {verifyingId === rec.id ? "Auditing..." : "Verify Outcome"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
};
