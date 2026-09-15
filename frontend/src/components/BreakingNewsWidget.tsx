import React, { useState, useEffect } from 'react';
import { Newspaper, Clock, Zap, AlertCircle, RefreshCw, Globe, ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  source: string;
  published_at: string;
  category: string;
  impact: string;
  sentiment: string;
  link: string;
}

interface VolatilityClocks {
  current_utc_time: string;
  active_session: string;
  volatility_score: number;
  volatility_label: string;
  is_liquidity_overlap: boolean;
  sessions: Array<{
    name: string;
    hours_utc: string;
    status: string;
    volatility: string;
  }>;
}

export const BreakingNewsWidget: React.FC<{ symbol?: string }> = ({ symbol = 'ALL' }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [clocks, setClocks] = useState<VolatilityClocks | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNewsAndClocks = async () => {
    try {
      const res = await fetch(`/api/news?asset=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
        setClocks(data.volatility_clocks || null);
      }
    } catch (e) {
      console.error('Failed to load breaking news & clocks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsAndClocks();
    const interval = setInterval(fetchNewsAndClocks, 20000); // 20s live refresh
    return () => clearInterval(interval);
  }, [symbol]);

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'FOMC':
      case 'INTEREST_RATE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'INFLATION_CPI':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'JOBS_NFP':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'GEOPOLITICS':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'CRYPTO_ECOSYSTEM':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-[#14161A] border border-white/10 rounded-2xl p-5 shadow-glass-inner space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              Breaking News & Volatility Clocks
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400">Real-Time Macroeconomic Event Feed & Session Hazard Radar</p>
          </div>
        </div>

        <button
          onClick={fetchNewsAndClocks}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh Live News"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Volatility Clocks Strip */}
      {clocks && (
        <div className="bg-[#0A0B0D] border border-white/5 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono text-slate-300">
                Active Session: <strong className="text-white">{clocks.active_session}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Hazard Level:</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                clocks.volatility_score >= 80
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {clocks.volatility_label} ({clocks.volatility_score}/100)
              </span>
            </div>
          </div>

          {/* Session Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            {clocks.sessions?.map((s, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border transition-all ${
                  s.status === 'OPEN'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{s.name}</span>
                  <span className={s.status === 'OPEN' ? 'text-emerald-400' : 'text-slate-600'}>
                    {s.status}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">{s.hours_utc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breaking News Feed */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {news.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            Connecting to breaking news wire...
          </div>
        ) : (
          news.map((n, i) => (
            <div
              key={i}
              className="bg-[#0A0B0D] hover:bg-[#12161f] border border-white/5 hover:border-white/15 p-3 rounded-xl transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getBadgeColor(n.category)}`}>
                  {n.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{n.published_at}</span>
              </div>
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors line-clamp-2"
              >
                {n.title}
              </a>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                <span>Source: {n.source}</span>
                <span className={n.impact === 'HIGH' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  Impact: {n.impact}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BreakingNewsWidget;
