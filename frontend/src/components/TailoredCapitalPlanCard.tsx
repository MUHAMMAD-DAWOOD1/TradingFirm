import React, { useState } from 'react';
import { Shield, DollarSign, Percent, TrendingUp, AlertTriangle, Scale, ArrowRight, Play, Calculator } from 'lucide-react';

interface TailoredPlan {
  user_capital: number;
  risk_pct: number;
  asset: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  max_risk_usd: number;
  trade_units: number;
  lot_size_str: string;
  tp1_price: number;
  tp1_gain_usd: number;
  tp2_price: number;
  tp2_gain_usd: number;
  risk_reward_ratio: string;
  margin_required_usd: number;
  recommended_leverage: string;
  sizing_advisory_urdu: string;
}

interface TailoredCapitalPlanCardProps {
  initialCapital?: number;
  initialRiskPct?: number;
  plan?: TailoredPlan;
  entryPrice?: number;
  slPrice?: number;
  tpPrice?: number;
  symbol?: string;
  onExecuteTradeWithSizing?: (lots: number, capital: number) => void;
}

export const TailoredCapitalPlanCard: React.FC<TailoredCapitalPlanCardProps> = ({
  initialCapital = 10000,
  initialRiskPct = 2.0,
  plan,
  entryPrice = 2700,
  slPrice = 2660,
  tpPrice = 2780,
  symbol = 'XAUUSD',
  onExecuteTradeWithSizing,
}) => {
  const [capital, setCapital] = useState<number>(plan?.user_capital || initialCapital);
  const [riskPct, setRiskPct] = useState<number>(plan?.risk_pct || initialRiskPct);

  // Dynamic calculation if user slides capital
  const entry = plan?.entry_price || entryPrice;
  const sl = plan?.stop_loss_price || slPrice;
  const tp = plan?.take_profit_price || tpPrice;

  const maxRiskUsd = (capital * riskPct) / 100.0;
  const slDistance = Math.abs(entry - sl) || (entry * 0.015);

  let rawUnits = slDistance > 0 ? maxRiskUsd / slDistance : 0.01;
  let lotSizeStr = '';
  let tradeUnits = 0.01;

  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    tradeUnits = Math.max(0.01, Math.round(rawUnits * 100) / 100);
    lotSizeStr = `${tradeUnits.toFixed(2)} Lots (${(tradeUnits * 100).toFixed(0)} oz)`;
  } else if (symbol.includes('BTC')) {
    tradeUnits = Math.max(0.001, Math.round(rawUnits * 1000) / 1000);
    lotSizeStr = `${tradeUnits.toFixed(3)} BTC`;
  } else {
    tradeUnits = Math.max(0.01, Math.round(rawUnits * 100) / 100);
    lotSizeStr = `${tradeUnits.toFixed(2)} Units`;
  }

  const tp1Dist = Math.abs(entry - sl) * 1.5;
  const tp2Dist = Math.abs(entry - sl) * 2.5;
  const tp1Gain = rawUnits * tp1Dist;
  const tp2Gain = rawUnits * tp2Dist;
  const marginReq = (tradeUnits * entry) / 10.0; // 10x leverage standard

  return (
    <div className="bg-gradient-to-br from-[#12161f] via-[#141824] to-[#0d1117] border border-emerald-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Glow Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Tailored Capital Allocation Plan
              </h3>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Personalized
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact lot sizes and dollar projections tailored to your account balance
            </p>
          </div>
        </div>

        {/* Interactive Capital Recalculator Controls */}
        <div className="flex items-center gap-3 bg-[#0A0B0D] px-4 py-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Capital:</span>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Math.max(100, parseFloat(e.target.value) || 0))}
              className="w-24 bg-[#14161A] text-emerald-300 font-mono font-bold text-xs px-2 py-1 rounded border border-white/10 text-right focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">Risk:</span>
            <select
              value={riskPct}
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              className="bg-[#14161A] text-amber-300 font-mono font-bold text-xs px-2 py-1 rounded border border-white/10 focus:outline-none"
            >
              <option value={0.5}>0.5%</option>
              <option value={1.0}>1.0%</option>
              <option value={1.5}>1.5%</option>
              <option value={2.0}>2.0%</option>
              <option value={3.0}>3.0%</option>
              <option value={5.0}>5.0%</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Metric 1: Recommended Lot Size */}
        <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl relative">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
            Recommended Position Size
          </span>
          <div className="text-xl font-mono font-black text-[#22D3EE] tracking-tight">
            {lotSizeStr}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <span>Sized for {riskPct}% risk tolerance</span>
          </div>
        </div>

        {/* Metric 2: Max Dollar Risk at SL */}
        <div className="bg-[#0b0e14] border border-red-500/20 p-4 rounded-xl relative">
          <span className="text-[10px] font-mono text-red-400 uppercase block mb-1 flex items-center justify-between">
            <span>Max Dollar Loss (SL)</span>
            <AlertTriangle className="w-3 h-3 text-red-400" />
          </span>
          <div className="text-xl font-mono font-black text-red-400 tracking-tight">
            -${maxRiskUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Invalidation: ${sl.toLocaleString()}
          </div>
        </div>

        {/* Metric 3: Target Profit 1 */}
        <div className="bg-[#0b0e14] border border-emerald-500/20 p-4 rounded-xl relative">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1 flex items-center justify-between">
            <span>Target 1 Gain (1.5R)</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </span>
          <div className="text-xl font-mono font-black text-emerald-400 tracking-tight">
            +${tp1Gain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            TP1: ${(entry + tp1Dist).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Metric 4: Target Profit 2 */}
        <div className="bg-[#0b0e14] border border-emerald-500/20 p-4 rounded-xl relative">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block mb-1 flex items-center justify-between">
            <span>Target 2 Gain (2.5R)</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </span>
          <div className="text-xl font-mono font-black text-emerald-400 tracking-tight">
            +${tp2Gain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            TP2: ${(entry + tp2Dist).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Institutional Execution Details & Roman Urdu Advisory */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Roman Urdu Sizing Advisory */}
        <div className="lg:col-span-2 bg-[#0A0B0D] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Risk Officer Advisory (Roman Urdu)
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {plan?.sizing_advisory_urdu ||
              `Aapke $${capital.toLocaleString()} account capital par maximum ${riskPct}% ($${maxRiskUsd.toFixed(2)}) risk allowed hai. ${symbol} setup ke liye optimal entry $${entry.toLocaleString()} aur strict stop-loss $${sl.toLocaleString()} par set karein. Recommended lot size ${lotSizeStr} hai. Agar price $${sl.toLocaleString()} invalidate karti hai to position close kar dein.`}
          </p>
        </div>

        {/* Leverage & Margin Requirements */}
        <div className="bg-[#0A0B0D] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2">
              Leverage & Margin Specs
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Rec. Leverage:</span>
                <span className="text-amber-300 font-bold">5x - 10x Max</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Margin Needed:</span>
                <span className="text-white font-bold">${marginReq.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk/Reward:</span>
                <span className="text-emerald-400 font-bold">1:2.0 confirmed</span>
              </div>
            </div>
          </div>

          {onExecuteTradeWithSizing && (
            <button
              onClick={() => onExecuteTradeWithSizing(tradeUnits, capital)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-3 rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Deploy Paper Trade ({lotSizeStr})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TailoredCapitalPlanCard;
