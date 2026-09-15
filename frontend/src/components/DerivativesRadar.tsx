import React, { useEffect, useState } from 'react';
import { Activity, Zap, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface DerivativesData {
  symbol: string;
  market_type: string;
  open_interest_formatted: string;
  funding_rate_pct: number;
  funding_rate_annualized: number;
  mark_price: number;
  long_account_pct: number;
  short_account_pct: number;
  long_short_ratio: number;
  squeeze_radar: {
    status: string;
    intensity: string;
    bias: string;
    recommendation: string;
  };
  source: string;
}

export const DerivativesRadar: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [data, setData] = useState<DerivativesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/derivatives/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch derivatives data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading && !data) {
    return (
      <div className="bg-[#0f1523] border border-[#1e293b] rounded-xl p-5 flex items-center justify-center min-h-[180px]">
        <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mr-2" />
        <span className="text-xs text-slate-400 font-mono">Loading Derivatives Flow ({symbol})...</span>
      </div>
    );
  }

  if (!data) return null;

  const isShortSqueeze = data.squeeze_radar?.status?.includes('SHORT');
  const isLongSqueeze = data.squeeze_radar?.status?.includes('LONG');
  const isNegativeFunding = data.funding_rate_pct < 0;

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-5 relative overflow-hidden shadow-xl">
      {/* Background glow for squeeze alerts */}
      {isShortSqueeze && <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />}
      {isLongSqueeze && <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Derivatives & Liquidity Flow
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {data.symbol}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Binance Futures Open Interest & Squeeze Probability</p>
          </div>
        </div>

        {/* Squeeze Alert Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
          isShortSqueeze
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
            : isLongSqueeze
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {isShortSqueeze ? <TrendingUp className="w-3.5 h-3.5" /> : isLongSqueeze ? <TrendingDown className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {data.squeeze_radar?.status?.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {/* Open Interest */}
        <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Open Interest (OI)</span>
          <div className="text-base font-mono font-bold text-slate-100">{data.open_interest_formatted}</div>
          <span className="text-[10px] text-slate-500 font-mono">Live Institutional Cap</span>
        </div>

        {/* 8-Hour Funding Rate */}
        <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block mb-1">8h Predicted Funding</span>
          <div className={`text-base font-mono font-bold ${isNegativeFunding ? 'text-emerald-400' : 'text-amber-400'}`}>
            {data.funding_rate_pct > 0 ? `+${data.funding_rate_pct}%` : `${data.funding_rate_pct}%`}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{data.funding_rate_annualized}% APR</span>
        </div>

        {/* Long / Short Ratio */}
        <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Top Traders L/S Ratio</span>
          <div className="text-base font-mono font-bold text-cyan-400">{data.long_short_ratio}x</div>
          <span className="text-[10px] text-slate-500 font-mono">Account Sentiment</span>
        </div>

        {/* Mark Price */}
        <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Perp Mark Price</span>
          <div className="text-base font-mono font-bold text-slate-100">${data.mark_price.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">Index Basis: {data.funding_rate_pct}%</span>
        </div>
      </div>

      {/* Long/Short Visual Bar */}
      <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3">
        <div className="flex justify-between text-xs font-mono mb-1.5">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Longs: {data.long_account_pct}%
          </span>
          <span className="text-rose-400 font-bold flex items-center gap-1">
            Shorts: {data.short_account_pct}%
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </span>
        </div>
        <div className="h-2 w-full bg-rose-500/40 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${data.long_account_pct}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Radar Verdict:</strong> {data.squeeze_radar?.recommendation}
        </div>
      </div>
    </div>
  );
};
