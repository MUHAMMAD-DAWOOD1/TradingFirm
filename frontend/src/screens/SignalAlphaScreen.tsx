import React, { useState, useEffect } from "react";
import {
  Radio,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Copy,
  ExternalLink,
  Sliders,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Clock,
  TrendingUp,
  MessageSquare,
  Share2,
  Zap,
  BarChart2
} from "lucide-react";
import { TradeExecutionModal } from "../components/TradeExecutionModal";

interface SignalItem {
  id: string;
  source: string;
  channel_name: string;
  raw_text: string;
  asset: string;
  direction: "BUY" | "SELL";
  entry_min: number;
  entry_max: number;
  stop_loss: number;
  take_profit_targets: number[];
  risk_reward: string;
  trap_status: "VERIFIED_ALPHA" | "RETAIL_TRAP_SUSPECTED" | "HIGH_RISK_VOLATILE";
  trap_score: number;
  trap_reasons: string[];
  swarm_confidence: number;
  outcome_status: string;
  created_at: string;
}

interface ChannelItem {
  id: string;
  platform: string;
  channel_name: string;
  channel_handle?: string;
  channel_link?: string;
  is_active: number;
  win_count: number;
  loss_count: number;
  total_signals: number;
  win_rate_pct: number;
}

export const SignalAlphaScreen: React.FC = () => {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});

  // Quick Paste Input State
  const [rawInput, setRawInput] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("WHATSAPP");
  const [channelInput, setChannelInput] = useState<string>("Universal Quick-Paste Bar");
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  // Channels Modal State
  const [isChannelModalOpen, setIsChannelModalOpen] = useState<boolean>(false);
  const [newPlatform, setNewPlatform] = useState<string>("TELEGRAM");
  const [newChannelName, setNewChannelName] = useState<string>("");
  const [newChannelHandle, setNewChannelHandle] = useState<string>("");
  const [newChannelLink, setNewChannelLink] = useState<string>("");
  const [addingChannel, setAddingChannel] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Trade Execution Modal State for One-Click Deploy
  const [deployModalOpen, setDeployModalOpen] = useState<boolean>(false);
  const [selectedDeploySignal, setSelectedDeploySignal] = useState<SignalItem | null>(null);

  // 1. Fetch Signals Feed
  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/signals/feed?limit=50${filterSource !== "ALL" ? `&source=${filterSource}` : ""}`);
      const data = await res.json();
      if (data && Array.isArray(data.signals)) {
        setSignals(data.signals);
      }
    } catch (e) {
      console.error("Failed to fetch signals", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Configured Channels
  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/signals/channels");
      const data = await res.json();
      if (data && Array.isArray(data.channels)) {
        setChannels(data.channels);
      }
    } catch (e) {
      console.error("Failed to fetch channels", e);
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchChannels();
    const interval = setInterval(fetchSignals, 6000);
    return () => clearInterval(interval);
  }, [filterSource]);

  // Handle Quick-Paste Submission
  const handleQuickPasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;

    try {
      setParsing(true);
      setParseSuccessMsg(null);
      const res = await fetch("/api/signals/parse-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawInput,
          source: selectedSource,
          channel_name: channelInput || "Universal Quick-Paste Bar"
        })
      });

      const data = await res.json();
      if (data && data.id) {
        setParseSuccessMsg(
          `✅ Signal Parsed & Audited! Asset: ${data.asset}, Direction: ${data.direction}, Status: ${data.trap_status}`
        );
        setRawInput("");
        fetchSignals();
        setTimeout(() => setParseSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error("Error parsing signal", err);
    } finally {
      setParsing(false);
    }
  };

  // Handle Adding Channel
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      setAddingChannel(true);
      await fetch("/api/signals/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          channel_name: newChannelName,
          channel_handle: newChannelHandle,
          channel_link: newChannelLink
        })
      });
      setNewChannelName("");
      setNewChannelHandle("");
      setNewChannelLink("");
      fetchChannels();
    } catch (err) {
      console.error("Failed to add channel", err);
    } finally {
      setAddingChannel(false);
    }
  };

  // Handle Deleting Channel
  const handleDeleteChannel = async (id: string) => {
    try {
      await fetch(`/api/signals/channels/${id}`, { method: "DELETE" });
      fetchChannels();
    } catch (err) {
      console.error("Failed to delete channel", err);
    }
  };

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(url);
    setTimeout(() => setCopiedWebhook(null), 2500);
  };

  const toggleReasons = (id: string) => {
    setExpandedReasons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openDeployModal = (sig: SignalItem) => {
    setSelectedDeploySignal(sig);
    setDeployModalOpen(true);
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source.toUpperCase()) {
      case "TELEGRAM":
        return "bg-[#0088cc]/15 text-[#0088cc] border-[#0088cc]/30";
      case "DISCORD":
        return "bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/30";
      case "TRADINGVIEW":
        return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
      case "TWITTER":
      case "X":
        return "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30";
      case "WHATSAPP":
        return "bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30";
      case "REDDIT":
        return "bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getTrapBadge = (status: string, score: number) => {
    if (status === "VERIFIED_ALPHA") {
      return (
        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>VERIFIED ALPHA ({score}/100)</span>
        </span>
      );
    } else if (status === "RETAIL_TRAP_SUSPECTED") {
      return (
        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>RETAIL TRAP ({score}/100)</span>
        </span>
      );
    } else {
      return (
        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
          <Flame className="w-3.5 h-3.5" />
          <span>HIGH VOLATILITY ({score}/100)</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#14161A] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-glass-inner">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#22D3EE]/20 to-[#8B5CF6]/20 border border-[#22D3EE]/30 text-[#22D3EE]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Multi-Source Signal Alpha & Trap Radar
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-semibold uppercase">
                  Zero Cost APIs
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingesting Telegram, Discord, WhatsApp, TradingView & X feeds — Pre-screened by 8-Agent Swarm against MT5 Depth & Macro Hazard Clocks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsChannelModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1B1E24] text-slate-200 border border-[rgba(255,255,255,0.12)] hover:border-[#22D3EE]/40 hover:text-[#22D3EE] transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Channels & Webhooks ({channels.length})</span>
          </button>

          <button
            onClick={fetchSignals}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1B1E24] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.08)] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Universal Quick-Paste Bar */}
      <div className="bg-[#14161A] border border-[#22D3EE]/30 rounded-2xl p-5 shadow-glow-cyan/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Universal Quick-Paste Bar (WhatsApp / Telegram / Discord / Instagram / X)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Roman Urdu / Emojis / Unformatted text supported
          </span>
        </div>

        <form onSubmit={handleQuickPasteSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Example: 'GOLD BUY NOW @ 2912 - 2915 SL: 2898 TP1: 2925 TP2: 2938 TP3: 2960 #XAUUSD Whale demand block confirmed...'"
                rows={2}
                className="w-full bg-[#0A0B0D] border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE] font-mono resize-none transition-all"
              />
            </div>

            <div className="flex flex-col justify-between gap-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-[#0A0B0D] border border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#22D3EE]"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="DISCORD">Discord</option>
                  <option value="TWITTER">X / Twitter</option>
                  <option value="TRADINGVIEW">TradingView</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="OTHER">Other VIP</option>
                </select>

                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="Channel / Sender"
                  className="bg-[#0A0B0D] border border-[rgba(255,255,255,0.12)] rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
                />
              </div>

              <button
                type="submit"
                disabled={parsing || !rawInput.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-cyan"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Auditing with Swarm...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-black fill-current" />
                    <span>Parse & Audit Signal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {parseSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <span>{parseSuccessMsg}</span>
              <button onClick={() => setParseSuccessMsg(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 3. Filter Nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {["ALL", "TELEGRAM", "DISCORD", "TRADINGVIEW", "TWITTER", "WHATSAPP"].map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterSource === src
                  ? "bg-[#22D3EE] text-black shadow-glow-cyan"
                  : "bg-[#14161A] text-slate-400 hover:text-white border border-[rgba(255,255,255,0.06)]"
              }`}
            >
              {src === "ALL" ? "All Sources" : src}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{signals.length}</span> verified signal alerts
        </div>
      </div>

      {/* 4. Signals Grid */}
      <div className="space-y-4">
        {signals.length === 0 ? (
          <div className="bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No signals found for this filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Paste a signal above or trigger a TradingView webhook to begin streaming.
            </p>
          </div>
        ) : (
          signals.map((sig) => {
            const isExpanded = !!expandedReasons[sig.id];
            const isTrap = sig.trap_status === "RETAIL_TRAP_SUSPECTED";
            const isVerified = sig.trap_status === "VERIFIED_ALPHA";

            return (
              <div
                key={sig.id}
                className={`bg-[#14161A] border rounded-2xl p-5 transition-all shadow-glass-inner ${
                  isTrap
                    ? "border-[#EF4444]/40 hover:border-[#EF4444]"
                    : isVerified
                    ? "border-[#10B981]/40 hover:border-[#10B981]"
                    : "border-[rgba(255,255,255,0.08)] hover:border-[#22D3EE]/30"
                }`}
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                    {/* Source Badge */}
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border font-mono ${getSourceBadgeColor(sig.source)}`}>
                      {sig.source}
                    </span>

                    {/* Channel / Handle */}
                    <span className="text-xs font-semibold text-white">
                      {sig.channel_name}
                    </span>

                    {/* Timestamp */}
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {sig.created_at}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getTrapBadge(sig.trap_status, sig.trap_score)}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      Swarm Conf: <strong className="text-white">{sig.swarm_confidence}%</strong>
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="py-4 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                  {/* Column 1: Asset & Direction */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                        sig.direction === "BUY"
                          ? "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40"
                          : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40"
                      }`}
                    >
                      {sig.direction === "BUY" ? (
                        <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base font-black text-white">{sig.asset}</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                            sig.direction === "BUY"
                              ? "bg-[#10B981]/20 text-[#10B981]"
                              : "bg-[#EF4444]/20 text-[#EF4444]"
                          }`}
                        >
                          {sig.direction}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        R:R <strong className="text-white">{sig.risk_reward}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Trade Execution Levels */}
                  <div className="lg:col-span-2 grid grid-cols-3 gap-2 text-xs font-mono bg-[#0A0B0D] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Entry Zone</span>
                      <span className="font-bold text-[#22D3EE]">
                        ${sig.entry_min.toLocaleString()}{sig.entry_max !== sig.entry_min ? ` - $${sig.entry_max.toLocaleString()}` : ""}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Stop Loss</span>
                      <span className="font-bold text-[#EF4444]">
                        ${sig.stop_loss.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Target(s)</span>
                      <span className="font-bold text-[#10B981]">
                        ${sig.take_profit_targets.length > 0 ? sig.take_profit_targets[0].toLocaleString() : "—"}
                        {sig.take_profit_targets.length > 1 && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (+{sig.take_profit_targets.length - 1})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Deploy Action */}
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openDeployModal(sig)}
                      className={`flex-1 lg:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-glass ${
                        isTrap
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                          : "bg-gradient-to-r from-[#10B981] to-[#22D3EE] text-black hover:opacity-90 shadow-glow-cyan"
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{isTrap ? "Audit & Deploy Anyway" : "Deploy Verified Signal"}</span>
                    </button>
                  </div>
                </div>

                {/* Audit Summary & Reasons Preview */}
                <div className="mt-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className="font-semibold text-slate-400">Swarm Verdict:</span>
                      <span className="font-mono text-xs">
                        {sig.trap_reasons && sig.trap_reasons.length > 0 ? sig.trap_reasons[0] : "Audit complete."}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleReasons(sig.id)}
                      className="text-[11px] text-[#22D3EE] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Hide Audit Breakdown" : "View Audit Breakdown"}</span>
                    </button>
                  </div>

                  {/* Expandable Detailed Reasons */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-[#0A0B0D] rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2 animate-fadeIn">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Multi-Agent Audit Telemetry & Trap Signals:
                      </div>
                      <ul className="space-y-1.5 text-xs font-mono">
                        {sig.trap_reasons.map((r, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-slate-500">•</span>
                            <span className={r.includes("🚨") || r.includes("🔴") ? "text-[#EF4444]" : r.includes("✅") ? "text-[#10B981]" : "text-slate-300"}>
                              {r}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Original text: "{sig.raw_text.slice(0, 100)}..."</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(sig.raw_text)}
                          className="hover:text-slate-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Raw
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Manage Channels & Webhooks Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161A] border border-[rgba(255,255,255,0.12)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#22D3EE]" />
                  External Signal Channels & Direct Webhooks
                </h3>
                <p className="text-xs text-slate-400">
                  Connect unlimited Telegram channels, Discord bots, and TradingView PineScript alerts for zero cost.
                </p>
              </div>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Webhook URLs Box */}
            <div className="bg-[#0A0B0D] p-4 rounded-xl border border-[#22D3EE]/20 space-y-2">
              <div className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Your Zero-Cost Webhook Endpoints</span>
              </div>
              <p className="text-xs text-slate-400">
                Configure your TradingView alerts or Telegram BotFather webhook to POST JSON alerts directly to:
              </p>
              <div className="flex items-center justify-between bg-[#14161A] p-2.5 rounded-lg border border-white/5 font-mono text-xs">
                <span className="text-slate-300">
                  http://localhost:8000/api/signals/webhook/tradingview
                </span>
                <button
                  onClick={() => handleCopyWebhook("http://localhost:8000/api/signals/webhook/tradingview")}
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30 transition-all"
                >
                  {copiedWebhook === "http://localhost:8000/api/signals/webhook/tradingview" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Add Channel Form */}
            <form onSubmit={handleAddChannel} className="space-y-3 bg-[#0A0B0D] p-4 rounded-xl border border-white/5">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Add New Signal Channel / Alpha Desk
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="bg-[#14161A] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="TELEGRAM">Telegram</option>
                  <option value="DISCORD">Discord</option>
                  <option value="TWITTER">X / Twitter</option>
                  <option value="TRADINGVIEW">TradingView</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>

                <input
                  type="text"
                  placeholder="Channel Name (e.g. VIP Forex Desk)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-[#14161A] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
                />

                <input
                  type="text"
                  placeholder="Handle (e.g. @forex_vip)"
                  value={newChannelHandle}
                  onChange={(e) => setNewChannelHandle(e.target.value)}
                  className="bg-[#14161A] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
                />

                <button
                  type="submit"
                  disabled={addingChannel || !newChannelName.trim()}
                  className="flex items-center justify-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#22D3EE] text-black hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Channel</span>
                </button>
              </div>
            </form>

            {/* Channels List Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Configured Providers & Historical Win Rates ({channels.length})
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0A0B0D] border border-white/5 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSourceBadgeColor(ch.platform)}`}>
                        {ch.platform}
                      </span>
                      <div>
                        <span className="font-bold text-white">{ch.channel_name}</span>
                        {ch.channel_handle && (
                          <span className="text-slate-500 ml-2">({ch.channel_handle})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-[11px] text-[#10B981] font-bold">
                          {ch.win_rate_pct > 0 ? `${ch.win_rate_pct}% WR` : "Calibrating..."}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {ch.total_signals} signals
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteChannel(ch.id)}
                        className="p-1.5 text-slate-500 hover:text-[#EF4444] transition-all"
                        title="Remove Channel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Deploy Trade Execution Modal */}
      {selectedDeploySignal && (
        <TradeExecutionModal
          isOpen={deployModalOpen}
          onClose={() => setDeployModalOpen(false)}
          defaultSymbol={selectedDeploySignal.asset}
          currentPrice={selectedDeploySignal.entry_min || 2915}
          defaultEntry={String(selectedDeploySignal.entry_min)}
          defaultSL={String(selectedDeploySignal.stop_loss)}
          defaultTP={String(selectedDeploySignal.take_profit_targets[0] || selectedDeploySignal.entry_min * 1.02)}
        />
      )}
    </div>
  );
};
