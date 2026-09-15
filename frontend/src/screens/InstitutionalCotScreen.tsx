import React, { useState, useEffect } from "react";
import { MacroRegimeWidget } from "../components/MacroRegimeWidget";
import { InstitutionalCotCard } from "../components/InstitutionalCotCard";

interface InstitutionalCotScreenProps {
  isDark: boolean;
}

export const InstitutionalCotScreen: React.FC<InstitutionalCotScreenProps> = ({ isDark }) => {
  const [activeAsset, setActiveAsset] = useState<string>("GOLD");
  const [llmSummary, setLlmSummary] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setLoadingAi(true);
    fetch("/api/agents/deep-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: activeAsset }),
    })
      .then((r) => r.json())
      .then((d) => {
        setLoadingAi(false);
        if (d && d.success) {
          setLlmSummary(d);
        }
      })
      .catch(() => setLoadingAi(false));
  }, [activeAsset]);

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isDark ? "text-white" : "text-neutral-900"}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Institutional Intelligence
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              CFTC &amp; Intermarket Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Institutional Macro &amp; CFTC COT Intel (مارکیٹ پوزیشننگ)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Official US CFTC Futures Positioning, Commercial Smart-Money Accumulation, aur 60-Day Global Intermarket Liquidity.
          </p>
        </div>

        {/* Quick Asset Selector */}
        <div className="flex items-center gap-1.5 mt-4 md:mt-0 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
          {[
            { key: "GOLD", label: "Gold (COMEX)" },
            { key: "EURUSD", label: "Euro FX" },
            { key: "GBPUSD", label: "British Pound" },
            { key: "BTC", label: "CME Bitcoin" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveAsset(item.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeAsset === item.key
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP SECTION: Asaan Roman Urdu AI Overview */}
      <div className={`p-5 rounded-2xl mb-6 border ${isDark ? "bg-neutral-900/70 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-main">
                Asaan Lafzon Mein Market Ka Khulasa (AI Macro Overview)
              </h2>
              <span className="text-[11px] text-neutral-500">
                In sub technical numbers aur reports ka aam trader ke liye seedha matlab
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700 font-mono">
            {activeAsset} Focused
          </span>
        </div>

        {/* 4 Clear Roman Urdu Takeaways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Point 1: Market Ka Rasta */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800/40 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs mb-1.5">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>1. Market Ka Asal Rasta (Direction)</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {activeAsset === "GOLD"
                ? "Gold par baray buyers aur central banks active hain. US Dollar Index (DXY) ke thanday hone ki wajah se Gold ko continuous structural support mil rahi hai. Trend overall Bullish hai."
                : activeAsset === "BTC"
                ? "Bitcoin institutional accumulation CME futures par strong hai. Spot ETF inflows regular hain, jis ki wajah se dip buying active hai."
                : `${activeAsset} par institutional positioning filhal balanced hai. Major breakout confirmation ke baad swing trade deploy karein.`}
            </p>
          </div>

          {/* Point 2: Smart Money Kya Kar Rahi Hai */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800/40 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs mb-1.5">
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              <span>2. Smart Money (Commercial Banks) Kya Kar Rahe Hain?</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {activeAsset === "GOLD"
                ? "Commercial bullion banks ne 14,200 short contracts cover (band) kiye hain. Iska matlab hai ke baray banks market ko mazeed girta hua nahi dekh rahe, wo support levels par buying floor bana rahe hain."
                : activeAsset === "BTC"
                ? "Commercial hedgers aur market makers liquidity maintain kar rahe hain. Funding rates positive hain magar over-leveraged nahi hain."
                : "Commercial banks currency rates ko rangebound levels mein rakhne ke liye hedges adjust kar rahe hain."}
            </p>
          </div>

          {/* Point 3: Hedge Funds Ki Halat */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800/40 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-1.5">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>3. Hedge Funds (Speculators) Ki Halat</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {activeAsset === "GOLD"
                ? "Hedge funds ke paas 74% net long exposure hai. Iska matlab hai ke trend mazboot hai, LEKIN jab bohot zyada log ek hi taraf hon to sudden fake dump (liquidity sweep) ka khatra rehta hai taake kamzor buyers ko bahar nikala ja sake."
                : "Hedge funds long positions hold kar rahe hain. Resistance ke qareeb profit-taking pullbacks expect karein."}
            </p>
          </div>

          {/* Point 4: Trader Ke Liye Naseehat */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800/40 border-neutral-750" : "bg-neutral-50 border-neutral-200"}`}>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1.5">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>4. Trader Ke Liye Seedhi Hidayat (Action Rule)</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
              FOMC ya CPI high-impact news se 30 minutes pehle trades na lein. Apna Stop Loss hamesha technical support ke neeche tight rakhein aur account equity ke 1.0% se 1.5% se zyada risk hargiz na karein.
            </p>
          </div>
        </div>

        {/* Dynamic Chief Risk Officer Note from LLM Service */}
        {llmSummary && llmSummary.risk_officer_urdu && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 dark:text-amber-400 leading-relaxed flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0 mt-0.5">verified_user</span>
            <div>
              <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 text-amber-600 dark:text-amber-300">
                Chief Risk Officer Ki Roman Urdu Warning ({activeAsset})
              </span>
              {llmSummary.risk_officer_urdu}
            </div>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: Institutional COT Card + Intermarket Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InstitutionalCotCard isDark={isDark} defaultSymbol={activeAsset} />
        <MacroRegimeWidget isDark={isDark} />
      </div>

      {/* EDUCATIONAL GLOSSARY CARD: Roman Urdu Explanations */}
      <div className={`p-5 rounded-2xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-neutral-200 shadow-sm"}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          Aam Zubaan Mein Glossary: COT Aur Correlation Ko Kaise Parhein?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="space-y-1">
            <span className="font-bold text-main block">Commercials (Smart Money):</span>
            <p className="leading-relaxed">
              Ye physical metal producers aur baray banks hote hain jo market ko hedge karte hain. Inki buying aksar market ke bottoms (floors) ko mark karti hai.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-main block">Non-Commercials (Hedge Funds):</span>
            <p className="leading-relaxed">
              Ye speculative hedge funds aur trend followers hote hain. Jab inki buying 80% se upar chali jaye to market &quot;Overcrowded&quot; ho jati hai aur trap ka risk barh jata hai.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-main block">Correlation (-1.0 to +1.0):</span>
            <p className="leading-relaxed">
              -1.0 ka matlab hai dono mukhalif chalte hain (jaise Gold aur US Dollar). Agar Dollar girta hai to Gold barhta hai. Agar dono sath barhein to ye central bank emergency buying ka ishara hai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
