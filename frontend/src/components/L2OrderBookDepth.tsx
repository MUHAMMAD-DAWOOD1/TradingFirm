import React, { useEffect, useState } from 'react';
import { Layers, Shield, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface OrderLevel {
  price: number;
  qty: number;
  total_usd: number;
}

interface OrderBookData {
  symbol: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  spread: number;
  spread_bps: number;
  best_bid: number;
  best_ask: number;
  bid_depth_usd: number;
  ask_depth_usd: number;
  depth_ratio: number;
  wall_dominance: string;
  source: string;
}

export const L2OrderBookDepth: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/orderbook/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch L2 order book:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
    const interval = setInterval(fetchBook, 2000); // 2s sub-second refresh
    return () => clearInterval(interval);
  }, [symbol]);

  if (!data && loading) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-5 flex items-center justify-center min-h-[220px]">
        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin mr-2" />
        <span className="text-xs text-slate-400 font-mono">Loading L2 Depth Ladder ({symbol})...</span>
      </div>
    );
  }

  if (!data) return null;

  const topBids = data.bids.slice(0, 7);
  const topAsks = data.asks.slice(0, 7).reverse(); // Reverse asks so highest is on top
  const maxBidTotal = topBids.length > 0 ? topBids[topBids.length - 1].total_usd : 1;
  const maxAskTotal = topAsks.length > 0 ? topAsks[0].total_usd : 1;
  const maxDepth = Math.max(maxBidTotal, maxAskTotal, 1);

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-5 shadow-xl font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              L2 Order Book Depth
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {data.symbol}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Real-Time Top Liquidity Walls</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            data.depth_ratio > 1.05
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : data.depth_ratio < 0.95
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {data.wall_dominance.split(' ')[0]} WALL ({data.depth_ratio}x)
          </span>
        </div>
      </div>

      {/* Depth Table Column Headers */}
      <div className="grid grid-cols-3 text-[10px] text-slate-500 py-1.5 border-b border-[#162032] mt-2">
        <span>PRICE (USDT)</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL ($)</span>
      </div>

      {/* Asks (Sell Wall) - Red */}
      <div className="space-y-0.5 my-1">
        {topAsks.map((ask, idx) => {
          const depthPct = Math.min(100, Math.round((ask.total_usd / maxDepth) * 100));
          return (
            <div key={`ask-${idx}`} className="relative grid grid-cols-3 py-1 px-1.5 rounded text-[11px] hover:bg-rose-500/5">
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 rounded pointer-events-none transition-all duration-300"
                style={{ width: `${depthPct}%` }}
              />
              <span className="text-rose-400 font-semibold z-10">${ask.price.toLocaleString()}</span>
              <span className="text-right text-slate-300 z-10">{ask.qty}</span>
              <span className="text-right text-slate-400 z-10">${Math.round(ask.total_usd).toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Spread Bar */}
      <div className="py-2 px-3 my-1.5 rounded-lg bg-[#121929] border border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">ECN SPREAD:</span>
          <span className="text-slate-200 font-bold font-mono">${data.spread}</span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono">{data.spread_bps} bps</span>
      </div>

      {/* Bids (Buy Wall) - Green */}
      <div className="space-y-0.5 my-1">
        {topBids.map((bid, idx) => {
          const depthPct = Math.min(100, Math.round((bid.total_usd / maxDepth) * 100));
          return (
            <div key={`bid-${idx}`} className="relative grid grid-cols-3 py-1 px-1.5 rounded text-[11px] hover:bg-emerald-500/5">
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 rounded pointer-events-none transition-all duration-300"
                style={{ width: `${depthPct}%` }}
              />
              <span className="text-emerald-400 font-semibold z-10">${bid.price.toLocaleString()}</span>
              <span className="text-right text-slate-300 z-10">{bid.qty}</span>
              <span className="text-right text-slate-400 z-10">${Math.round(bid.total_usd).toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
