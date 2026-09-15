import React, { useState } from "react";
import { ArrowUpDown, ArrowUpRight, ArrowDownRight, ShieldCheck, AlertTriangle } from "lucide-react";

export interface AssetTableRow {
  symbol: string;
  name: string;
  category: string;
  shariah_status?: string;
  price: number;
  change24h: number;
  volume24h: string;
  status: "BUY" | "SELL" | "WAIT";
  confidence: number;
}

interface DataTableProps {
  data: AssetTableRow[];
  onSelectRow?: (symbol: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, onSelectRow }) => {
  const [sortField, setSortField] = useState<keyof AssetTableRow>("confidence");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "HALAL" | "MEME">("ALL");

  const handleSort = (field: keyof AssetTableRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredData = data.filter((row) => {
    if (filterTab === "HALAL") return row.shariah_status !== "GREY_AREA_MEME";
    if (filterTab === "MEME") return row.shariah_status === "GREY_AREA_MEME";
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  return (
    <div className="bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-glass-inner">
      {/* Shariah Filter Switcher Header */}
      <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0A0B0D]/50">
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === "ALL"
                ? "bg-[#22D3EE]/15 text-[#22D3EE] font-bold border border-[#22D3EE]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Universe ({data.length})
          </button>
          <button
            onClick={() => setFilterTab("HALAL")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all ${
              filterTab === "HALAL"
                ? "bg-[#10B981]/15 text-[#10B981] font-bold border border-[#10B981]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Halal Verified</span>
          </button>
          <button
            onClick={() => setFilterTab("MEME")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition-all ${
              filterTab === "MEME"
                ? "bg-[#EC4899]/15 text-[#EC4899] font-bold border border-[#EC4899]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Meme / Grey Area</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          Showing {sortedData.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#1B1E24]/50 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("symbol")}>
                <div className="flex items-center space-x-1">
                  <span>Asset</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
                <div className="flex items-center space-x-1">
                  <span>Price</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("change24h")}>
                <div className="flex items-center space-x-1">
                  <span>24h Change</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Shariah Status</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("confidence")}>
                <div className="flex items-center space-x-1">
                  <span>AI Confidence</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Consensus Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs font-mono">
            {sortedData.map((row) => {
              const isPositive = row.change24h >= 0;
              const isHalal = row.shariah_status !== "GREY_AREA_MEME";
              return (
                <tr
                  key={row.symbol}
                  onClick={() => onSelectRow && onSelectRow(row.symbol)}
                  className="hover:bg-[#1B1E24]/70 transition-colors cursor-pointer group"
                >
                  {/* Asset Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0A0B0D] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-bold text-xs text-[#22D3EE]">
                        {row.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                          {row.symbol}
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">{row.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                    ${row.price > 1.0 ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : row.price}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3.5 px-4 tabular-nums">
                    <div
                      className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded font-semibold text-[11px] ${
                        isPositive
                          ? "text-[#10B981] bg-[#10B981]/10"
                          : "text-[#EF4444] bg-[#EF4444]/10"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{isPositive ? "+" : ""}{row.change24h.toFixed(2)}%</span>
                    </div>
                  </td>

                  {/* Shariah Status */}
                  <td className="py-3.5 px-4">
                    {isHalal ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-lg">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Halal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Meme / Grey</span>
                      </span>
                    )}
                  </td>

                  {/* Confidence Bar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-[#0A0B0D] h-1.5 rounded-full overflow-hidden border border-[rgba(255,255,255,0.06)]">
                        <div
                          className="h-full bg-gradient-to-r from-[#22D3EE] to-[#10B981] rounded-full"
                          style={{ width: `${row.confidence}%` }}
                        />
                      </div>
                      <span className="font-bold text-white tabular-nums">{row.confidence}%</span>
                    </div>
                  </td>

                  {/* Verdict Badge */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-bold tracking-wider border shadow-sm ${
                        row.status === "BUY"
                          ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                          : row.status === "SELL"
                          ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                          : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
