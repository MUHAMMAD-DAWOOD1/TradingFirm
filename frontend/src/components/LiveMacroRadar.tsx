import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
  HelpCircle,
  Radio,
  Layers,
  Sparkles,
  Zap,
  Target
} from "lucide-react";

interface MacroEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual: string;
  mins_remaining: number | null;
  secs_remaining: number | null;
  countdown_display: string;
  time_status: string;
  is_passed: boolean;
  passed_checkmark?: string | null;
  is_high_impact: boolean;
  is_major_event: boolean;
  is_fomc: boolean;
  deviation: string;
  verdict: string;
  verdict_label: string;
  institutional_consensus: string;
  crowd_narrative_urdu?: string;
  trader_action_urdu: string;
  post_release_scene_urdu?: string;
  gold_impact?: string;
  volatility_alert: string;
  bot_thesis_urdu?: string;
  bot_predicted_bias?: string;
  actual_market_reaction?: string;
  validation_status?: string;
  accuracy_score?: number;
  validation_notes_urdu?: string;
}

interface ValidationSummary {
  total_evaluated: number;
  completed_count: number;
  passed_count: number;
  failed_count: number;
  pending_count: number;
  win_rate_pct: number;
  productivity_status: string;
  productivity_verdict_urdu: string;
}

interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  published_at: string;
  time_ago: string;
  timestamp: number;
  category: string;
  category_label: string;
  urgency: string;
  sentiment: string;
  impact_on_gold: string;
  urdu_summary: string;
  link: string;
}

interface VolatilityClocks {
  current_utc_time: string;
  active_session: string;
  volatility_score: number;
  volatility_label: string;
  is_liquidity_overlap: boolean;
  sessions: Array<{
    name: string;
    active: boolean;
    hours_utc: string;
    status: string;
    volatility: string;
  }>;
}

interface LiveMacroRadarProps {
  isDark?: boolean;
}

export const LiveMacroRadar: React.FC<LiveMacroRadarProps> = ({ isDark = true }) => {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [fomcSpotlight, setFomcSpotlight] = useState<MacroEvent | null>(null);
  const [valSummary, setValSummary] = useState<ValidationSummary | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [clocks, setClocks] = useState<VolatilityClocks | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "FOMC" | "HIGH_IMPACT" | "PASSED" | "ACCURATE">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [tickerOffset, setTickerOffset] = useState<number>(0);

  // Fetch Calendar and News
  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const [calRes, newsRes] = await Promise.all([
        fetch("/api/calendar?limit=40"),
        fetch("/api/news?asset=GOLD")
      ]);

      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.events || []);
        if (calData.fomc_spotlight) {
          setFomcSpotlight(calData.fomc_spotlight);
        }
        if (calData.validation_summary) {
          setValSummary(calData.validation_summary);
        }
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData.news || []);
        setClocks(newsData.volatility_clocks || null);
      }
      setLastRefreshed(new Date());
      setTickerOffset(0);
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // 15-second background polling
    const pollTimer = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(pollTimer);
  }, []);

  // Per-second local tick for real-time live countdowns down to the second
  useEffect(() => {
    const secondTimer = setInterval(() => {
      setTickerOffset((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(secondTimer);
  }, []);

  // Format live seconds remaining down to the second
  const formatLiveCountdown = (secs: number | null, isPassed: boolean) => {
    if (isPassed) return "✓ PASSED";
    if (secs === null) return "Pending";
    const remaining = secs - tickerOffset;
    if (remaining <= -1800) return "✓ PASSED";
    if (remaining <= 0) return "⚡ Releasing Now";

    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = Math.floor(remaining % 60);

    if (h > 24) {
      const days = Math.floor(h / 24);
      return `In ${days}d ${h % 24}h ${m}m`;
    }
    if (h > 0) {
      return `In ${h}h ${m < 10 ? "0" : ""}${m}m ${s < 10 ? "0" : ""}${s}s`;
    }
    return `In ${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Filter events by tab
  const filteredEvents = events.filter((ev) => {
    if (activeTab === "FOMC") return ev.is_fomc;
    if (activeTab === "HIGH_IMPACT") return ev.is_high_impact || ev.is_major_event;
    if (activeTab === "PASSED") return ev.is_passed;
    if (activeTab === "ACCURATE") return ev.validation_status === "PASSED";
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. BOT MACRO INTELLIGENCE & ACCURACY VALIDATION BANNER (INVERSE THEME) */}
      {valSummary && (
        <div className={`p-5 md:p-6 rounded-3xl transition-all ${
          isDark
            ? "bg-white text-neutral-950 border-2 border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            : "bg-black text-white border-2 border-neutral-800 shadow-2xl"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <h2 className={`text-lg md:text-xl font-black tracking-tight flex items-center gap-2 ${
                isDark ? "text-neutral-950" : "text-white"
              }`}>
                Real-Time Economic News &amp; Release Outcomes
              </h2>

              <p className={`text-xs leading-relaxed font-sans max-w-3xl ${
                isDark ? "text-neutral-800 font-semibold" : "text-neutral-200 font-medium"
              }`}>
                {valSummary.productivity_verdict_urdu}
              </p>

              <div className="flex items-center gap-2.5 text-[11px] font-bold flex-wrap">
                <span className={isDark ? "text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300" : "text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600"}>
                  ✓ Passed: {valSummary.passed_count} Events
                </span>
                <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>&bull;</span>
                <span className={isDark ? "text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300" : "text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-600"}>
                  ✗ Mismatch: {valSummary.failed_count} Events
                </span>
                <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>&bull;</span>
                <span className={isDark ? "text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300" : "text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600"}>
                  ⚡ Upcoming/Pending: {valSummary.pending_count} Events
                </span>
              </div>
            </div>

            {/* Scorecard Widget */}
            <div className={`flex md:flex-col items-center md:items-end justify-between shrink-0 font-mono p-4 rounded-2xl min-w-[210px] border ${
              isDark
                ? "bg-neutral-100 border-neutral-300 text-neutral-950"
                : "bg-neutral-900 border-neutral-800 text-white"
            }`}>
              <div className={`text-[10px] uppercase font-black tracking-wider ${isDark ? "text-neutral-700" : "text-neutral-400"}`}>
                Bot Forecast Win Rate
              </div>
              <div className={`text-3xl font-black tracking-tight ${isDark ? "text-emerald-700" : "text-emerald-400"}`}>
                {valSummary.win_rate_pct}%
              </div>
              <div className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-neutral-700" : "text-neutral-400"}`}>
                {valSummary.passed_count} Verified Passed / {valSummary.completed_count} Finished
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FOMC CENTRAL BANK SPOTLIGHT HERO BANNER (INVERSE THEME) */}
      {fomcSpotlight && (
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all ${
          isDark
            ? "bg-white text-neutral-950 border-2 border-amber-500/50 shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
            : "bg-black text-white border-2 border-amber-500/40 shadow-2xl"
        }`}>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {fomcSpotlight.is_passed ? (
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-black border flex items-center gap-1 ${
                    isDark
                      ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                      : "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? "text-emerald-700" : "text-emerald-400"}`} />
                    ✓ Event Passed (Sept 15/16 Release)
                  </span>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border flex items-center gap-1 animate-pulse ${
                    isDark
                      ? "bg-rose-100 text-rose-950 border-rose-400"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}>
                    <Clock className="w-3 h-3" />
                    Live Countdown
                  </span>
                )}
              </div>

              <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 ${
                isDark ? "text-neutral-950" : "text-white"
              }`}>
                {fomcSpotlight.title}
              </h2>

              <p className={`text-xs md:text-sm leading-relaxed font-sans ${
                isDark ? "text-neutral-800 font-semibold" : "text-neutral-200 font-medium"
              }`}>
                {fomcSpotlight.crowd_narrative_urdu || fomcSpotlight.institutional_consensus}
              </p>

              {/* Bot Advance Thesis & Validation */}
              {fomcSpotlight.bot_thesis_urdu && (
                <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                  isDark
                    ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-950 font-medium"
                    : "bg-neutral-900 border border-emerald-500/40 text-emerald-200"
                }`}>
                  <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-emerald-700" : "text-emerald-400"}`} />
                  <div>
                    <span className={`font-black uppercase tracking-wider text-[10px] block ${
                      isDark ? "text-emerald-800" : "text-emerald-400"
                    }`}>
                      Macro Event Context:
                    </span>
                    {fomcSpotlight.bot_thesis_urdu}
                  </div>
                </div>
              )}

              {/* Roman Urdu Trader Instruction */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                isDark
                  ? "bg-amber-50 border-2 border-amber-300 text-amber-950 font-medium"
                  : "bg-neutral-900 border border-amber-500/30 text-amber-200"
              }`}>
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-700" : "text-amber-400"}`} />
                <div>
                  <span className={`font-black uppercase tracking-wider text-[10px] block ${
                    isDark ? "text-amber-800" : "text-amber-400"
                  }`}>
                    Trading Execution Rule:
                  </span>
                  {fomcSpotlight.trader_action_urdu}
                </div>
              </div>
            </div>

            {/* Right Side: Big Countdown & Forecast vs Actual Meter */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
              {/* Status & Timing Box */}
              <div className={`w-full sm:w-auto rounded-2xl p-4 text-center lg:text-right min-w-[220px] border ${
                isDark
                  ? "bg-neutral-100 border-neutral-300 text-neutral-950"
                  : "bg-neutral-900 border-neutral-800 text-white"
              }`}>
                <div className={`text-[11px] font-black uppercase tracking-wider flex items-center justify-center lg:justify-end gap-1.5 mb-1 ${
                  isDark ? "text-neutral-700" : "text-neutral-400"
                }`}>
                  <Clock className={`w-3.5 h-3.5 ${isDark ? "text-amber-700" : "text-amber-400"}`} />
                  Release Outcome Status
                </div>
                <div className={`font-mono text-2xl md:text-3xl font-black tracking-tight ${
                  fomcSpotlight.is_passed
                    ? isDark ? "text-emerald-700" : "text-emerald-400"
                    : isDark ? "text-amber-700" : "text-amber-400"
                }`}>
                  {fomcSpotlight.is_passed ? "PASSED (RELEASED)" : formatLiveCountdown(fomcSpotlight.secs_remaining, fomcSpotlight.is_passed)}
                </div>
                <div className={`text-[10px] mt-1 font-mono font-bold ${isDark ? "text-neutral-700" : "text-neutral-400"}`}>
                  Official Rate Target: 4.00%
                </div>
              </div>

              {/* Consensus Numbers: Prior, Forecast, Actual */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className={`px-4 py-2.5 rounded-xl border text-center ${
                  isDark
                    ? "bg-neutral-100 border-neutral-300 text-neutral-950"
                    : "bg-neutral-900 border-neutral-800 text-white"
                }`}>
                  <div className={`text-[10px] font-bold uppercase ${isDark ? "text-neutral-700" : "text-neutral-400"}`}>
                    Prior Rate
                  </div>
                  <div className={`font-mono text-sm font-black ${isDark ? "text-neutral-900" : "text-neutral-200"}`}>
                    {fomcSpotlight.previous}
                  </div>
                </div>

                <div className={`px-4 py-2.5 rounded-xl border text-center ${
                  isDark
                    ? "bg-amber-100 border-2 border-amber-400 text-amber-950"
                    : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                }`}>
                  <div className={`text-[10px] font-black uppercase ${isDark ? "text-amber-800" : "text-amber-400"}`}>
                    Forecast
                  </div>
                  <div className={`font-mono text-sm font-black ${isDark ? "text-amber-950" : "text-amber-200"}`}>
                    {fomcSpotlight.forecast}
                  </div>
                </div>

                {fomcSpotlight.actual && fomcSpotlight.actual !== "—" && (
                  <div className={`px-4 py-2.5 rounded-xl border-2 text-center ${
                    isDark
                      ? "bg-emerald-100 border-emerald-400 text-emerald-950"
                      : "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                  }`}>
                    <div className={`text-[10px] font-black uppercase ${isDark ? "text-emerald-800" : "text-emerald-300"}`}>
                      Actual Print
                    </div>
                    <div className={`font-mono text-sm font-black ${isDark ? "text-emerald-950" : "text-emerald-300"}`}>
                      {fomcSpotlight.actual}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. REAL-TIME MACRO CALENDAR TABLE & NEWS WIRE SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Macro Calendar Releases Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm backdrop-blur-md">
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                    Economic Calendar &amp; News Validation
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Live Telemetry
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    ForexFactory Live Feed + Federal Reserve Schedule + Bot Accuracy Audit
                  </p>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchTelemetry}
                disabled={loading}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Catalysts", count: events.length },
                { id: "FOMC", label: "FOMC & Fed Only", count: events.filter((e) => e.is_fomc).length },
                { id: "HIGH_IMPACT", label: "High Impact Only", count: events.filter((e) => e.is_high_impact || e.is_major_event).length },
                { id: "PASSED", label: "Completed (✓ Passed)", count: events.filter((e) => e.is_passed).length },
                { id: "ACCURATE", label: "✓ Bot Accurate", count: events.filter((e) => e.validation_status === "PASSED").length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-black/20">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b-2 border-slate-300 dark:border-neutral-700 text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-neutral-200 bg-slate-100/90 dark:bg-neutral-800/80">
                    <th className="py-3 pl-3">Time / Countdown</th>
                    <th className="py-3">Ccy</th>
                    <th className="py-3">Impact</th>
                    <th className="py-3">Event Catalyst</th>
                    <th className="py-3 text-center font-mono">Forecast</th>
                    <th className="py-3 text-center font-mono">Actual</th>
                    <th className="py-3 text-center">Bot Validation</th>
                    <th className="py-3 text-right pr-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-neutral-800/60">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                        No events found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => {
                      const isExpanded = expandedId === ev.id;
                      const isHigh = ev.is_high_impact || ev.is_major_event;
                      const isImminent = ev.secs_remaining !== null && ev.secs_remaining > 0 && ev.secs_remaining <= 3600;

                      return (
                        <React.Fragment key={ev.id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                            className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                          >
                            {/* Live Countdown Clock / Passed Status */}
                            <td className="py-3.5 pl-3 font-mono whitespace-nowrap">
                              {ev.is_passed ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-600 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                  ✓ PASSED
                                </span>
                              ) : isImminent ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border border-rose-400 dark:border-rose-600 animate-pulse shadow-sm">
                                  <Clock className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                                  {formatLiveCountdown(ev.secs_remaining, ev.is_passed)}
                                </span>
                              ) : (
                                <span className="text-slate-800 dark:text-neutral-300 text-[11px] font-bold flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                                  {formatLiveCountdown(ev.secs_remaining, ev.is_passed)}
                                </span>
                              )}
                            </td>

                            {/* Currency */}
                            <td className="py-3.5">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-black border ${
                                ev.country === "USD"
                                  ? "bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                  : ev.country === "EUR"
                                  ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                  : "bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-300 border-slate-300 dark:border-neutral-700"
                              }`}>
                                {ev.country}
                              </span>
                            </td>

                            {/* Impact */}
                            <td className="py-3.5">
                              <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                                isHigh
                                  ? "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                                  : "bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700"
                              }`}>
                                {ev.impact}
                              </span>
                            </td>

                            {/* Title */}
                            <td className="py-3.5 font-bold text-slate-950 dark:text-neutral-100 max-w-xs truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{ev.title}</span>
                                {ev.is_fomc && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-400 shrink-0">
                                    FOMC
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Forecast */}
                            <td className="py-3.5 text-center font-mono font-bold">
                              <span className="bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-200 border border-slate-300 dark:border-neutral-700 px-2 py-0.5 rounded text-xs">
                                {ev.forecast}
                              </span>
                            </td>

                            {/* Actual Print */}
                            <td className="py-3.5 text-center font-mono font-black">
                              {ev.actual && ev.actual !== "—" ? (
                                <span className="bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-600 px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm">
                                  {ev.actual}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-neutral-500 font-bold">—</span>
                              )}
                            </td>

                            {/* Bot Validation Status Badge */}
                            <td className="py-3.5 text-center">
                              {ev.validation_status === "PASSED" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600 whitespace-nowrap shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                  ✓ Bot Pass
                                </span>
                              ) : ev.validation_status === "FAILED" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-600 whitespace-nowrap shadow-sm">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                                  ✗ Mismatch
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-600 whitespace-nowrap">
                                  <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                                  Thesis Active
                                </span>
                              )}
                            </td>

                            {/* Outcome / Deviation */}
                            <td className="py-3.5 text-right pr-3 font-mono">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  ev.verdict.includes("DOVISH") || ev.verdict.includes("BEAT")
                                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-black"
                                    : ev.verdict.includes("HAWKISH")
                                    ? "bg-rose-100 dark:bg-rose-950/70 text-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-black"
                                    : "bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-200 border-slate-300 dark:border-neutral-700 font-semibold"
                                }`}>
                                  {ev.deviation !== "—" ? ev.deviation : ev.verdict_label.split(" ")[0]}
                                </span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Drawer: Bot Thesis & What Actually Happened (Scene) */}
                          {isExpanded && (
                            <tr className="bg-slate-50 dark:bg-neutral-800/40 border-b border-slate-200 dark:border-neutral-800">
                              <td colSpan={8} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                  {/* Bot Advance Forecast */}
                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 shadow-sm space-y-1">
                                    <div className="font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Bot Advance Forecast (Roman Urdu)
                                    </div>
                                    <p className="text-slate-800 dark:text-neutral-200 text-[11px] leading-relaxed font-sans font-medium">
                                      {ev.bot_thesis_urdu || ev.institutional_consensus}
                                    </p>
                                    <div className="text-[10px] text-slate-600 dark:text-neutral-400 pt-1 font-mono font-bold">
                                      Bias: {ev.bot_predicted_bias || "NEUTRAL"}
                                    </div>
                                  </div>

                                  {/* Actual Scene & Reaction */}
                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 shadow-sm space-y-1">
                                    <div className="font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                      <Zap className="w-3.5 h-3.5" />
                                      Event Ke Baad Kya Scene Hua (Actual Reaction)
                                    </div>
                                    <p className="text-slate-800 dark:text-neutral-200 text-[11px] leading-relaxed font-sans font-medium">
                                      {ev.actual_market_reaction || ev.post_release_scene_urdu || "Event completed."}
                                    </p>
                                    <div className="text-[10px] text-slate-600 dark:text-neutral-400 pt-1 font-mono font-bold">
                                      Deviation: {ev.deviation} (Forecast {ev.forecast} vs Actual {ev.actual})
                                    </div>
                                  </div>

                                  {/* Validation Outcome Note */}
                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 shadow-sm space-y-1">
                                    <div className="font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Bot Verification Verdict
                                    </div>
                                    <p className="text-slate-800 dark:text-neutral-200 text-[11px] leading-relaxed font-sans font-medium">
                                      {ev.validation_notes_urdu || "Validation complete."}
                                    </p>
                                    <div className="text-[10px] text-amber-900 dark:text-amber-300 font-bold pt-1">
                                      Hidayat: {ev.trader_action_urdu}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Breaking News Wire */}
        <div className="space-y-4">
          {/* Volatility Clocks Card */}
          {clocks && (
            <div className="p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black tracking-tight">Global Trading Sessions</h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  UTC {clocks.current_utc_time}
                </span>
              </div>

              <div className="space-y-2">
                {clocks.sessions.map((s) => (
                  <div
                    key={s.name}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      s.active
                        ? "bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-black shadow-sm"
                        : "bg-slate-100 dark:bg-neutral-800/60 border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.active ? "bg-emerald-600 dark:bg-emerald-400 animate-ping" : "bg-slate-400 dark:bg-neutral-500"}`} />
                      <span>{s.name}</span>
                    </div>
                    <div className={`text-[10px] font-mono font-bold ${s.active ? "text-emerald-900 dark:text-emerald-300" : "text-slate-600 dark:text-neutral-400"}`}>
                      {s.hours_utc} UTC
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breaking News Wire Card */}
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black tracking-tight text-slate-950 dark:text-white">Real-Time Breaking News Wire</h4>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                Live RSS
              </span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 text-xs">
              {news.length === 0 ? (
                <div className="text-center py-6 text-slate-500 font-mono text-[11px]">
                  Waiting for new wire updates...
                </div>
              ) : (
                news.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-800 hover:border-slate-400 dark:hover:border-neutral-600 transition-all space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-neutral-300">{n.publisher}</span>
                      <span className="font-mono text-slate-600 dark:text-neutral-400">{n.time_ago}</span>
                    </div>
                    <h5 className="font-bold text-slate-950 dark:text-neutral-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1">
                        <span>{n.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-neutral-500" />
                      </a>
                    </h5>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                        n.sentiment === "BULLISH" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-neutral-700 text-neutral-300"
                      }`}>
                        {n.sentiment}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        Gold: {n.impact_on_gold}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMacroRadar;
