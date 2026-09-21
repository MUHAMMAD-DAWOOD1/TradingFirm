import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Search,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export interface AssetOption {
  symbol: string;
  name: string;
  category: "commodity" | "crypto" | "stablecoin";
  shariah_status?: "HALAL_COMPLIANT" | "GREY_AREA_MEME";
  price?: number;
  change24h?: number;
}

interface TopBarProps {
  assets: AssetOption[];
  selectedSymbol: string;
  onSelectAsset: (symbol: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  assets,
  selectedSymbol,
  onSelectAsset,
  onRunAnalysis,
  isAnalyzing = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "HALAL" | "MEME" | "METALS">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || {
    symbol: selectedSymbol,
    name: "Selected Asset",
    category: "crypto",
    shariah_status: "HALAL_COMPLIANT",
    price: 0,
    change24h: 0,
  };

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "HALAL") return a.shariah_status === "HALAL_COMPLIANT";
    if (activeTab === "MEME") return a.shariah_status === "GREY_AREA_MEME";
    if (activeTab === "METALS") return a.category === "commodity";
    return true;
  });

  const isHalal = selectedAsset.shariah_status !== "GREY_AREA_MEME";

  return (
    <header className="h-16 bg-[#14161A]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Asset Quick-Switch Dropdown with Halal/Meme Badges */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-3 bg-[#1B1E24] hover:bg-[#232730] border border-[rgba(255,255,255,0.1)] px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-glass-inner"
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedAsset.category === "commodity"
                  ? "bg-[#F59E0B]"
                  : isHalal
                  ? "bg-[#10B981]"
                  : "bg-[#EC4899]"
              }`}
            />
            <span className="font-mono text-sm tracking-wide">{selectedAsset.symbol}</span>
            <span className="text-slate-400 text-[11px] font-normal hidden sm:inline">
              ({selectedAsset.name})
            </span>

            {/* Shariah Badge */}
            {isHalal ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                <span>Halal</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>Meme/Grey</span>
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-[#14161A] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Input */}
            <div className="flex items-center space-x-2 bg-[#0A0B0D] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Halal, Meme, or Metals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1 bg-[#0A0B0D] p-1 rounded-xl mb-2 text-[10px] font-mono">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  activeTab === "ALL" ? "bg-[#22D3EE]/20 text-[#22D3EE] font-bold" : "text-slate-400"
                }`}
              >
                ALL ({assets.length})
              </button>
              <button
                onClick={() => setActiveTab("HALAL")}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  activeTab === "HALAL" ? "bg-[#10B981]/20 text-[#10B981] font-bold" : "text-slate-400"
                }`}
              >
                HALAL
              </button>
              <button
                onClick={() => setActiveTab("MEME")}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  activeTab === "MEME" ? "bg-[#EC4899]/20 text-[#EC4899] font-bold" : "text-slate-400"
                }`}
              >
                MEMES
              </button>
              <button
                onClick={() => setActiveTab("METALS")}
                className={`flex-1 py-1 rounded-lg transition-colors ${
                  activeTab === "METALS" ? "bg-[#F59E0B]/20 text-[#F59E0B] font-bold" : "text-slate-400"
                }`}
              >
                COMMODITIES
              </button>
            </div>

            {/* Assets Grid */}
            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {filtered.map((item) => {
                const itemIsHalal = item.shariah_status !== "GREY_AREA_MEME";
                return (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      onSelectAsset(item.symbol);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedSymbol === item.symbol
                        ? "bg-[#22D3EE]/15 text-[#22D3EE] font-bold"
                        : "text-slate-300 hover:bg-[#1B1E24]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono font-bold">{item.symbol}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {itemIsHalal ? (
                        <span className="text-[9px] font-mono text-[#10B981] bg-[#10B981]/10 px-1 py-0.5 rounded">
                          Halal
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[#EC4899] bg-[#EC4899]/10 px-1 py-0.5 rounded">
                          Meme
                        </span>
                      )}
                      {item.price ? (
                        <span className="font-mono text-slate-300 text-xs">
                          ${item.price > 1000 ? Math.round(item.price) : item.price}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Middle: Live Ticker Strip */}
      <div className="hidden lg:flex items-center space-x-4 bg-[#0A0B0D] border border-[rgba(255,255,255,0.06)] px-4 py-1.5 rounded-xl font-mono text-xs">
        {assets.slice(0, 5).map((a) => (
          <div
            key={a.symbol}
            className="flex items-center space-x-1.5 cursor-pointer hover:text-white"
            onClick={() => onSelectAsset(a.symbol)}
          >
            <span className="text-slate-400 font-semibold">{a.symbol}</span>
            <span className="text-white">${a.price || "--"}</span>
            <span
              className={`flex items-center text-[10px] ${
                (a.change24h || 0) >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {(a.change24h || 0) >= 0 ? "+" : ""}
              {a.change24h || 0}%
            </span>
          </div>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] hover:from-[#06b6d4] hover:to-[#7c3aed] text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-glow-cyan disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isAnalyzing ? "Analyzing..." : "RUN ANALYSIS"}</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
