import React, { useState, useEffect } from "react";
import { RomanUrduCard } from "../components/ui";
import { FileText, Sparkles, Filter, RefreshCw } from "lucide-react";

interface ReportsScreenProps {
  onSelectAssetForAnalysis: (symbol: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onSelectAssetForAnalysis }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = () => {
      fetch("/api/reports/all")
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.reports)) {
            setReports(data.reports);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchReports();
    const interval = setInterval(fetchReports, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-[#14161A] border border-[rgba(255,255,255,0.08)] p-5 rounded-2xl shadow-glass-inner">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              EXECUTIVE INTELLIGENCE FEED
            </h2>
            <p className="text-xs text-slate-400">
              Instant scan grid of synthesized Roman Urdu reports across active commodities & crypto pairs.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3 py-1.5 rounded-xl">
          {reports.length} Active Dossiers
        </span>
      </div>

      {/* Grid of Roman Urdu Executive Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center space-y-2 animate-pulse">
          <Sparkles className="w-6 h-6 text-[#F59E0B] animate-spin" />
          <span>Aggregating Roman Urdu intelligence dossiers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep, idx) => (
            <div
              key={idx}
              className="cursor-pointer transition-transform hover:-translate-y-1 duration-200"
              onClick={() => onSelectAssetForAnalysis(rep.asset)}
            >
              <RomanUrduCard data={rep.roman_urdu_report} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;
