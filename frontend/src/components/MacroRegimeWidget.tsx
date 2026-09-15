import React, { useState, useEffect } from "react";

interface MacroRegimeData {
  success: boolean;
  assets: string[];
  matrix: Array<{
    asset: string;
    values: Record<string, number>;
  }>;
  regime: {
    title: string;
    type: string;
    description: string;
    sentiment: string;
  };
  recent_returns_5d: Record<string, number>;
  gold_intermarket_thesis: string;
  notice?: string;
}

interface MacroRegimeWidgetProps {
  isDark: boolean;
}

export const MacroRegimeWidget: React.FC<MacroRegimeWidgetProps> = ({ isDark }) => {
  const [data, setData] = useState<MacroRegimeData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCorrelation = (refresh: boolean = false) => {
    setLoading(true);
    fetch(`/api/correlation/matrix${refresh ? "?refresh=true" : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setLoading(false);
        if (d && d.success) {
          setData(d);
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCorrelation();
  }, []);

  const getHeatmapColor = (val: number) => {
    if (val === 1.0) return isDark ? "bg-neutral-800 text-neutral-400 font-bold" : "bg-neutral-100 text-neutral-400 font-bold";
    if (val > 0.5) return "bg-emerald-500/20 text-emerald-400 font-bold";
    if (val > 0.1) return "bg-emerald-500/10 text-emerald-500";
    if (val < -0.5) return "bg-rose-500/20 text-rose-400 font-bold";
    if (val < -0.1) return "bg-rose-500/10 text-rose-500";
    return isDark ? "bg-neutral-900/40 text-neutral-400" : "bg-neutral-50 text-neutral-600";
  };

  const getRegimeBadge = (type: string) => {
    switch (type) {
      case "RISK_ON":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "RISK_OFF":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "DOLLAR_SQUEEZE":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "STAGFLATION":
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
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Intermarket Macro
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
              Pearson 60D
            </span>
          </div>
          <h2 className="text-sm font-black tracking-tight">Global Liquidity & Asset Correlation Matrix</h2>
        </div>

        <button
          onClick={() => fetchCorrelation(true)}
          disabled={loading}
          className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
          title="Refresh correlations"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Regime Classification Banner */}
      {data && data.regime && (
        <div className={`p-3 rounded-lg mb-4 border ${isDark ? "bg-neutral-800/40 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Current Macro Regime</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRegimeBadge(data.regime.type)}`}>
              {data.regime.title}
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
            {data.regime.description}
          </p>
        </div>
      )}

      {/* 5-Day Returns Row */}
      {data && data.recent_returns_5d && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(data.recent_returns_5d).map(([asset, ret]) => (
            <div
              key={asset}
              className={`p-2 rounded-lg border text-center ${
                isDark ? "bg-neutral-800/30 border-neutral-850" : "bg-neutral-50 border-neutral-200"
              }`}
            >
              <div className="text-[10px] font-bold text-neutral-400 uppercase">{asset}</div>
              <div className={`text-xs font-mono font-bold mt-0.5 ${ret >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {ret >= 0 ? "+" : ""}{ret}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correlation Matrix Table Heatmap */}
      {data && data.matrix && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 text-left font-sans text-[10px] font-bold uppercase text-neutral-400">Asset</th>
                {data.assets.map((a) => (
                  <th key={a} className="py-2 px-2 text-[10px] font-bold uppercase text-neutral-400">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row) => (
                <tr key={row.asset} className="border-b border-neutral-100 dark:border-neutral-800/40">
                  <td className="py-2 text-left font-sans font-bold text-[11px] text-neutral-700 dark:text-neutral-300">
                    {row.asset}
                  </td>
                  {data.assets.map((col) => {
                    const val = row.values[col] ?? 0;
                    return (
                      <td key={col} className="p-1">
                        <div className={`py-1.5 px-2 rounded ${getHeatmapColor(val)}`}>
                          {val >= 0 && val !== 1 ? "+" : ""}
                          {val.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Intermarket Thesis Callout */}
      {data && data.gold_intermarket_thesis && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 dark:text-blue-400 leading-relaxed">
          <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gold Intermarket Thesis
          </div>
          {data.gold_intermarket_thesis}
        </div>
      )}
    </div>
  );
};
