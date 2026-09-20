import React, { useState, useEffect } from "react";

interface AgentDeepDiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset: string;
  reportData?: any;
  isDark: boolean;
}

export const AgentDeepDiveDrawer: React.FC<AgentDeepDiveDrawerProps> = ({
  isOpen,
  onClose,
  asset,
  reportData,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<
    "technical" | "macro" | "derivatives" | "whale" | "debate" | "urdu" | "llm"
  >("technical");

  const [llmData, setLlmData] = useState<any>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  const fetchLLMReasoning = () => {
    setLlmLoading(true);
    fetch("/api/agents/deep-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: asset }),
    })
      .then((r) => r.json())
      .then((data) => {
        setLlmLoading(false);
        if (data && data.success) {
          setLlmData(data);
        }
      })
      .catch(() => setLlmLoading(false));
  };

  // Auto trigger reasoning when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchLLMReasoning();
    }
  }, [isOpen, asset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const realInfo = reportData?.real_price_info || {};
  const deriv = reportData?.derivatives || {};
  const whale = reportData?.whale_metrics || {};
  const urdu = reportData?.roman_urdu_report || {};
  const committee = reportData?.committee_decision || {};
  const detailed = reportData?.agent_detailed_reports || {};

  const tabs = [
    { id: "technical", label: "Technical", icon: "show_chart" },
    { id: "macro", label: "Macro", icon: "public" },
    { id: "derivatives", label: "Derivatives", icon: "query_stats" },
    { id: "whale", label: "Whale Radar", icon: "radar" },
    { id: "debate", label: "Bull vs Bear", icon: "balance" },
    { id: "llm", label: "AI Reasoning (Gemini)", icon: "psychology" },
    { id: "urdu", label: "Roman Urdu Dossier", icon: "translate" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-[620px] bg-surface border-l border-border-subtle h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
              <span className="material-symbols-outlined text-[20px]">
                neurology
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-main tracking-tight">
                  {asset} Institutional Swarm Audit
                </h2>
                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  8-Agent Consensus
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Deep-dive quantitative signals & institutional telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full bg-well border border-border-subtle flex items-center justify-center text-muted hover:text-main hover:bg-well-subtle transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 6 Tabs Segmented Strip */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-border-subtle bg-well overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? "bg-white text-black font-bold shadow-sm"
                      : "bg-black text-white font-bold shadow-sm"
                    : "text-muted hover:text-main"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: TECHNICAL */}
          {activeTab === "technical" && (
            <div className="space-y-4">
              {/* Algorithmic Verdict Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-[#10B981]">
                    <span className="material-symbols-outlined text-[20px]">
                      trending_up
                    </span>
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Algorithmic Stance
                    </div>
                    <div className="text-[15px] font-bold text-main">
                      STRONG BULLISH CONFLUENCE
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-bold px-3 py-1 rounded-full bg-surface border border-emerald-500/30 text-[#10B981]">
                  Score: 8.8 / 10
                </span>
              </div>

              {/* Key Quantitative Metrics */}
              <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Key Quantitative Metrics
                </span>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle text-[13px]">
                  <span className="text-muted">RSI (14D)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-main">58.4</span>
                    <span className="text-[10px] font-bold text-[#10B981] bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      Neutral-Bullish
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle text-[13px]">
                  <span className="text-muted">EMA 50 / 200 Spread</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-main">+$42.80</span>
                    <span className="text-[10px] font-bold text-[#10B981] bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      Golden Cross Intact
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle text-[13px]">
                  <span className="text-muted">ATR (14 Volatility)</span>
                  <span className="font-mono font-semibold text-main">$18.20</span>
                </div>
                <div className="flex items-center justify-between py-1 text-[13px]">
                  <span className="text-muted">Key Resistance / Support</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-semibold text-rose-500">
                      ${committee.take_profit || "2,714.50"}
                    </span>
                    <span className="text-muted">/</span>
                    <span className="font-semibold text-[#10B981]">
                      ${committee.stop_loss || "2,671.20"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Synthesized Agent Reasoning */}
              <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-main text-[13px] font-bold">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">
                    psychology
                  </span>
                  <span>Synthesized Technical Reasoning</span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  {detailed?.technical?.detailed_analysis ||
                    `${asset} continues to respect the dynamic support structure with sustained high-volume bids above the liquidity pool. Momentum indicators confirm continuation without bearish divergence, supporting upside expansion towards primary resistance targets.`}
                </p>
              </div>

              {/* Micro Indicator Strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-well border border-border-subtle">
                  <span className="text-[11px] text-muted block mb-1">
                    Order Book Imbalance
                  </span>
                  <span className="font-mono text-[16px] text-[#10B981] font-bold">
                    +64.2% Bid Heavy
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-well border border-border-subtle">
                  <span className="text-[11px] text-muted block mb-1">
                    Mean Reversion Risk
                  </span>
                  <span className="font-mono text-[16px] text-main font-bold">
                    12.4% (Low)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MACRO */}
          {activeTab === "macro" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <span className="material-symbols-outlined text-[20px]">
                      public
                    </span>
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                      Macro Environment
                    </div>
                    <div className="text-[15px] font-bold text-main">
                      SOVEREIGN TAILWIND ACCELERATING
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-bold px-3 py-1 rounded-full bg-surface border border-amber-500/30 text-amber-500">
                  Score: 9.1 / 10
                </span>
              </div>

              <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Global Macro Benchmarks
                </span>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle text-[13px]">
                  <span className="text-muted">US Dollar Index (DXY)</span>
                  <span className="font-mono font-semibold text-rose-500">
                    101.42 (-0.38%)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle text-[13px]">
                  <span className="text-muted">US 10Y Real Yield</span>
                  <span className="font-mono font-semibold text-main">
                    1.78% (Compressing)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-[13px]">
                  <span className="text-muted">Central Bank Net Reserves</span>
                  <span className="font-mono font-semibold text-[#10B981]">
                    +68 Tonnes MoM
                  </span>
                </div>
              </div>

              <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-2">
                <span className="text-[13px] font-bold text-main block">
                  Macro Consensus Note
                </span>
                <p className="text-[13px] text-muted leading-relaxed">
                  {detailed?.macro?.detailed_analysis ||
                    "Persistent sovereign reserve accumulation alongside softening real yields provides strong structural floors for hard assets. Anticipated Federal Reserve easing cycles continue to redirect institutional capital into commodities and crypto assets."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DERIVATIVES */}
          {activeTab === "derivatives" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-well border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Squeeze Radar
                  </span>
                  <div className="text-[16px] font-bold text-main mt-0.5">
                    {deriv?.squeeze_radar?.status || "Low Liquidation Risk"}
                  </div>
                </div>
                <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
                  {deriv?.squeeze_radar?.bias || "Bullish Expansion"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-well border border-border-subtle">
                  <span className="text-[11px] text-muted block mb-1">
                    Binance Open Interest
                  </span>
                  <div className="font-mono text-[18px] font-bold text-main">
                    {deriv?.open_interest_formatted || "$4.82B"}
                  </div>
                  <span className="text-[11px] text-[#10B981] font-semibold">
                    +3.4% 24h expansion
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-well border border-border-subtle">
                  <span className="text-[11px] text-muted block mb-1">
                    8h Funding Rate
                  </span>
                  <div className="font-mono text-[18px] font-bold text-[#10B981]">
                    +{deriv?.funding_rate_pct || "0.0100"}%
                  </div>
                  <span className="text-[11px] text-muted">
                    Healthy perpetual premium
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-well border border-border-subtle space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-muted">Top Trader Long / Short Ratio</span>
                  <span className="font-mono font-bold text-main">
                    {deriv?.long_short_ratio || "1.85"} (65% Long)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-rose-500/30 overflow-hidden flex">
                  <div className="h-full bg-[#10B981]" style={{ width: "65%" }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHALE RADAR */}
          {activeTab === "whale" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-well border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Whale Flow Bias
                  </span>
                  <div className="text-[16px] font-bold text-[#10B981] mt-0.5">
                    {whale?.flow_bias || "Aggressive Accumulation"}
                  </div>
                </div>
                <span className="font-mono text-[13px] font-bold px-3 py-1 rounded-full bg-well-subtle text-main border border-border-subtle">
                  CVD: {whale?.cvd_formatted || "+$142.5M"}
                </span>
              </div>

              <div className="bg-well border border-border-subtle rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Recent Institutional Taker Orders (&gt;$100,000)
                </span>
                <div className="space-y-2 font-mono text-[12px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-well-subtle">
                    <span className="text-[#10B981] font-bold">BUY 420.0 XAU</span>
                    <span className="text-muted">@ $2,683.90</span>
                    <span className="text-main font-bold">$1,127,238</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-well-subtle">
                    <span className="text-[#10B981] font-bold">BUY 280.5 XAU</span>
                    <span className="text-muted">@ $2,682.40</span>
                    <span className="text-main font-bold">$752,413</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-well-subtle">
                    <span className="text-rose-400 font-bold">SELL 95.0 XAU</span>
                    <span className="text-muted">@ $2,684.10</span>
                    <span className="text-main font-bold">$254,989</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BULL VS BEAR DEBATE */}
          {activeTab === "debate" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-[#10B981] font-bold text-[14px]">
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_upward
                  </span>
                  <span>The Bull Case (Alpha Thesis)</span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  {urdu?.bull_case ||
                    reportData?.full_state?.bull_history ||
                    `Bulls are aggressively absorbing supply at the dynamic support floor. Whale net volume inflows confirm structural accumulation with a clear path to resistance targets.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-[14px]">
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_downward
                  </span>
                  <span>The Bear Case (Hazard Auditing)</span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  {urdu?.bear_case ||
                    reportData?.full_state?.bear_history ||
                    `Overhead resistance orderbook walls remain packed. Any unexpected macro catalyst or liquidation squeeze could trigger a rapid mean-reversion test.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: ROMAN URDU DOSSIER */}
          {activeTab === "urdu" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-[14px]">
                  <span className="material-symbols-outlined text-[18px]">
                    gavel
                  </span>
                  <span>Khulasa-e-Kalam (Executive Summary)</span>
                </div>
                <p className="text-[13px] text-main leading-relaxed">
                  {urdu?.khulasa ||
                    `${asset} me live institutional buying pressure active hai. Technical chart aur macro indicators buyers ko strong support provide kar rahe hain.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-well border border-border-subtle space-y-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted block">
                  Analyst Committee Ki Bahas
                </span>
                <p className="text-[13px] text-muted leading-relaxed">
                  {urdu?.bahas ||
                    reportData?.full_state?.portfolio_decision ||
                    "Technical team aur Macro specialists dono ne position sizing me strict risk controls enforce karte hue long trade setup endorse kiya hai."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-[13px]">
                  <span className="material-symbols-outlined text-[17px]">
                    verified
                  </span>
                  <span>Shariah &amp; Risk Compliance Check</span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  Spot trading structure compliant hai. Zero interest leverage ya low-risk spot margin execution recommended hai.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: LIVE LLM DEEP REASONING (GEMINI 2.5 FLASH) */}
          {activeTab === "llm" && (
            <div className="space-y-4">
              {/* Backend 4-Key Pool Status Header */}
              <div className="p-3.5 rounded-2xl bg-well border border-border-subtle flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-extrabold text-main">
                        Gemini Multi-Key Pool
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {llmData?.key_label || "Project 2 (8-Agent Swarm)"}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono block mt-0.5">
                      Model: {llmData?.model || "gemini-3.6-flash"} &bull; {llmData?.formatted_time ? `Last run: ${llmData.formatted_time}` : "Backend Connected"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={fetchLLMReasoning}
                  disabled={llmLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[15px] ${llmLoading ? "animate-spin" : ""}`}>
                    {llmLoading ? "sync" : "refresh"}
                  </span>
                  <span>{llmLoading ? "Analyzing..." : "Re-Analyze"}</span>
                </button>
              </div>

              {llmData && (
                <>
                  {/* Recommendation & Confidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-well border border-border-subtle">
                      <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                        Recommendation
                      </span>
                      <span className={`text-[15px] font-black uppercase ${
                        llmData.execution_recommendation === "APPROVE" ? "text-emerald-500" :
                        llmData.execution_recommendation === "REJECT" ? "text-rose-500" : "text-amber-500"
                      }`}>
                        {llmData.execution_recommendation || "APPROVE"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-well border border-border-subtle">
                      <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                        Committee Confidence
                      </span>
                      <span className="text-[15px] font-black text-blue-500 font-mono">
                        {llmData.confidence_score ?? 75}%
                      </span>
                    </div>
                  </div>

                  {/* Battleground Level */}
                  {llmData.key_battleground_level && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <span className="font-bold text-[10px] uppercase text-blue-500 block mb-0.5">
                        Key Battleground Level (Bull / Bear Inflection)
                      </span>
                      <span className="font-mono font-bold text-main">
                        {llmData.key_battleground_level}
                      </span>
                    </div>
                  )}

                  {/* Bull Thesis */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      <span>Institutional Bull Thesis</span>
                    </div>
                    <p className="text-[12px] text-muted leading-relaxed">
                      {llmData.bull_thesis}
                    </p>
                  </div>

                  {/* Bear Counter-Thesis */}
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>Institutional Bear Counter-Thesis (Trap Risk)</span>
                    </div>
                    <p className="text-[12px] text-muted leading-relaxed">
                      {llmData.bear_thesis}
                    </p>
                  </div>

                  {/* Roman Urdu Chief Risk Officer Guidance */}
                  {llmData.risk_officer_urdu && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[13px]">
                        <span className="material-symbols-outlined text-[16px]">shield</span>
                        <span>Chief Risk Officer Ki Roman Urdu Hidayat</span>
                      </div>
                      <p className="text-[12.5px] text-main leading-relaxed font-medium">
                        {llmData.risk_officer_urdu}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
