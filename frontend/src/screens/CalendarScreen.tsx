import React, { useState, useEffect } from "react";

interface MacroEvent {
  title: string;
  country?: string;
  currency?: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  time?: string;
  date?: string;
  countdown?: string;
}

interface CalendarScreenProps {
  isDark: boolean;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ isDark }) => {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    fetch(`/api/calendar?limit=25&high_impact_only=${highImpactOnly}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.events)) {
          setEvents(d.events);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [highImpactOnly]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 flex flex-col gap-6">
      {/* Page Header Area */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-well text-muted text-[11px] font-bold">
              Macro Intelligence
            </span>
            <span className="text-muted text-[12px]">• Live GMT Sync</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-main tracking-tight">
            Economic Calendar &amp; Macro Catalysts
          </h1>
          <p className="text-muted text-[13px] mt-0.5">
            Institutional event horizon, real-time central bank releases, and liquidity impact tracking
          </p>
        </div>

        {/* Quick Controls: Filter & Date Range */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-surface border border-border-subtle rounded-full card-shadow text-main text-[13px]">
            <span className="material-symbols-outlined text-[18px] text-muted">
              calendar_today
            </span>
            <span className="font-semibold">Today, Live Session</span>
          </div>

          <button
            onClick={() => setHighImpactOnly(!highImpactOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold active:scale-[0.98] transition-all cursor-pointer ${
              highImpactOnly
                ? "bg-rose-500 text-white shadow-sm"
                : isDark
                ? "bg-white text-black shadow-sm"
                : "bg-black text-white shadow-sm"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">tune</span>
            <span>{highImpactOnly ? "High Impact Only" : "Filter: All Events"}</span>
          </button>
        </div>
      </section>

      {/* Top Slim Horizontal Strip (Market Sessions) */}
      <section className="w-full bg-surface border border-border-subtle rounded-3xl p-4 card-shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
          {/* Session 1: London */}
          <div className="flex items-center justify-between px-2 pt-1 md:pt-0">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]" />
              </span>
              <div>
                <div className="font-bold text-[13px] text-main flex items-center gap-2">
                  <span>London Session</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#10B981] font-bold">
                    Active
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted">08:00 – 16:30 GMT</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-well text-[11px] text-[#10B981] font-bold">
              High Liquidity
            </span>
          </div>

          {/* Session 2: London / NY Overlap */}
          <div className="flex items-center justify-between px-2 pt-3 md:pt-0 md:pl-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <div>
                <div className="font-bold text-[13px] text-main flex items-center gap-2">
                  <span>London / NY Overlap</span>
                </div>
                <div className="font-mono text-[11px] text-muted">13:00 – 16:30 GMT</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-well text-[11px] text-amber-500 font-bold">
              Peak Volatility
            </span>
          </div>

          {/* Session 3: Asian Session */}
          <div className="flex items-center justify-between px-2 pt-3 md:pt-0 md:pl-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-muted/40" />
              <div>
                <div className="font-bold text-[13px] text-main flex items-center gap-2">
                  <span>Asian Session</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-well text-muted">
                    Closed
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted">00:00 – 09:00 GMT</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-well text-[11px] text-muted font-medium">
              Range Bound
            </span>
          </div>
        </div>
      </section>

      {/* Events Table Container Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-6 card-shadow flex flex-col gap-4">
        <h2 className="text-[16px] font-bold text-main">
          Scheduled Institutional Data Releases
        </h2>

        <div className="overflow-x-auto">
          {events.length === 0 ? (
            <div className="p-12 text-center text-muted text-[13px]">
              {loading ? "Loading economic calendar..." : "No events scheduled for current filter."}
            </div>
          ) : (
            <table className="w-full text-left text-[13px] font-mono">
              <thead>
                <tr className="text-muted border-b border-border-subtle font-sans text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-bold">Time (GMT)</th>
                  <th className="pb-3 font-bold">Currency</th>
                  <th className="pb-3 font-bold">Impact</th>
                  <th className="pb-3 font-bold">Event Catalyst</th>
                  <th className="pb-3 font-bold">Actual</th>
                  <th className="pb-3 font-bold">Forecast</th>
                  <th className="pb-3 font-bold text-right">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {events.map((ev, idx) => {
                  const isHigh = (ev.impact || "").toLowerCase().includes("high");
                  const isMed = (ev.impact || "").toLowerCase().includes("medium") || (ev.impact || "").toLowerCase().includes("med");

                  return (
                    <tr key={idx} className="hover:bg-well/40 transition-colors">
                      <td className="py-4 text-main">
                        <div className="font-bold">{ev.time || "13:30"}</div>
                        {ev.countdown && (
                          <span className="text-[10px] text-muted font-sans block">
                            {ev.countdown}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-well text-main border border-border-subtle text-[11px]">
                          {ev.currency || "USD"}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh
                              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                              : isMed
                              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              : "bg-well text-muted border border-border-subtle"
                          }`}
                        >
                          {ev.impact || "LOW"}
                        </span>
                      </td>
                      <td className="py-4 font-sans font-semibold text-main max-w-xs sm:max-w-sm truncate">
                        {ev.title}
                      </td>
                      <td className="py-4 font-bold text-main">
                        {ev.actual || "—"}
                      </td>
                      <td className="py-4 text-muted">
                        {ev.forecast || "—"}
                      </td>
                      <td className="py-4 text-muted text-right">
                        {ev.previous || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
};
