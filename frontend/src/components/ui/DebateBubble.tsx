import React from "react";
import { TrendingUp, TrendingDown, ShieldAlert, UserCheck, Clock } from "lucide-react";

export type DebateSide = "bull" | "bear" | "risk" | "manager";

interface DebateBubbleProps {
  speaker: string;
  side: DebateSide;
  timestamp: string;
  message: string;
  corePoints?: string[];
}

export const DebateBubble: React.FC<DebateBubbleProps> = ({
  speaker,
  side,
  timestamp,
  message,
  corePoints,
}) => {
  const configs = {
    bull: {
      bg: "bg-[#061A14]",
      border: "border-[#10B981]/30",
      accent: "#10B981",
      icon: TrendingUp,
      tag: "BULL RESEARCHER",
    },
    bear: {
      bg: "bg-[#1A0A0E]",
      border: "border-[#EF4444]/30",
      accent: "#EF4444",
      icon: TrendingDown,
      tag: "BEAR RESEARCHER",
    },
    risk: {
      bg: "bg-[#181206]",
      border: "border-[#F59E0B]/30",
      accent: "#F59E0B",
      icon: ShieldAlert,
      tag: "RISK OFFICER",
    },
    manager: {
      bg: "bg-[#120B20]",
      border: "border-[#8B5CF6]/40",
      accent: "#8B5CF6",
      icon: UserCheck,
      tag: "PORTFOLIO MANAGER",
    },
  }[side];

  const Icon = configs.icon;

  return (
    <div
      className={`rounded-2xl p-5 border ${configs.border} ${configs.bg} transition-all duration-200 shadow-glass-inner`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${configs.accent}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: configs.accent }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">{speaker}</span>
              <span
                className="text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.2 rounded"
                style={{ color: configs.accent, backgroundColor: `${configs.accent}15` }}
              >
                {configs.tag}
              </span>
            </div>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timestamp}</span>
        </span>
      </div>

      {/* Main Argument Text */}
      <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
        {message}
      </div>

      {/* Bullet Points if provided */}
      {corePoints && corePoints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
          {corePoints.map((pt, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
              <span style={{ color: configs.accent }}>•</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateBubble;
