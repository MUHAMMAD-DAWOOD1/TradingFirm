import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtext?: string;
  prefix?: string;
  suffix?: string;
  accentColor?: "cyan" | "emerald" | "rose" | "amber" | "violet";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  subtext,
  prefix = "",
  suffix = "",
  accentColor = "cyan",
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const glowBorder = {
    cyan: "hover:border-[#22D3EE]/40 hover:shadow-glow-cyan",
    emerald: "hover:border-[#10B981]/40 hover:shadow-glow-emerald",
    rose: "hover:border-[#EF4444]/40 hover:shadow-glow-rose",
    amber: "hover:border-[#F59E0B]/40 hover:shadow-glow-amber",
    violet: "hover:border-[#8B5CF6]/40 hover:shadow-glow-violet",
  }[accentColor];

  return (
    <div
      className={`bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 transition-all duration-300 shadow-glass-inner ${glowBorder}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {change !== undefined && (
          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${
              isPositive
                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                : isNegative
                ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isPositive && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
            {isNegative && <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
            {isNeutral && <Minus className="w-3 h-3" />}
            <span className="tabular-nums">
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1">
        {prefix && <span className="text-lg font-mono text-slate-400">{prefix}</span>}
        <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight tabular-nums font-mono">
          {value}
        </span>
        {suffix && <span className="text-sm font-mono text-slate-400 ml-1">{suffix}</span>}
      </div>

      {(subtext || changeLabel) && (
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{subtext}</span>
          {changeLabel && <span className="text-slate-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
