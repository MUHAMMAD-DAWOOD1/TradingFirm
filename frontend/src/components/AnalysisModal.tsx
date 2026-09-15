import React, { useState } from "react";
import { X, Sparkles, Sliders, Shield, Zap, DollarSign, Percent } from "lucide-react";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Array<{ symbol: string; name: string; category: string }>;
  onStartAnalysis: (ticker: string, timeframe: string, risk: string, capital: number, riskPct: number) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  assets,
  onStartAnalysis,
}) => {
  const [selectedTicker, setSelectedTicker] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("1H");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [userCapital, setUserCapital] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(2.0);

  if (!isOpen) return null;

  const capitalPresets = [1000, 5000, 10000, 25000, 50000, 100000];
  const riskPresets = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14161A] border border-[rgba(255,255,255,0.12)] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative shadow-glow-cyan max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22D3EE] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                CONFIGURE AI ANALYSIS & CAPITAL SIZING
              </h3>
              <p className="text-[11px] text-slate-400">Institutional Multi-Agent Swarm with Personalized Sizing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1B1E24] hover:bg-[#232730] flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Asset Selection */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Select Target Instrument
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#22D3EE]/50 font-mono"
            >
              <optgroup label="Precious Metals & Forex">
                <option value="XAUUSD">XAU/USD - Gold Spot (MT5 ECN Bridge)</option>
              </optgroup>
              <optgroup label="Top Cryptocurrencies">
                {assets
                  .filter((a) => a.category === "crypto")
                  .map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} - {a.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Account Capital Input */}
          <div className="bg-[#0A0B0D] border border-white/5 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-bold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Your Account Capital (USD)</span>
              </label>
              <span className="text-xs font-mono text-emerald-300 font-bold">
                ${userCapital.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-xs">$</span>
              <input
                type="number"
                min="100"
                step="500"
                value={userCapital}
                onChange={(e) => setUserCapital(Math.max(100, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#14161A] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            {/* Quick Capital Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {capitalPresets.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setUserCapital(cap)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                    userCapital === cap
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-[#14161A] border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  ${cap >= 1000 ? `${cap / 1000}k` : cap}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Per Trade */}
          <div className="bg-[#0A0B0D] border border-white/5 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
                <Percent className="w-3.5 h-3.5" />
                <span>Risk Per Trade (%)</span>
              </label>
              <span className="text-xs font-mono text-amber-300 font-bold">
                {riskPct}% (${((userCapital * riskPct) / 100).toFixed(2)} Max Loss)
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {riskPresets.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPct(pct)}
                  className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                    riskPct === pct
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-[#14161A] border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Tabs */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Primary Analysis Timeframe
            </label>
            <div className="grid grid-cols-6 gap-2">
              {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    timeframe === tf
                      ? "bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]"
                      : "bg-[#0A0B0D] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Profile Selection */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Risk Engine Governance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "conservative", label: "Conservative", desc: "Strict SL Buffer" },
                { id: "moderate", label: "Moderate (Std)", desc: "1.5x ATR Cushion" },
                { id: "aggressive", label: "Aggressive", desc: "Momentum Seeking" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRiskProfile(r.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    riskProfile === r.id
                      ? "bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-white"
                      : "bg-[#0A0B0D] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block">{r.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Max Risk: <span className="text-amber-400 font-bold">${((userCapital * riskPct) / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onStartAnalysis(selectedTicker, timeframe, riskProfile, userCapital, riskPct);
                onClose();
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#10B981] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-glow-cyan active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Launch Multi-Agent Swarm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
