import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Eye,
  X,
  FileSpreadsheet
} from "lucide-react";

interface HistoryScreenProps {
  onOpenHistoricalAnalysis: (record: any) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onOpenHistoricalAnalysis }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAsset, setFilterAsset] = useState("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyFeedback, setVerifyFeedback] = useState<Record<string, string>>({});
  const [selectedInspectRecord, setSelectedInspectRecord] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/history?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.history)) {
          setHistory(d.history);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleVerifyOutcome = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingId(reportId);
    try {
      const res = await fetch(`/api/history/verify/${reportId}`, { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setVerifyFeedback((prev) => ({
          ...prev,
          [reportId]: `${data.outcome_status}: ${data.notes}`,
        }));
        // Update local item status
        setHistory((prev) =>
          prev.map((item) =>
            item.id === reportId
              ? { ...item, outcome_status: data.outcome_status, outcome_notes: data.notes }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExportJson = () => {
    window.open("/api/history-export", "_blank");
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/history-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonContent),
        });
        const result = await res.json();
        if (result.success) {
          setImportMessage(`Imported ${result.imported_analyses} reports and ${result.imported_trades} paper trades!`);
          fetchHistory();
        } else {
          setImportMessage(`Import error: ${result.error || "Failed"}`);
        }
      } catch (err: any) {
        setImportMessage(`Invalid JSON file: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const filtered = history.filter((h) => {
    if (filterAsset === "all") return true;
    return h.asset?.toLowerCase().includes(filterAsset.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HIT_TP":
        return (
          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>HIT TP (WIN)</span>
          </span>
        );
      case "HIT_SL":
        return (
          <span className="flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>HIT SL (LOSS)</span>
          </span>
        );
      case "ACTIVE_IN_PLAY":
        return (
          <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>ACTIVE (IN PLAY)</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
            PENDING CHECK
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#14161A] border border-[rgba(255,255,255,0.08)] p-5 rounded-2xl shadow-glass-inner">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center">
            <History className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-wide">
                PERSISTENT DECISION MEMORY & OUTCOME VERIFICATION
              </h2>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                SQLite WAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently archived institutional analyses. Verify live market moves (TP/SL) and export/import database backups.
            </p>
          </div>
        </div>

        {/* Action Controls: Export / Import / Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Button */}
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 bg-[#1B1E24] hover:bg-[#232730] border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            title="Download JSON Database Backup"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          {/* Import Button */}
          <label className="flex items-center gap-1.5 bg-[#1B1E24] hover:bg-[#232730] border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>{importing ? "Importing..." : "Import JSON"}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Asset Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0A0B0D] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-mono"
            >
              <option value="all">All Assets</option>
              <option value="XAUUSD">XAU/USD Gold</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="SOL">Solana (SOL)</option>
            </select>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>{importMessage}</span>
          <button onClick={() => setImportMessage(null)}>
            <X className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}

      {/* History Table */}
      <div className="bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-glass-inner">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span>Loading SQLite persistent decision database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No historical records match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#1B1E24]/50 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Decision</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Capital Sizing</th>
                  <th className="py-3.5 px-4">Outcome Status</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map((item, idx) => {
                  const reportId = item.id || item.task_id;
                  const feedback = verifyFeedback[reportId];
                  const fullObj = item.full_dossier || item;

                  return (
                    <tr
                      key={idx}
                      onClick={() => onOpenHistoricalAnalysis(fullObj)}
                      className="hover:bg-[#1B1E24]/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
                          <span className="font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                            {item.asset}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{item.timestamp}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                            item.final_decision === "BUY"
                              ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                              : item.final_decision === "SELL"
                              ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                              : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                          }`}
                        >
                          {item.final_decision}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{item.confidence}%</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.tailored_plan?.lot_size_str ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-400 font-bold">{item.tailored_plan.lot_size_str}</span>
                            <span className="text-[10px] text-slate-500">${item.user_capital?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Standard 2%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.outcome_status || "PENDING")}
                        {feedback && (
                          <span className="text-[10px] text-cyan-300 block mt-1 font-sans">
                            {feedback}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleVerifyOutcome(reportId, e)}
                          disabled={verifyingId === reportId}
                          className="flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${verifyingId === reportId ? "animate-spin" : ""}`} />
                          <span>Verify Market Move</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInspectRecord(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Inspect Full Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <ArrowRight className="w-4 h-4 text-[#22D3EE] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedInspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#14161A] border border-white/10 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-extrabold text-white uppercase">
                  Historical Intelligence Dossier: {selectedInspectRecord.asset} ({selectedInspectRecord.timestamp})
                </h3>
              </div>
              <button
                onClick={() => setSelectedInspectRecord(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verdict & Confidence */}
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-[#0A0B0D] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Consensus</span>
                <span className="text-sm font-bold text-emerald-400">{selectedInspectRecord.final_decision}</span>
              </div>
              <div className="bg-[#0A0B0D] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                <span className="text-sm font-bold text-white">{selectedInspectRecord.confidence}%</span>
              </div>
              <div className="bg-[#0A0B0D] p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase block">Outcome</span>
                <span className="text-sm font-bold text-amber-400">{selectedInspectRecord.outcome_status || "PENDING"}</span>
              </div>
            </div>

            {/* Roman Urdu Bottom-Line */}
            {selectedInspectRecord.roman_urdu_report?.simple_baat && (
              <div className="bg-[#0A0B0D] p-4 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold mb-1">
                  Roman Urdu Bottom-Line (Simple Baat):
                </span>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedInspectRecord.roman_urdu_report.simple_baat}
                </p>
              </div>
            )}

            {/* Tailored Plan Details */}
            {selectedInspectRecord.tailored_plan && (
              <div className="bg-[#0A0B0D] p-4 rounded-xl border border-white/5 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                  Tailored Sizing Specs:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Capital:</span>
                    <span className="text-white font-bold">${selectedInspectRecord.tailored_plan.user_capital?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Lot Size:</span>
                    <span className="text-cyan-300 font-bold">{selectedInspectRecord.tailored_plan.lot_size_str}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Max Loss:</span>
                    <span className="text-red-400 font-bold">-${selectedInspectRecord.tailored_plan.max_risk_usd?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">TP2 Gain:</span>
                    <span className="text-emerald-400 font-bold">+${selectedInspectRecord.tailored_plan.tp2_gain_usd?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onOpenHistoricalAnalysis(selectedInspectRecord.full_dossier || selectedInspectRecord);
                  setSelectedInspectRecord(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Open in Full Multi-Agent Arena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
