import React from "react";
import { LiveMacroRadar } from "../components/LiveMacroRadar";

interface CalendarScreenProps {
  isDark: boolean;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ isDark }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
          Economic Calendar &amp; Volatility Releases
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          ForexFactory Weekly High-Impact Events, FOMC Interest Rate Schedule, CME FedWatch Odds, and Real-Time Breaking News Wire.
        </p>
      </div>

      <LiveMacroRadar isDark={isDark} />
    </main>
  );
};

export default CalendarScreen;
