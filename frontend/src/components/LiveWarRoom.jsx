import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, 
  ArrowLeft, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Activity, 
  MessageSquare, 
  FileText,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

export default function LiveWarRoom({ ticker, onBack }) {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ status: "running", progress: 5, current_stage: "Initializing" });
  const [latestResult, setLatestResult] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);

  // Poll live events
  useEffect(() => {
    const fetchStream = () => {
      fetch(`/api/analyze/stream/${ticker}`)
        .then(res => res.json())
        .then(data => {
          if (data.logs) setLogs(data.logs);
          if (data.status) setStatus(data.status);
          if (data.latest) setLatestResult(data.latest);
        })
        .catch(err => console.error("Stream error:", err));
    };

    fetchStream();
    const interval = setInterval(fetchStream, 1500);
    return () => clearInterval(interval);
  }, [ticker]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (activeTab === "all") return true;
    if (activeTab === "debates") return log.stage === "debate" || log.stage === "risk";
    if (activeTab === "analysts") return log.stage === "analyst";
    if (activeTab === "decisions") return log.stage === "portfolio" || log.stage === "trader" || log.stage === "urdu";
    return true;
  });

  const urduReport = latestResult?.roman_urdu_report;
  const isFinished = status.status === "completed";

  const handleCopy = () => {
    if (!latestResult) return;
    const fullText = logs.map(l => `[${l.timestamp}] [${l.stage.toUpperCase()}] ${l.title}\n${l.content}\n`).join("\n---\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-[#1E2536] bg-[#0E131F]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="flex items-center space-x-1.5 bg-[#171E2E] hover:bg-[#232D42] text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#26324B] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Market</span>
          </button>

          <div className="h-6 w-px bg-[#1E2536]" />

          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white tracking-wider">INTELLIGENCE WAR ROOM</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/20">
              {ticker}
            </span>
          </div>
        </div>

        {/* Engine Status Indicator */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isFinished ? "bg-emerald-400" : status.status === "failed" ? "bg-rose-500" : "bg-cyan-400 animate-ping"
            }`} />
            <span className="text-xs font-mono font-medium text-slate-300">
              {status.current_stage || "Processing"}
            </span>
          </div>

          <div className="w-36 bg-[#171E2E] rounded-full h-2 overflow-hidden border border-[#26324B]">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-violet-500 h-full transition-all duration-500" 
              style={{ width: `${status.progress || 10}%` }}
            />
          </div>

          <button 
            onClick={handleCopy}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-[#171E2E] px-2.5 py-1.5 rounded-lg border border-[#26324B]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Log"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Left Stream Terminal (8 Cols), Right Decision Board (4 Cols) */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1750px] w-full mx-auto">
        
        {/* Left Column: Live Multi-Agent Stream & Transcripts */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-4">
          
          {/* Navigation Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-[#1E2536] pb-3">
            {[
              { id: "all", label: "All Events & Speeches", count: logs.length },
              { id: "analysts", label: "Analyst Reports", icon: FileText },
              { id: "debates", label: "Bull vs Bear & Risk Debate", icon: MessageSquare },
              { id: "decisions", label: "Final Decisions", icon: CheckCircle2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === tab.id
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm"
                    : "bg-[#111726] border border-transparent text-slate-400 hover:border-[#232D42] hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Real-Time Speech Stream Box */}
          <div className="flex-1 bg-[#0A0E18] border border-[#1E2536] rounded-2xl p-5 overflow-y-auto max-h-[750px] space-y-4 shadow-2xl relative font-mono">
            {filteredLogs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Sparkles className="w-6 h-6 animate-spin text-cyan-500" />
                <span className="text-xs">Agents are assembling and ingesting live market memory...</span>
              </div>
            ) : (
              filteredLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`rounded-xl p-4 border transition-all ${
                    log.stage === "debate" && log.title.includes("Bull")
                      ? "bg-[#061A14] border-emerald-500/30 text-emerald-100"
                      : log.stage === "debate" && log.title.includes("Bear")
                      ? "bg-[#1A0A0E] border-rose-500/30 text-rose-100"
                      : log.stage === "risk"
                      ? "bg-[#161208] border-amber-500/30 text-amber-100"
                      : log.stage === "portfolio"
                      ? "bg-[#120B20] border-violet-500/40 text-violet-100"
                      : log.stage === "urdu"
                      ? "bg-gradient-to-r from-cyan-950/40 to-slate-900 border-cyan-500/40 text-cyan-100"
                      : "bg-[#111624] border-[#1E2536] text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/10 text-white">
                        {log.stage}
                      </span>
                      <h4 className="text-xs font-bold text-white tracking-wide">{log.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </span>
                  </div>

                  {/* Body Content with formatting */}
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
                    {log.content}
                  </div>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Right Column: Final Decision & Roman Urdu Climax */}
        <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
          
          {/* Roman Urdu Report Box (Always visible / live populated) */}
          <div className="bg-[#0E1322] border border-[#26324B] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-cyan-400 border-b border-[#26324B] pb-3 mb-4">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Roman Urdu Intelligence Report</h3>
            </div>

            {urduReport ? (
              <div className="space-y-4">
                {/* Big Action Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#171E30] border border-[#2A3754]">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Final Decision</span>
                    <span className={`text-xl font-black ${
                      urduReport.action?.includes("BUY") ? "text-emerald-400" : urduReport.action?.includes("SELL") ? "text-rose-400" : "text-amber-400"
                    }`}>
                      {urduReport.action}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Confidence</span>
                    <span className="text-xl font-mono font-bold text-cyan-400">{urduReport.confidence_score}%</span>
                  </div>
                </div>

                {/* Simple Baat Highlight */}
                <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 p-3.5 rounded-xl">
                  <span className="text-xs font-bold text-cyan-400 block mb-1">
                    ⚡ Simple baat (Bottom Line):
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {urduReport.simple_baat}
                  </p>
                </div>

                {/* Technical Urdu */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Technical Summary:</span>
                  <p className="text-xs text-slate-300 mt-1 bg-[#151B2B] p-2.5 rounded-lg border border-[#232D42] leading-relaxed">
                    {urduReport.technical_summary}
                  </p>
                </div>

                {/* Macro Urdu */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Macro Context:</span>
                  <p className="text-xs text-slate-300 mt-1 bg-[#151B2B] p-2.5 rounded-lg border border-[#232D42] leading-relaxed">
                    {urduReport.macro_summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-600 animate-pulse mb-2" />
                <span>Generating synthesis... Complete Urdu report will appear here once agents conclude.</span>
              </div>
            )}
          </div>

          {/* Portfolio Manager Final Institutional Verdict */}
          {latestResult?.full_state?.portfolio_decision && (
            <div className="bg-[#0E1322] border border-violet-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center space-x-2 text-violet-400 border-b border-[#26324B] pb-3 mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Portfolio Manager Verdict</h3>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {latestResult.full_state.portfolio_decision}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
