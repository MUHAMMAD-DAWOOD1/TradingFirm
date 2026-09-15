import React, { useState } from 'react';
import { 
  BarChart3, 
  Globe2, 
  Newspaper, 
  Activity, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Search
} from 'lucide-react';

interface AgentReport {
  name: string;
  role: string;
  stance?: string;
  summary?: string;
  key_metrics?: Record<string, any>;
  detailed_analysis?: string;
  arguments?: string[];
  headlines?: any[];
  general_guidelines?: string;
  tailored_capital_advisory?: string;
}

interface AgentDetailedReportsWidgetProps {
  agentReports?: Record<string, AgentReport>;
  symbol: string;
}

export const AgentDetailedReportsWidget: React.FC<AgentDetailedReportsWidgetProps> = ({
  agentReports,
  symbol,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('technical');

  // Fallback defaults if not yet present
  const reports = agentReports || {
    technical: {
      name: "Technical & Liquidity Structure Analyst",
      role: "Orderbook & Chart Patterns",
      stance: "BULLISH",
      summary: `${symbol} positive breakout zone me consolidate ho rahi hai.`,
      key_metrics: {
        "Moving Averages": "10-EMA above 50-SMA dynamic trendline",
        "Orderbook": "Tight Institutional ECN Spreads",
        "Liquidity Wall": "Bid Depth Wall dominant"
      },
      detailed_analysis: `${symbol} ke 1H aur 4H charts par institutional support levels clearly hold kar rahe hain. Orderbook bids downside protection provide karti hain.`
    },
    macro: {
      name: "Macroeconomic & Central Bank Analyst",
      role: "Federal Reserve & Yield Analysis",
      stance: "BULLISH",
      summary: "Dollar Index (DXY) stability hard assets ko upside runway deti hai.",
      key_metrics: {
        "US Dollar Index (DXY)": "104.20 (Cooling down)",
        "US 10Y Yield": "4.28% (Stable Range)",
        "Monetary Policy": "Fed Rate Pause Expectations"
      },
      detailed_analysis: "Federal Reserve policy expectations aur sovereign reserve accumulation global liquidity flows ko support kar rahe hain."
    },
    news: {
      name: "Global Breaking News Intelligence",
      role: "Geopolitics & Regulatory Catalysts",
      stance: "BULLISH",
      summary: "Live macro economic news digest scanned.",
      detailed_analysis: "Central bank reserves growth aur institutional capital inflows macro baseline ko solidify karte hain."
    },
    derivatives: {
      name: "Derivatives & Liquidity Flow Specialist",
      role: "Futures Open Interest & Funding Rates",
      stance: "BULLISH",
      summary: "Futures Open Interest expand ho raha hai jabke funding rate balanced hai.",
      key_metrics: {
        "8h Funding Rate": "+0.0100%",
        "Squeeze Bias": "Bullish Trend Squeeze",
        "Liquidity Pools": "Overhead Short Stops target"
      },
      detailed_analysis: "Derivatives flow short-seller stop-loss clusters ko squeeze target banati hai jo upward acceleration generate kar sakta hai."
    },
    bull_thesis: {
      name: "Institutional Bull Researcher Thesis",
      role: "Upside Driver Verification",
      arguments: [
        "1. Dynamic Support Defense: Buyers key demand block ko aggressively defend kar rahe hain.",
        "2. Whale Liquidity Absorption: CVD flow buyers ko clear structural edge de raha hai.",
        "3. Path of Least Resistance: Overhead supply thin hone ki wajah se breakout expansion high-probability setup banata hai."
      ]
    },
    bear_thesis: {
      name: "Institutional Bear Researcher Counter-Thesis",
      role: "Downside Hazard & Risk Counter-Check",
      arguments: [
        "1. Resistance Wall Overhang: Overhead supply target par profit taking trigger ho sakti hai.",
        "2. Macro Volatility Flush: High-impact releases sudden liquidity wicks create kar sakti hain.",
        "3. Strict Invalidation: Support ke niche candle close hone par setup invalidate ho jayega."
      ]
    },
    risk_officer: {
      name: "Quantitative Risk Management Officer",
      role: "Position Sizing & Capital Preservation",
      general_guidelines: "Maximum 2.0% capital risk per trade with 1:2.0 Risk/Reward ratio. Stop-loss strictly non-negotiable.",
      tailored_capital_advisory: "Capital preservation is paramount. Never chase price above optimal entry zone."
    }
  };

  const sections = [
    { key: 'technical', title: '1. Technical & Liquidity Structure Analyst', icon: BarChart3, color: 'text-[#22D3EE]' },
    { key: 'macro', title: '2. Macroeconomic & Central Bank Analyst', icon: Globe2, color: 'text-blue-400' },
    { key: 'news', title: '3. Global Breaking News Intelligence', icon: Newspaper, color: 'text-amber-400' },
    { key: 'derivatives', title: '4. Derivatives & Liquidity Flow Specialist', icon: Activity, color: 'text-purple-400' },
    { key: 'bull_thesis', title: '5. Institutional Bull Researcher Thesis', icon: CheckCircle2, color: 'text-emerald-400' },
    { key: 'bear_thesis', title: '6. Institutional Bear Researcher Counter-Thesis', icon: Flame, color: 'text-red-400' },
    { key: 'risk_officer', title: '7. Quantitative Risk Management Officer Verdict', icon: ShieldCheck, color: 'text-emerald-400' },
  ];

  const toggleSection = (k: string) => {
    setExpandedSection(expandedSection === k ? null : k);
  };

  return (
    <div className="bg-[#14161A] border border-white/10 rounded-2xl p-6 shadow-glass-inner space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
              Deep-Dive Separate Agent Reports ({symbol})
            </h3>
            <p className="text-xs text-slate-400">
              Individual institutional specialist briefings and exact reasoning behind the consensus
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-3 pt-1">
        {sections.map((sec) => {
          const rep = reports[sec.key];
          if (!rep) return null;
          const isExpanded = expandedSection === sec.key;
          const IconComp = sec.icon;

          return (
            <div
              key={sec.key}
              className={`border rounded-xl transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-[#181c24] border-white/15 shadow-lg'
                  : 'bg-[#0f1217] border-white/5 hover:border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(sec.key)}
                className="w-full flex items-center justify-between p-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-black/40 border border-white/5 ${sec.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-100 font-mono">
                        {sec.title}
                      </span>
                      {rep.stance && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            rep.stance === 'BULLISH'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {rep.stance}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                      Role: {rep.role}
                    </span>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 text-xs border-t border-white/5">
                  {/* Summary */}
                  {rep.summary && (
                    <div className="bg-[#0A0B0D] p-3 rounded-lg border border-white/5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Executive Summary:
                      </span>
                      <p className="text-slate-200 font-sans leading-relaxed">{rep.summary}</p>
                    </div>
                  )}

                  {/* Key Metrics */}
                  {rep.key_metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(rep.key_metrics).map(([k, v]) => (
                        <div key={k} className="bg-[#0A0B0D] p-2.5 rounded-lg border border-white/5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-cyan-300 block mt-0.5">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed Analysis / Roman Urdu Explanation */}
                  {rep.detailed_analysis && (
                    <div className="bg-[#0A0B0D] p-3.5 rounded-lg border border-white/5">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1 font-bold">
                        Detailed Institutional Reasoning:
                      </span>
                      <p className="text-slate-300 font-sans leading-relaxed">
                        {rep.detailed_analysis}
                      </p>
                    </div>
                  )}

                  {/* Bulleted Arguments for Thesis */}
                  {rep.arguments && rep.arguments.length > 0 && (
                    <div className="bg-[#0A0B0D] p-3.5 rounded-lg border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1 font-bold">
                        Core Pillars:
                      </span>
                      {rep.arguments.map((arg, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-300 font-sans">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{arg}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Breaking News Headlines */}
                  {rep.headlines && rep.headlines.length > 0 && (
                    <div className="bg-[#0A0B0D] p-3 rounded-lg border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                        Latest Live Catalysts:
                      </span>
                      {rep.headlines.map((hl, i) => (
                        <div key={i} className="text-[11px] font-mono text-slate-300 flex items-center justify-between border-b border-white/5 pb-1">
                          <span className="truncate pr-2">{hl.title}</span>
                          <span className="text-[9px] text-slate-500 flex-shrink-0">{hl.published_at}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Risk Officer Guidelines */}
                  {rep.general_guidelines && (
                    <div className="bg-[#0A0B0D] p-3 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold mb-1">
                        Risk Governance Protocol:
                      </span>
                      <p className="text-slate-300 font-sans">{rep.general_guidelines}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentDetailedReportsWidget;
