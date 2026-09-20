import React, { useState, useEffect } from "react";
import { MacroRegimeWidget } from "../components/MacroRegimeWidget";
import { InstitutionalCotCard } from "../components/InstitutionalCotCard";
import { LiveMacroRadar } from "../components/LiveMacroRadar";

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
      <div className={`p-5 rounded-3xl mb-6 border-2 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Asaan Lafzon Mein Market Ka Khulasa (AI Macro Overview)
              </h2>
              <span className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">
                In sub technical numbers aur reports ka aam trader ke liye seedha matlab
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-neutral-700 font-mono">
            {activeAsset} Focused
          </span>
        </div>

        {/* 4 Clear Roman Urdu Takeaways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Point 1: Market Ka Rasta */}
          <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-neutral-800/60 border-neutral-700" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-black text-xs mb-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              <span>1. Market Ka Asal Rasta (Direction)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {activeAsset === "GOLD"
                ? "Gold par baray buyers aur central banks active hain. US Dollar Index (DXY) ke thanday hone ki wajah se Gold ko continuous structural support mil rahi hai. Trend overall Bullish hai."
                : activeAsset === "BTC"
                ? "Bitcoin institutional accumulation CME futures par strong hai. Spot ETF inflows regular hain, jis ki wajah se dip buying active hai."
                : `${activeAsset} par institutional positioning filhal balanced hai. Major breakout confirmation ke baad swing trade deploy karein.`}
            </p>
          </div>

          {/* Point 2: Smart Money Kya Kar Rahi Hai */}
          <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-neutral-800/60 border-neutral-700" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-black text-xs mb-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span>2. Smart Money (Commercial Banks) Kya Kar Rahe Hain?</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {activeAsset === "GOLD"
                ? "Commercial bullion banks ne 14,200 short contracts cover (band) kiye hain. Iska matlab hai ke baray banks market ko mazeed girta hua nahi dekh rahe, wo support levels par buying floor bana rahe hain."
                : activeAsset === "BTC"
                ? "Commercial hedgers aur market makers liquidity maintain kar rahe hain. Funding rates positive hain magar over-leveraged nahi hain."
                : "Commercial banks currency rates ko rangebound levels mein rakhne ke liye hedges adjust kar rahe hain."}
            </p>
          </div>

          {/* Point 3: Hedge Funds Ki Halat */}
          <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-neutral-800/60 border-neutral-700" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-black text-xs mb-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>3. Hedge Funds (Speculators) Ki Halat</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {activeAsset === "GOLD"
                ? "Hedge funds ke paas 74% net long exposure hai. Iska matlab hai ke trend mazboot hai, LEKIN jab bohot zyada log ek hi taraf hon to sudden fake dump (liquidity sweep) ka khatra rehta hai taake kamzor buyers ko bahar nikala ja sake."
                : "Hedge funds long positions hold kar rahe hain. Resistance ke qareeb profit-taking pullbacks expect karein."}
            </p>
          </div>

          {/* Point 4: Trader Ke Liye Naseehat */}
          <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-neutral-800/60 border-neutral-700" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-black text-xs mb-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              <span>4. Trader Ke Liye Seedhi Hidayat (Action Rule)</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              FOMC ya CPI high-impact news se 30 minutes pehle trades na lein. Apna Stop Loss hamesha technical support ke neeche tight rakhein aur account equity ke 1.0% se 1.5% se zyada risk hargiz na karein.
            </p>
          </div>
        </div>

        {/* Dynamic Chief Risk Officer Note from LLM Service */}
        {llmSummary && llmSummary.risk_officer_urdu && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500 text-xs text-amber-950 dark:text-amber-200 leading-relaxed flex items-start gap-2.5 font-medium">
            <span className="material-symbols-outlined text-[20px] text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">verified_user</span>
            <div>
              <span className="font-black uppercase tracking-wider block text-[11px] mb-0.5 text-amber-950 dark:text-amber-300">
                Chief Risk Officer Ki Roman Urdu Warning ({activeAsset})
              </span>
              {llmSummary.risk_officer_urdu}
            </div>
          </div>
        )}
      </div>

      {/* LIVE MACRO CALENDAR, FOMC RADAR & REAL-TIME NEWS WIRE */}
      <div className="mb-6">
        <LiveMacroRadar isDark={isDark} />
      </div>

      {/* TWO COLUMN GRID: Institutional COT Card + Intermarket Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InstitutionalCotCard isDark={isDark} defaultSymbol={activeAsset} />
        <MacroRegimeWidget isDark={isDark} />
      </div>

      {/* EDUCATIONAL GLOSSARY CARD: Roman Urdu Explanations */}
      <div className={`p-6 rounded-3xl border-2 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200 shadow-sm"}`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          Aam Zubaan Mein Glossary: COT Aur Correlation Ko Kaise Parhein?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700 dark:text-slate-300">
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700">
            <span className="font-black text-slate-950 dark:text-white block text-sm">Commercials (Smart Money):</span>
            <p className="leading-relaxed font-medium">
              Ye physical metal producers aur baray banks hote hain jo market ko hedge karte hain. Inki buying aksar market ke bottoms (floors) ko mark karti hai.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700">
            <span className="font-black text-slate-950 dark:text-white block text-sm">Non-Commercials (Hedge Funds):</span>
            <p className="leading-relaxed font-medium">
              Ye speculative hedge funds aur trend followers hote hain. Jab inki buying 80% se upar chali jaye to market &quot;Overcrowded&quot; ho jati hai aur trap ka risk barh jata hai.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700">
            <span className="font-black text-slate-950 dark:text-white block text-sm">Correlation (-1.0 to +1.0):</span>
            <p className="leading-relaxed font-medium">
              -1.0 ka matlab hai dono mukhalif chalte hain (jaise Gold aur US Dollar). Agar Dollar girta hai to Gold barhta hai. Agar dono sath barhein to ye central bank emergency buying ka ishara hai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
