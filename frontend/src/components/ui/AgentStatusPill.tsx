import React from "react";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

export type AgentRole = "technical" | "macro" | "news" | "sentiment" | "risk" | "trader";
export type AgentState = "idle" | "running" | "done" | "rejected";

interface AgentStatusPillProps {
  role: AgentRole;
  name: string;
  state: AgentState;
  bias?: "bullish" | "bearish" | "neutral";
  details?: string;
}

const roleStyles: Record<AgentRole, { color: string; bg: string; border: string }> = {
  technical: { color: "#22D3EE", bg: "rgba(34, 211, 238, 0.12)", border: "rgba(34, 211, 238, 0.3)" },
  macro: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.3)" },
  news: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  sentiment: { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" },
  risk: { color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.3)" },
  trader: { color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.3)" },
};

export const AgentStatusPill: React.FC<AgentStatusPillProps> = ({
  role,
  name,
  state,
  bias,
  details,
}) => {
  const style = roleStyles[role] || roleStyles.technical;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161A] border border-[rgba(255,255,255,0.08)] shadow-glass-inner">
      <div className="flex items-center space-x-3">
        {/* State Icon / Pulsing Indicator */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center relative"
          style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
        >
          {state === "running" && (
            <>
              <span
                className="absolute inset-0 rounded-lg animate-ping opacity-75"
                style={{ backgroundColor: style.color }}
              />
              <Activity className="w-4 h-4 animate-spin" style={{ color: style.color }} />
            </>
          )}
          {state === "done" && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
          {state === "idle" && <Clock className="w-4 h-4 text-slate-500" />}
          {state === "rejected" && <XCircle className="w-4 h-4 text-[#EF4444]" />}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white tracking-wide">{name}</span>
            <span
              className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold"
              style={{ color: style.color, backgroundColor: style.bg }}
            >
              {role}
            </span>
          </div>
          {details && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{details}</p>}
        </div>
      </div>

      {/* Bias Pill */}
      {bias && (
        <span
          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
            bias === "bullish"
              ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
              : bias === "bearish"
              ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
              : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
          }`}
        >
          {bias}
        </span>
      )}
    </div>
  );
};

export default AgentStatusPill;
