import React, { useState, useEffect } from "react";

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
  trap_reasoning: string;
  confidence_score: number;
  raw_text: string;
  created_at?: string;
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
  const [filter, setFilter] = useState<"ALL" | "VERIFIED" | "TRAP" | "RISK">("ALL");
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("TELEGRAM");
  const [parsing, setParsing] = useState(false);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  const fetchSignals = () => {
    fetch("/api/signals/feed")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.signals)) {
          setSignals(d.signals);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

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
          source: source,
          channel_name: `${source} Quick-Paste`,
        }),
      });
      const newSig = await res.json();
      if (res.ok && newSig && newSig.id) {
        setRawText("");
        fetchSignals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const filteredSignals = signals.filter((s) => {
    if (filter === "VERIFIED") return s.trap_status === "VERIFIED_ALPHA";
    if (filter === "TRAP") return s.trap_status === "RETAIL_TRAP_SUSPECTED";
    if (filter === "RISK") return s.trap_status === "HIGH_RISK_VOLATILE" || s.trap_status === "MACRO_HAZARD";
    return true;
  });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header / Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-extrabold text-main tracking-tight">
            Signals &amp; Alpha Audit
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Multi-agent heuristic detection against retail liquidation traps
          </p>
        </div>

        <button
          onClick={onOpenManageChannels}
          type="button"
          className="inline-flex items-center gap-2 bg-surface text-main px-4 py-2 rounded-full text-[13px] font-semibold border border-border-subtle card-shadow hover:border-border-strong active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px] text-muted">
            tune
          </span>
          <span>Manage Channels</span>
          <span className="material-symbols-outlined text-[16px] text-muted">
            expand_more
          </span>
        </button>
      </div>

      {/* Top Parser Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-6 card-shadow mb-8">
        <form onSubmit={handleParseAndAudit}>
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste any unformatted signal from Telegram, WhatsApp, Discord, or X (e.g. 🚀 BUY XAUUSD 2680 SL 2672 TP 2710)..."
              rows={2}
              className="w-full bg-well text-main placeholder:text-muted text-[14px] p-4 rounded-2xl border-0 focus:ring-2 focus:ring-amber-500/30 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-1">
            {/* Source Selector */}
            <div className="inline-flex items-center gap-2 bg-well border border-border-subtle px-3.5 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[16px] text-muted">
                send
              </span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="bg-transparent text-main text-[13px] font-semibold focus:outline-none border-0 p-0 cursor-pointer"
              >
                <option value="TELEGRAM" className="bg-surface">Telegram Channel</option>
                <option value="DISCORD" className="bg-surface">Discord Server</option>
                <option value="WHATSAPP" className="bg-surface">WhatsApp Forward</option>
                <option value="X" className="bg-surface">X / Twitter VIP</option>
                <option value="TRADINGVIEW" className="bg-surface">TradingView Alert</option>
              </select>
            </div>

            {/* Parse CTA Button */}
            <button
              type="submit"
              disabled={parsing || !rawText.trim()}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-extrabold transition-all active:scale-[0.98] ${
                parsing || !rawText.trim()
                  ? "bg-well text-muted cursor-not-allowed"
                  : isDark
                  ? "bg-white hover:bg-neutral-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  : "bg-black hover:bg-neutral-800 text-white shadow-md"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                neurology
              </span>
              <span>{parsing ? "Parsing via Swarm..." : "Parse & Audit"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-bold text-main tracking-tight">
            Recent Signal Audits (Live Stream)
          </h2>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "VERIFIED", label: "Verified Alpha" },
            { id: "TRAP", label: "Retail Traps" },
            { id: "RISK", label: "High Risk" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                filter === item.id
                  ? isDark
                    ? "bg-white text-black font-bold shadow-sm"
                    : "bg-black text-white font-bold shadow-sm"
                  : "bg-well border border-border-subtle text-muted hover:text-main"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Cards */}
      <div className="space-y-4">
        {filteredSignals.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-3xl p-8 text-center card-shadow">
            <span className="material-symbols-outlined text-[36px] text-muted mb-2 block">
              radar
            </span>
            <h3 className="text-[16px] font-bold text-main">
              No signals found for this filter
            </h3>
            <p className="text-[13px] text-muted mt-1">
              Paste a signal above or connect automated webhooks to begin live ingestion.
            </p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isVerified = sig.trap_status === "VERIFIED_ALPHA";
            const isTrap = sig.trap_status === "RETAIL_TRAP_SUSPECTED";
            const isExpanded = expandedSignalId === sig.id;

            return (
              <article
                key={sig.id}
                className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-6 card-shadow transition-all duration-200 hover:border-border-strong"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-extrabold text-[16px] text-main">
                      {sig.asset}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        sig.direction === "BUY"
                          ? "bg-emerald-500/15 text-[#10B981] border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {sig.direction}
                    </span>
                    <span className="text-muted text-[12px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        {sig.source === "TELEGRAM" ? "send" : sig.source === "DISCORD" ? "forum" : "chat"}
                      </span>
                      {sig.channel_name || sig.source}
                    </span>
                  </div>

                  {/* Verdict Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        isVerified
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-[#10B981]"
                          : isTrap
                          ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                          : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVerified ? "bg-[#10B981]" : isTrap ? "bg-rose-500" : "bg-amber-400"
                        }`}
                      />
                      {isVerified
                        ? "VERIFIED ALPHA"
                        : isTrap
                        ? "RETAIL TRAP"
                        : "MACRO HAZARD"}
                    </span>
                  </div>
                </div>

                {/* Audit Reasoning */}
                <p className="text-[13px] text-main font-medium leading-relaxed mb-4">
                  {sig.trap_reasoning}
                </p>

                {/* Quantitative Levels Well */}
                <div className="bg-well border border-border-subtle rounded-2xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] font-mono">
                  <div>
                    <span className="text-[11px] text-muted block font-sans">Entry</span>
                    <span className="font-bold text-main">
                      ${sig.entry_min || sig.entry_max || "Market"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted block font-sans">Stop Loss</span>
                    <span className="font-bold text-rose-400">
                      ${sig.stop_loss || "Calculated"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted block font-sans">Target 1</span>
                    <span className="font-bold text-[#10B981]">
                      ${sig.take_profit_targets?.[0] || "Target"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted block font-sans">Confidence</span>
                    <span className="font-bold text-main">
                      {sig.confidence_score || 85}%
                    </span>
                  </div>
                </div>

                {/* In-Place "Why?" Collapsible Accordion */}
                {isExpanded && (
                  <div className="p-4 mb-4 rounded-2xl bg-well-subtle border border-border-subtle space-y-2 animate-fade-in text-[12px]">
                    <span className="font-bold text-main block uppercase tracking-wider text-[11px]">
                      Raw Intercepted Signal Message:
                    </span>
                    <pre className="p-3 rounded-xl bg-surface font-mono text-[11px] text-muted whitespace-pre-wrap overflow-x-auto">
                      {sig.raw_text}
                    </pre>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                    className="text-[12px] font-semibold text-muted hover:text-main flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? "Hide Details" : "Why this verdict?"}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  <button
                    onClick={() => onDeploySignal(sig)}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                      isVerified
                        ? isDark
                          ? "bg-white text-black hover:bg-neutral-200"
                          : "bg-black text-white hover:bg-neutral-800"
                        : "bg-well text-muted hover:text-main border border-border-subtle"
                    }`}
                  >
                    <span>Deploy Order</span>
                    <span className="material-symbols-outlined text-[15px]">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
};
