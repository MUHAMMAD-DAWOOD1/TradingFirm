import React, { useEffect, useState } from 'react';
import { Eye, ShieldAlert, Lock, ArrowUpRight, ArrowDownRight, Compass, RefreshCw } from 'lucide-react';

interface WhaleTrade {
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  usd_formatted: string;
  whale_tier: string;
  timestamp: number;
}

interface WhaleData {
  symbol: string;
  recent_whale_trades: WhaleTrade[];
  cvd_formatted: string;
  flow_bias: string;
  buyer_taker_ratio: number;
}

interface TokenUnlock {
  symbol: string;
  name: string;
  unlock_date: string;
  days_remaining: number;
  unlock_usd_formatted: string;
  circulating_supply_pct: number;
  dump_risk: string;
  risk_rationale: string;
}

export const WhaleAndUnlocksWidget: React.FC<{ symbol?: string }> = ({ symbol = 'BTC' }) => {
  const [whale, setWhale] = useState<WhaleData | null>(null);
  const [unlocks, setUnlocks] = useState<TokenUnlock[]>([]);
  const [activeTab, setActiveTab] = useState<'whale' | 'unlocks'>('whale');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [wRes, uRes] = await Promise.all([
        fetch(`/api/whale-activity/${symbol}`),
        fetch('/api/token-unlocks')
      ]);

      if (wRes.ok) {
        const wJson = await wRes.json();
        setWhale(wJson);
      }
      if (uRes.ok) {
        const uJson = await uRes.json();
        setUnlocks(uJson.unlocks || []);
      }
    } catch (e) {
      console.error('Failed to fetch whale/unlocks metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-5 shadow-xl">
      {/* Header with Switcher Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            {activeTab === 'whale' ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {activeTab === 'whale' ? 'On-Chain Whale Radar' : 'VC Token Vesting Cliffs'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'whale' ? 'Large Orders (>$100k) & CVD Flow' : 'Circulating Supply Inflation Alerts'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#121929] border border-[#1e293b] rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('whale')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'whale' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Whale Orders
          </button>
          <button
            onClick={() => setActiveTab('unlocks')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'unlocks' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Token Unlocks
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-3">
        {activeTab === 'whale' ? (
          <div>
            {/* CVD Banner */}
            <div className="bg-[#121929] border border-[#1e293b] rounded-lg p-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Cumulative Volume Delta (CVD)</span>
                <span className={`text-base font-mono font-bold ${whale && whale.cvd_formatted.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {whale?.cvd_formatted || '$0.00'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {whale?.flow_bias || 'NEUTRAL FLOW'}
              </span>
            </div>

            {/* Whale Trades Feed */}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {(!whale || whale.recent_whale_trades.length === 0) ? (
                <div className="py-4 text-center text-xs text-slate-500 font-mono">No mega whale trades logged in recent window.</div>
              ) : (
                whale.recent_whale_trades.slice(0, 5).map((tr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#0e1422] border border-[#1a2234] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tr.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tr.side}
                      </span>
                      <span className="text-slate-200 font-semibold">{tr.usd_formatted}</span>
                      <span className="text-slate-500 text-[10px]">@{tr.price.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{tr.whale_tier}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Token Unlocks List */
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {unlocks.map((u, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0e1422] border border-[#1a2234] flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 font-mono">{u.symbol}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{u.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                      u.dump_risk === 'EXTREME'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : u.dump_risk === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {u.dump_risk} RISK
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Unlocks: <strong className="text-slate-200">{u.unlock_usd_formatted}</strong> ({u.circulating_supply_pct}% circ. supply)
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-cyan-400">
                    {u.days_remaining === 999 ? 'N/A' : u.days_remaining <= 0 ? 'Today' : `In ${u.days_remaining}d`}
                  </span>
                  <span className="block text-[9px] text-slate-500">{u.unlock_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
