import React from "react";
import { Sparkles, Zap, ShieldCheck, Target, ArrowRight } from "lucide-react";

export interface RomanUrduData {
  asset: string;
  overall_view: string;
  confidence_score: number;
  risk_level: string;
  technical_summary: string;
  macro_summary: string;
  action: string; // "BUY setup", "SELL setup", "WAIT / NO TRADE"
  entry_level?: string;
  stop_loss?: string;
  take_profit?: string;
  risk_reward?: string;
  simple_baat: string;
}

interface RomanUrduCardProps {
  data: RomanUrduData;
}

export const RomanUrduCard: React.FC<RomanUrduCardProps> = ({ data }) => {
  const isBuy = data.action?.toLowerCase().includes("buy");
  const isSell = data.action?.toLowerCase().includes("sell");

  return (
    <div className="bg-[#14161A] border-2 border-[#F59E0B]/50 rounded-2xl p-6 shadow-glow-amber relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4 mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                EXECUTIVE ROMAN URDU REPORT
              </h3>
              <span className="text-[10px] font-mono uppercase bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-bold">
                {data.asset}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Institutional Decision Support Summary</p>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Confidence</span>
            <span className="text-xl font-black text-[#22D3EE] font-mono">
              {data.confidence_score}%
            </span>
          </div>
          <div
            className={`px-4 py-2 rounded-xl text-sm font-black font-mono tracking-wider border shadow-md ${
              isBuy
                ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
                : isSell
                ? "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40"
                : "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40"
            }`}
          >
            {data.action}
          </div>
        </div>
      </div>

      {/* Execution Targets Strip */}
      <div className="grid grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0A0B0D] border border-[rgba(255,255,255,0.06)] font-mono text-center mb-5">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Overall View</span>
          <span className="text-xs font-bold text-white">{data.overall_view}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Entry Zone</span>
          <span className="text-xs font-bold text-slate-200">{data.entry_level || "Market"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Stop Loss (SL)</span>
          <span className="text-xs font-bold text-[#EF4444]">{data.stop_loss || "Strict ATR"}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Take Profit (TP)</span>
          <span className="text-xs font-bold text-[#10B981]">{data.take_profit || "Dynamic Target"}</span>
        </div>
      </div>

      {/* Detailed Analysis in Roman Urdu */}
      <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed">
        {/* Technical Urdu */}
        <div>
          <span className="text-[11px] font-bold text-[#22D3EE] uppercase tracking-wider block mb-1">
            Technical Insight:
          </span>
          <div className="bg-[#1B1E24]/70 border border-[rgba(255,255,255,0.06)] p-3 rounded-xl text-slate-300">
            {data.technical_summary}
          </div>
        </div>

        {/* Macro Urdu */}
        <div>
          <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider block mb-1">
            Macro Context:
          </span>
          <div className="bg-[#1B1E24]/70 border border-[rgba(255,255,255,0.06)] p-3 rounded-xl text-slate-300">
            {data.macro_summary}
          </div>
        </div>

        {/* "Simple baat" Highlight Box */}
        <div className="bg-gradient-to-r from-[#F59E0B]/15 via-[#F59E0B]/5 to-transparent border border-[#F59E0B]/40 p-4 rounded-xl mt-4">
          <div className="flex items-center space-x-2 text-[#F59E0B] font-bold text-xs mb-1.5">
            <Zap className="w-4 h-4 stroke-[2.5]" />
            <span className="uppercase tracking-wide">Simple baat (Bottom Line Summary):</span>
          </div>
          <p className="text-xs text-slate-100 font-medium leading-relaxed">
            {data.simple_baat}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RomanUrduCard;
