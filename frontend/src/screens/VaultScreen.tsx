import React, { useState, useEffect } from "react";

interface DecisionRecord {
  id: string;
  task_id?: string;
  asset: string;
  direction?: string;
  final_decision?: string;
  confidence: number;
  risk_level: string;
  user_capital?: number;
  risk_pct?: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  timestamp: string;
  outcome_status: "PENDING" | "PASSED" | "FAILED" | "ACTIVE_IN_PLAY" | "BREAKEVEN" | "WIN" | "LOSS";
  actual_exit_price?: number;
  outcome_notes?: string;
  flaw_analysis_urdu?: string;
  self_learning_lesson_urdu?: string;
  ai_accuracy_score?: number;
  verified_by?: "AI_AUTO" | "MANUAL_USER" | "UNVERIFIED";
  verified_at?: string;
  pnl_amount?: number;
  pnl_percent?: number;
  roman_urdu_report?: any;
  tailored_plan?: any;
  agent_detailed_reports?: any;
  full_dossier?: any;
}

interface VaultMetrics {
  total_analyses: number;
  evaluated_analyses: number;
  passed_count: number;
  failed_count: number;
  breakeven_count: number;
  pending_count: number;
  average_win_rate: number;
  total_pnl_usd: number;
  self_learning_score: number;
  self_learning_badge_urdu: string;
  top_flaws_breakdown: Array<{ flaw: string; count: number; percentage: number }>;
  recent_lessons: Array<{ asset: string; decision: string; status: string; lesson: string }>;
}

interface VaultScreenProps {
  isDark: boolean;
  onViewReport?: (report: any) => void;
  activeAccount?: any;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({ isDark, onViewReport, activeAccount }) => {
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [metrics, setMetrics] = useState<VaultMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [assetFilter, setAssetFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Manual Verification Modal State
  const [verifyModalItem, setVerifyModalItem] = useState<DecisionRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<"PASSED" | "FAILED" | "BREAKEVEN">("PASSED");
  const [modalExitPrice, setModalExitPrice] = useState<string>("");
  const [modalPnlUsd, setModalPnlUsd] = useState<string>("");
  const [modalPnlPct, setModalPnlPct] = useState<string>("");
  const [modalUserNotes, setModalUserNotes] = useState<string>("");
  const [savingManualVerify, setSavingManualVerify] = useState(false);

  // Drawer for full flaw & lesson inspection
  const [inspectRecord, setInspectRecord] = useState<DecisionRecord | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchVaultData = () => {
    setLoading(true);
    fetch("/api/history?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.history)) {
          setHistory(d.history);
        }
        if (d && d.metrics) {
          setMetrics(d.metrics);
        }
      })
      .catch((err) => console.error("Error fetching vault:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Single record AI Audit
  const handleSingleAiAudit = async (rec: DecisionRecord) => {
    setVerifyingId(rec.id);
    try {
      const res = await fetch(`/api/history/verify/${rec.id}`, { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        showToast(
          `AI Audit for #${rec.id.slice(0, 8)}: ${data.outcome_status} (${data.notes || ""})`,
          data.outcome_status === "PASSED" ? "success" : "info"
        );
        fetchVaultData();
      } else {
        showToast(`Audit could not be completed: ${data.error || "Unknown error"}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error during AI audit.", "error");
    } finally {
      setVerifyingId(null);
    }
  };

  // Open Manual Verification Modal
  const openManualVerifyModal = (rec: DecisionRecord) => {
    setVerifyModalItem(rec);
    const initialStatus = (rec.outcome_status === "FAILED" || rec.outcome_status === "LOSS") ? "FAILED" : "PASSED";
    setModalStatus(initialStatus);
    setModalExitPrice(rec.actual_exit_price ? String(rec.actual_exit_price) : String(initialStatus === "PASSED" ? rec.take_profit : rec.stop_loss));
    setModalPnlUsd(rec.pnl_amount ? String(rec.pnl_amount) : (initialStatus === "PASSED" ? "300.00" : "-200.00"));
    setModalPnlPct(rec.pnl_percent ? String(rec.pnl_percent) : (initialStatus === "PASSED" ? "3.0" : "-2.0"));
    setModalUserNotes(rec.outcome_notes || "");
  };

  // Submit Manual Verification
  const submitManualVerify = async () => {
    if (!verifyModalItem) return;
    setSavingManualVerify(true);
    try {
      const payload = {
        status: modalStatus,
        exit_price: parseFloat(modalExitPrice) || verifyModalItem.entry_price,
        pnl_amount: parseFloat(modalPnlUsd) || 0.0,
        pnl_percent: parseFloat(modalPnlPct) || 0.0,
        user_notes: modalUserNotes
      };
      const res = await fetch(`/api/history/manual-verify/${verifyModalItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(`Manual outcome verified for #${verifyModalItem.id.slice(0, 8)} as ${modalStatus}!`, "success");
        setVerifyModalItem(null);
        fetchVaultData();
      } else {
        showToast("Error updating manual verification.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to save verification.", "error");
    } finally {
      setSavingManualVerify(false);
    }
  };

  // Filtered History
  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.asset?.toLowerCase().includes(q) ||
      (item.direction || item.final_decision)?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q) ||
      item.flaw_analysis_urdu?.toLowerCase().includes(q) ||
      item.self_learning_lesson_urdu?.toLowerCase().includes(q);

    const st = (item.outcome_status || "PENDING").toUpperCase();
    let matchesStatus = true;
    if (statusFilter === "PASSED") {
      matchesStatus = st === "PASSED" || st === "HIT_TP" || st === "WIN";
    } else if (statusFilter === "FAILED") {
      matchesStatus = st === "FAILED" || st === "HIT_SL" || st === "LOSS";
    } else if (statusFilter === "ACTIVE") {
      matchesStatus = st === "PENDING" || st === "ACTIVE_IN_PLAY" || st === "ACTIVE_MONITORING";
    }

    let matchesAsset = true;
    if (assetFilter !== "ALL") {
      matchesAsset = item.asset?.toUpperCase() === assetFilter.toUpperCase();
    }

    return matchesSearch && matchesStatus && matchesAsset;
  });

  const uniqueAssets = Array.from(new Set(history.map((h) => h.asset?.toUpperCase()).filter(Boolean)));

  return (
    <main className="max-w-[1520px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6 font-sans">
      {/* Top Header & Global Actions */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[30px]">lock</span>
              <span>Vault &amp; Audit Archive</span>
            </h1>
          </div>
          <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium mt-1">
            Tamam analyses aur executed decisions ka immutable record.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Refresh Vault Data */}
          <button
            onClick={fetchVaultData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 shadow-sm text-slate-900 dark:text-white px-4 py-2 rounded-full text-[13px] font-black hover:border-slate-500 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>

          {/* Export JSON */}
          <a
            href="/api/history-export"
            download
            className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 shadow-sm text-slate-900 dark:text-white px-4 py-2 rounded-full text-[13px] font-black hover:border-slate-500 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Archive</span>
          </a>
        </div>
      </section>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-[13px] font-black flex items-center justify-between gap-3 animate-fade-in border-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-100 border-emerald-500 text-emerald-950 dark:bg-emerald-950/80 dark:border-emerald-500 dark:text-emerald-200"
              : toastMessage.type === "error"
              ? "bg-rose-100 border-rose-500 text-rose-950 dark:bg-rose-950/80 dark:border-rose-500 dark:text-rose-200"
              : "bg-blue-100 border-blue-500 text-blue-950 dark:bg-blue-950/80 dark:border-blue-500 dark:text-blue-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">
              {toastMessage.type === "success" ? "check_circle" : "info"}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-[16px] font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Genuine Quant Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Analyses */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Total Analyses
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-black text-slate-950 dark:text-white">
              {metrics?.total_analyses ?? history.length}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Logged</span>
          </div>
        </div>

        {/* Metric 2: Evaluated Trades */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Evaluated
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-black text-slate-950 dark:text-white">
              {metrics?.evaluated_analyses ?? 0}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Trades</span>
          </div>
        </div>

        {/* Metric 3: Wins vs Losses */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Wins / Losses
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[24px] font-black text-emerald-700 dark:text-emerald-400">
              {metrics?.passed_count ?? 0}
            </span>
            <span className="text-[14px] text-slate-400">/</span>
            <span className="text-[24px] font-black text-rose-700 dark:text-rose-400">
              {metrics?.failed_count ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 font-bold ml-auto">
              ({metrics?.pending_count ?? 0} In-Play)
            </span>
          </div>
        </div>

        {/* Metric 4: Win Rate */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Verified Win Rate
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-[26px] font-black ${
                (metrics?.average_win_rate ?? 0) >= 50
                  ? "text-emerald-700 dark:text-emerald-400"
                  : (metrics?.evaluated_analyses ?? 0) === 0
                  ? "text-slate-900 dark:text-white"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {(metrics?.average_win_rate ?? 0).toFixed(1)}%
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {(metrics?.evaluated_analyses ?? 0) === 0 ? "No Trades" : "Realized"}
            </span>
          </div>
        </div>

        {/* Metric 5: Realized PnL */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Realized PnL
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-[24px] font-black ${
                (metrics?.total_pnl_usd ?? 0) >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {(metrics?.total_pnl_usd ?? 0) >= 0 ? "+" : ""}${(metrics?.total_pnl_usd ?? 0).toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-slate-500">USD</span>
          </div>
        </div>

        {/* Metric 6: Learned Directives Memory */}
        <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            AI Memory Rules
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-black text-cyan-700 dark:text-cyan-400">
              {metrics?.recent_lessons?.length ?? 0}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Directives</span>
          </div>
        </div>
      </div>

      {/* Main Archival Records Table Module */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col gap-6">
        {/* Filters, Asset Selector & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-1 rounded-full border-2 border-slate-200 dark:border-neutral-700 text-[12px] font-black">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  statusFilter === "ALL" ? "bg-slate-950 text-white dark:bg-white dark:text-neutral-950 shadow" : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setStatusFilter("PASSED")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  statusFilter === "PASSED" ? "bg-emerald-700 text-white shadow" : "text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                ✓ Passed (Wins)
              </button>
              <button
                onClick={() => setStatusFilter("FAILED")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  statusFilter === "FAILED" ? "bg-rose-700 text-white shadow" : "text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                ✗ Failed (Losses)
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  statusFilter === "ACTIVE" ? "bg-amber-600 text-white shadow" : "text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                ⏳ Active In-Play
              </button>
            </div>

            {/* Asset Dropdown Filter */}
            <div className="relative">
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-full px-3 py-1.5 text-[12px] font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Assets</option>
                {uniqueAssets.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center bg-slate-50 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-full px-4 py-2 w-full lg:w-80">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[19px] mr-2">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset, direction, flaw, ID..."
              className="bg-transparent border-0 p-0 text-slate-950 dark:text-white placeholder:text-slate-500 text-[13px] font-medium focus:outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-950 text-[12px] ml-1 font-bold">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-16 text-center text-slate-600 dark:text-slate-400 text-[13px] font-semibold">
              <span className="material-symbols-outlined text-[40px] text-slate-400 mb-2 block">folder_open</span>
              No archived decisions match your query or filter criteria.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-neutral-800/90 border-b-2 border-slate-300 dark:border-neutral-700 font-sans text-[11px] uppercase tracking-wider text-slate-900 dark:text-white font-black">
                  <th className="py-3 px-3">Record ID / Time</th>
                  <th className="py-3 px-3">Asset &amp; Stance</th>
                  <th className="py-3 px-3">Conviction</th>
                  <th className="py-3 px-3">Entry Zone</th>
                  <th className="py-3 px-3">SL / TP Targets</th>
                  <th className="py-3 px-3">Outcome Status</th>
                  <th className="py-3 px-3">Verified By</th>
                  <th className="py-3 px-3">Self-Learning Lesson</th>
                  <th className="py-3 px-3 text-right">Audit &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 font-mono text-[12px]">
                {filteredHistory.map((rec) => {
                  const direction = (rec.direction || rec.final_decision || "WAIT").toUpperCase();
                  const isBuy = direction === "BUY";
                  const isSell = direction === "SELL";
                  const status = (rec.outcome_status || "PENDING").toUpperCase();
                  const isPassed = status === "PASSED" || status === "HIT_TP" || status === "WIN";
                  const isFailed = status === "FAILED" || status === "HIT_SL" || status === "LOSS";
                  const isActive = status === "PENDING" || status === "ACTIVE_IN_PLAY" || status === "ACTIVE_MONITORING";

                  const pnlAmt = rec.pnl_amount ?? 0;
                  const pnlPct = rec.pnl_percent ?? 0;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors">
                      {/* ID & Timestamp */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-slate-900 dark:text-white block font-mono">
                          #{rec.id.slice(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans block mt-0.5 font-medium">
                          {rec.timestamp}
                        </span>
                      </td>

                      {/* Asset & Direction */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-950 dark:text-white text-[13px]">{rec.asset}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                              isBuy
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-400"
                                : isSell
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-400"
                                : "bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-300 border-slate-400"
                            }`}
                          >
                            {direction}
                          </span>
                        </div>
                      </td>

                      {/* Confidence & Risk */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-slate-950 dark:text-white">{rec.confidence || 80}%</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-sans font-bold">
                          {rec.risk_level || "Medium"} Risk
                        </span>
                      </td>

                      {/* Entry Price */}
                      <td className="py-3.5 px-3 text-slate-950 dark:text-white font-black">
                        ${typeof rec.entry_price === "number" ? rec.entry_price.toFixed(2) : rec.entry_price}
                      </td>

                      {/* SL / TP */}
                      <td className="py-3.5 px-3 text-[11px]">
                        <span className="text-rose-800 dark:text-rose-300 font-black block bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                          SL: ${typeof rec.stop_loss === "number" ? rec.stop_loss.toFixed(2) : rec.stop_loss}
                        </span>
                        <span className="text-emerald-800 dark:text-emerald-300 font-black block mt-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                          TP: ${typeof rec.take_profit === "number" ? rec.take_profit.toFixed(2) : rec.take_profit}
                        </span>
                      </td>

                      {/* Outcome Status & PnL */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1 ${
                            isPassed
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-500"
                              : isFailed
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-2 border-rose-500"
                              : isActive
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-2 border-amber-500"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 border-2 border-blue-500"
                          }`}
                        >
                          {isPassed ? "✓ PASSED" : isFailed ? "✗ FAILED" : isActive ? "⏳ IN PLAY" : "⚖️ BREAKEVEN"}
                        </span>
                        {(pnlAmt !== 0 || pnlPct !== 0) && (
                          <span
                            className={`block text-[11px] font-black mt-1 ${
                              pnlAmt >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {pnlAmt >= 0 ? "+" : ""}${pnlAmt.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct}%)
                          </span>
                        )}
                      </td>

                      {/* Verified By */}
                      <td className="py-3.5 px-3 text-[11px] font-sans">
                        {rec.verified_by === "AI_AUTO" ? (
                          <span className="inline-flex items-center gap-1 text-cyan-950 dark:text-cyan-200 font-black bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-400">
                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                            <span>AI Auto</span>
                          </span>
                        ) : rec.verified_by === "MANUAL_USER" ? (
                          <span className="inline-flex items-center gap-1 text-purple-950 dark:text-purple-200 font-black bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-400">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            <span>User Manual</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 italic font-semibold">Pending Audit</span>
                        )}
                      </td>

                      {/* Self-Learning / Flaw Snippet */}
                      <td className="py-3.5 px-3 max-w-xs font-sans">
                        {rec.self_learning_lesson_urdu || rec.flaw_analysis_urdu ? (
                          <div
                            onClick={() => setInspectRecord(rec)}
                            className="cursor-pointer group hover:opacity-80 transition-opacity"
                          >
                            <p className="text-[12px] text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-medium">
                              {rec.self_learning_lesson_urdu || rec.flaw_analysis_urdu}
                            </p>
                            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-black group-hover:underline mt-0.5 inline-block">
                              Inspect Lesson &amp; Flaws &rarr;
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No flaws evaluated yet</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Manual Verify Modal Trigger */}
                          <button
                            onClick={() => openManualVerifyModal(rec)}
                            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 hover:border-emerald-600 dark:hover:border-emerald-500 text-[11px] font-black text-slate-900 dark:text-white transition-all active:scale-95 cursor-pointer shadow-sm hover:text-emerald-700 dark:hover:text-emerald-400"
                            title="Manually verify or override trade outcome"
                          >
                            Verify Outcome
                          </button>

                          {/* AI Instant Audit */}
                          <button
                            onClick={() => handleSingleAiAudit(rec)}
                            disabled={verifyingId === rec.id}
                            className="px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-400 hover:border-cyan-600 text-[11px] font-black text-cyan-950 dark:text-cyan-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Run AI Auto-Audit against live/historical price"
                          >
                            {verifyingId === rec.id ? "Auditing..." : "🤖 AI Audit"}
                          </button>

                          {/* Inspect Dossier */}
                          <button
                            onClick={() => setInspectRecord(rec)}
                            className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="View Full Dossier"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Verification Modal */}
      {verifyModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-slate-300 dark:border-neutral-700 rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl animate-scale-up flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 dark:border-neutral-800">
              <div>
                <h3 className="text-[18px] font-black text-slate-950 dark:text-white">
                  Manual Outcome Verification
                </h3>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                  Record #{verifyModalItem.id.slice(0, 8)} &bull; {verifyModalItem.asset} (
                  {verifyModalItem.direction || verifyModalItem.final_decision})
                </p>
              </div>
              <button
                onClick={() => setVerifyModalItem(null)}
                className="text-slate-500 hover:text-slate-950 dark:hover:text-white text-[20px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Summary Reference */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-neutral-800 p-3 rounded-2xl text-[12px] font-mono border border-slate-200 dark:border-neutral-700">
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Entry</span>
                <span className="font-black text-slate-950 dark:text-white">${verifyModalItem.entry_price}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Stop-Loss</span>
                <span className="font-black text-rose-700 dark:text-rose-400">${verifyModalItem.stop_loss}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Take-Profit</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">${verifyModalItem.take_profit}</span>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="text-[12px] font-black text-slate-900 dark:text-white block mb-2">
                Outcome Verdict (Decision Sahi Tha Ya Galat?)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalStatus("PASSED")}
                  className={`py-2 px-3 rounded-xl text-[12px] font-black border-2 transition-all cursor-pointer ${
                    modalStatus === "PASSED"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20"
                      : "bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:text-slate-950"
                  }`}
                >
                  ✓ PASSED (TP Hit)
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatus("FAILED")}
                  className={`py-2 px-3 rounded-xl text-[12px] font-black border-2 transition-all cursor-pointer ${
                    modalStatus === "FAILED"
                      ? "bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-700/20"
                      : "bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:text-slate-950"
                  }`}
                >
                  ✗ FAILED (SL Hit)
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatus("BREAKEVEN")}
                  className={`py-2 px-3 rounded-xl text-[12px] font-black border-2 transition-all cursor-pointer ${
                    modalStatus === "BREAKEVEN"
                      ? "bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-700/20"
                      : "bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 hover:text-slate-950"
                  }`}
                >
                  ⚖️ BREAKEVEN
                </button>
              </div>
            </div>

            {/* Price & PnL Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Actual Exit Price ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalExitPrice}
                  onChange={(e) => setModalExitPrice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-[12px] font-mono font-bold text-slate-950 dark:text-white focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  PnL ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalPnlUsd}
                  onChange={(e) => setModalPnlUsd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-[12px] font-mono font-bold text-slate-950 dark:text-white focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Return (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={modalPnlPct}
                  onChange={(e) => setModalPnlPct(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-[12px] font-mono font-bold text-slate-950 dark:text-white focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            {/* User Lessons & Notes Textarea */}
            <div>
              <label className="text-[12px] font-black text-slate-900 dark:text-white block mb-1">
                Aapka Feedback / Lessons (Self-Learning Notes)
              </label>
              <textarea
                rows={3}
                value={modalUserNotes}
                onChange={(e) => setModalUserNotes(e.target.value)}
                placeholder="Misal ke tor par: Maine yahan resistance zone par trailing stop use kiya aur $250 profit book kiya..."
                className="w-full bg-slate-50 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 rounded-xl p-3 text-[12px] text-slate-950 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-cyan-600"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalItem(null)}
                className="px-4 py-2 rounded-full text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitManualVerify}
                disabled={savingManualVerify}
                className="px-6 py-2 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-[12px] shadow-lg shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingManualVerify ? "Saving..." : "Confirm & Save Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Record & Lessons Drawer */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-slate-300 dark:border-neutral-700 rounded-3xl p-6 lg:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-up flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[20px] text-slate-950 dark:text-white">{inspectRecord.asset}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      (inspectRecord.direction || inspectRecord.final_decision) === "BUY"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-400"
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-400"
                    }`}
                  >
                    {inspectRecord.direction || inspectRecord.final_decision}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      inspectRecord.outcome_status === "PASSED"
                        ? "bg-emerald-700 text-white"
                        : inspectRecord.outcome_status === "FAILED"
                        ? "bg-rose-700 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {inspectRecord.outcome_status}
                  </span>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                  Record ID: #{inspectRecord.id} &bull; Time: {inspectRecord.timestamp}
                </p>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="text-slate-500 hover:text-slate-950 dark:hover:text-white text-[20px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Trade Parameters Grid */}
            <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-neutral-800 p-4 rounded-2xl text-[12px] font-mono border border-slate-200 dark:border-neutral-700">
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Entry Zone</span>
                <span className="font-black text-slate-950 dark:text-white">${inspectRecord.entry_price}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Stop Loss</span>
                <span className="font-black text-rose-700 dark:text-rose-400">${inspectRecord.stop_loss}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Take Profit</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">${inspectRecord.take_profit}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] block uppercase font-bold">Exit Price / PnL</span>
                <span className="font-black text-slate-950 dark:text-white">
                  ${inspectRecord.actual_exit_price || "—"} ({inspectRecord.pnl_percent || 0}%)
                </span>
              </div>
            </div>

            {/* Flaw Analysis in Roman Urdu */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-black text-[13px]">
                <span className="material-symbols-outlined text-[20px]">bug_report</span>
                <span>Flaw Diagnostics (Kya Kharabi Hui Ya Decision Kaise Raha?)</span>
              </div>
              <p className="text-[13px] text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                {inspectRecord.flaw_analysis_urdu || inspectRecord.outcome_notes || "Flaw analysis not yet logged."}
              </p>
            </div>

            {/* Self-Learning Directive in Roman Urdu */}
            <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-300 dark:border-cyan-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-cyan-950 dark:text-cyan-200 font-black text-[13px]">
                <span className="material-symbols-outlined text-[20px]">school</span>
                <span>AI Self-Learning Directive (Aainda Ke Liye Sabak)</span>
              </div>
              <p className="text-[13px] text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                {inspectRecord.self_learning_lesson_urdu ||
                  "Aainda volatile market conditions mein risk management rules ko strictly follow karein."}
              </p>
            </div>

            {/* General Report or Tailored Plan preview if available */}
            {inspectRecord.roman_urdu_report && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border-2 border-slate-200 dark:border-neutral-700 flex flex-col gap-1.5 text-[12px]">
                <span className="font-black text-slate-950 dark:text-white">Original Analytical Thesis Summary:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
                  {typeof inspectRecord.roman_urdu_report === "string"
                    ? inspectRecord.roman_urdu_report
                    : JSON.stringify(inspectRecord.roman_urdu_report, null, 2)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setInspectRecord(null);
                  openManualVerifyModal(inspectRecord);
                }}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 dark:border-neutral-700 hover:border-emerald-600 text-slate-900 dark:text-white font-black text-[12px] cursor-pointer"
              >
                Edit Outcome Verification
              </button>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="px-6 py-2 rounded-full bg-white dark:bg-neutral-900 border-2 border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white font-black text-[12px] hover:border-slate-500 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
