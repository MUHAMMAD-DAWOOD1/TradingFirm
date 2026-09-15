import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertOctagon, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  mins_remaining: number | null;
  time_status: string;
  is_high_impact: boolean;
  is_major_event: boolean;
  volatility_alert: string;
}

export const MacroCalendarWidget: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/calendar?limit=8');
      if (res.ok) {
        const json = await res.json();
        setEvents(json.events || []);
      }
    } catch (e) {
      console.error('Failed to fetch macro calendar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (mins: number | null) => {
    if (mins === null) return 'N/A';
    if (mins < -120) return 'Passed';
    if (mins < 0) return 'Released';
    if (mins === 0) return 'Releasing Now';
    if (mins < 60) return `In ${mins}m`;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours < 24) return `In ${hours}h ${m}m`;
    const days = Math.floor(hours / 24);
    return `In ${days}d ${hours % 24}h`;
  };

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Macroeconomic Calendar & Volatility Clocks
            </h3>
            <p className="text-[11px] text-slate-400">ForexFactory High-Impact FOMC, CPI & NFP Schedule</p>
          </div>
        </div>

        <button
          onClick={fetchCalendar}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh Calendar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Events List */}
      <div className="divide-y divide-[#1a2234] mt-2">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            No imminent high-impact macro releases scheduled today.
          </div>
        ) : (
          events.map((ev, idx) => {
            const isCritical = ev.is_high_impact || ev.is_major_event;
            const isImminent = ev.mins_remaining !== null && ev.mins_remaining > 0 && ev.mins_remaining <= 120;

            return (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Currency Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    ev.country === 'USD'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : ev.country === 'EUR'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {ev.country}
                  </span>

                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                      {ev.title}
                      {ev.volatility_alert.includes('HIGH') && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                          VOLATILITY ALERT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3 mt-0.5">
                      <span>Forecast: <strong className="text-slate-300">{ev.forecast}</strong></span>
                      <span>Prior: <strong className="text-slate-300">{ev.previous}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Countdown Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border ${
                      isImminent
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                        : ev.time_status === 'ACTIVE_NOW'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatCountdown(ev.mins_remaining)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
