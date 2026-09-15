import React, { useState, useEffect } from "react";

interface CotData {
  success: boolean;
  symbol: string;
  market: string;
  report_date: string;
  open_interest: number;
  commercial: {
    long: number;
    short: number;
    net: number;
    weekly_change: number;
    share_pct: number;
  };
  non_commercial: {
    long: number;
    short: number;
    net: number;
    weekly_change: number;
    share_pct: number;
  };
  cot_index_pct: number;
  institutional_bias: string;
  smart_money_verdict: string;
  warning: string;
}

interface InstitutionalCotCardProps {
  isDark: boolean;
  defaultSymbol?: string;
}

export const InstitutionalCotCard: React.FC<InstitutionalCotCardProps> = ({
  isDark,
  defaultSymbol = "GOLD",
}) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [data, setData] = useState<CotData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/institutional/cot?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        if (d && d.success) {
          setData(d);
        }
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  const getBiasBadge = (bias: string) => {
    switch (bias) {
      case "STRONGLY_BULLISH":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "MODERATELY_BULLISH":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "NEUTRAL_BALANCED":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "BEARISH":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/30";
    }
  };

  return (
    <div className={`p-5 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              CFTC Commitment of Traders (COT)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
              Official Futures Tape
            </span>
          </div>
          <h2 className="text-sm font-black tracking-tight">Institutional Big-Money Positioning</h2>
        </div>

        {/* Asset Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {["GOLD", "EURUSD", "GBPUSD", "BTC"].map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                symbol === s
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Metadata Bar */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-4 font-mono">
            <span>Market: {data.market}</span>
            <span>CFTC Release: {data.report_date}</span>
            <span>Open Interest: {data.open_interest.toLocaleString()} contracts</span>
          </div>

          {/* Bias Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Institutional Sentiment Bias
              </span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 block">
                52-Week COT Index: {data.cot_index_pct}% Percentile
              </span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${getBiasBadge(data.institutional_bias)}`}>
              {data.institutional_bias.replace("_", " ")}
            </span>
          </div>

          {/* Positioning Split: Commercials vs Hedge Funds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Commercials (Smart Money / Hedgers) */}
            <div className={`p-3.5 rounded-lg border ${isDark ? "bg-neutral-800/30 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Commercials (Smart Money / Banks)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono font-bold">
                  {data.commercial.share_pct}% of OI
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Net Position:</span>
                  <span className={`font-bold ${data.commercial.net >= 0 ? "text-emerald-500" : "text-neutral-300"}`}>
                    {data.commercial.net >= 0 ? "+" : ""}{data.commercial.net.toLocaleString()} contracts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Weekly Delta:</span>
                  <span className={`font-bold ${data.commercial.weekly_change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data.commercial.weekly_change >= 0 ? "+" : ""}{data.commercial.weekly_change.toLocaleString()} contracts
                  </span>
                </div>
              </div>
            </div>

            {/* Non-Commercials (Hedge Funds / Speculators) */}
            <div className={`p-3.5 rounded-lg border ${isDark ? "bg-neutral-800/30 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Non-Commercial (Hedge Funds / CTAs)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono font-bold">
                  {data.non_commercial.share_pct}% of OI
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Net Position:</span>
                  <span className={`font-bold ${data.non_commercial.net >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data.non_commercial.net >= 0 ? "+" : ""}{data.non_commercial.net.toLocaleString()} contracts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Weekly Delta:</span>
                  <span className={`font-bold ${data.non_commercial.weekly_change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data.non_commercial.weekly_change >= 0 ? "+" : ""}{data.non_commercial.weekly_change.toLocaleString()} contracts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Money Verdict & Warning */}
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 dark:text-emerald-400 leading-relaxed">
              <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 text-emerald-600 dark:text-emerald-300">
                Institutional Floor Analysis
              </span>
              {data.smart_money_verdict}
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 dark:text-amber-400 leading-relaxed">
              <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 text-amber-600 dark:text-amber-300">
                Overcrowded Positioning Warning
              </span>
              {data.warning}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
