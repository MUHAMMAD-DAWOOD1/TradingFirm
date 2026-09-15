import React from "react";

interface RadialGaugeProps {
  value: number; // 0 to 100
  title: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  type?: "confidence" | "risk";
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  title,
  subtitle,
  size = 150,
  strokeWidth = 12,
  type = "confidence",
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Determine dynamic color based on type and value
  const getColor = () => {
    if (type === "confidence") {
      if (normalizedValue >= 75) return "#10B981"; // Emerald green
      if (normalizedValue >= 50) return "#22D3EE"; // Cyan
      if (normalizedValue >= 35) return "#F59E0B"; // Amber
      return "#EF4444"; // Red
    } else {
      // Risk Gauge: low risk is green, high risk is red
      if (normalizedValue <= 35) return "#10B981"; // Low Risk
      if (normalizedValue <= 70) return "#F59E0B"; // Med Risk
      return "#EF4444"; // High Risk
    }
  };

  const activeColor = getColor();

  return (
    <div className="bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 flex flex-col items-center justify-center relative shadow-glass-inner">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1B1E24"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Fill Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${activeColor}60)`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-white font-mono tracking-tight">
            {normalizedValue}
            <span className="text-sm font-normal text-slate-400">%</span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
            {type === "confidence"
              ? normalizedValue >= 70
                ? "HIGH CONVICTION"
                : "MODERATE"
              : normalizedValue <= 40
              ? "LOW RISK"
              : "ELEVATED"}
          </span>
        </div>
      </div>

      <div className="text-center mt-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default RadialGauge;
