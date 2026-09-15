import React, { useState, useEffect } from 'react';
import { 
  Play, 
  X, 
  Shield, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Sliders,
  Sparkles,
  Scale,
  Zap,
  RotateCcw
} from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  leverage: number;
  margin_usd: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  status: string;
  opened_at: string;
}

interface ExecutionState {
  account: {
    initial_capital: number;
    equity: number;
    margin_used: number;
    available_margin: number;
    realized_pnl: number;
    win_count: number;
    loss_count: number;
    total_trades: number;
    win_rate_pct: number;
  };
  open_positions: Position[];
  closed_positions: Position[];
}

interface TradeExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  currentPrice?: number;
  defaultEntry?: string;
  defaultSL?: string;
  defaultTP?: string;
  defaultQuantity?: number;
  defaultCapital?: number;
}

export const TradeExecutionModal: React.FC<TradeExecutionModalProps> = ({
  isOpen,
  onClose,
  defaultSymbol = 'BTC',
  currentPrice = 77200,
  defaultEntry = '77200',
  defaultSL = '75500',
  defaultTP = '81000',
  defaultQuantity,
  defaultCapital = 10000,
}) => {
  const [execState, setExecState] = useState<ExecutionState | null>(null);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(
    defaultQuantity || (defaultSymbol.includes('XAU') ? 0.35 : 0.05)
  );
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 77200);
  const [stopLoss, setStopLoss] = useState<number>(parseFloat(defaultSL.replace('$', '')) || 75500);
  const [takeProfit, setTakeProfit] = useState<number>(parseFloat(defaultTP.replace('$', '')) || 81000);
  const [leverage, setLeverage] = useState<number>(5);
  const [customCapital, setCustomCapital] = useState<number>(defaultCapital);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [capitalUpdating, setCapitalUpdating] = useState<boolean>(false);
  const [execMessage, setExecMessage] = useState<string | null>(null);

  const capitalPresets = [1000, 5000, 10000, 25000, 50000, 100000];
  const lotPresets = defaultSymbol.includes('XAU') 
    ? [0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00] 
    : [0.005, 0.01, 0.05, 0.10, 0.25, 0.50, 1.00];
  const leveragePresets = [1, 2, 3, 5, 10, 20, 50, 100];

  const fetchState = async () => {
    try {
      const res = await fetch('/api/execution/state');
      if (res.ok) {
        const json = await res.json();
        setExecState(json);
        if (json.account?.initial_capital) {
          setCustomCapital(json.account.initial_capital);
        }
      }
    } catch (e) {
      console.error('Failed to fetch execution state:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchState();
      const interval = setInterval(fetchState, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Capital Update
  const handleUpdateCapital = async (newCap: number) => {
    setCapitalUpdating(true);
    setCustomCapital(newCap);
    try {
      const res = await fetch('/api/execution/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: newCap }),
      });
      if (res.ok) {
        const json = await res.json();
        setExecState(json);
      }
    } catch (e) {
      console.error('Failed to update account capital:', e);
    } finally {
      setCapitalUpdating(false);
    }
  };

  // Handle Trade Execution
  const handleExecute = async () => {
    setSubmitting(true);
    setExecMessage(null);
    try {
      const res = await fetch('/api/execution/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: defaultSymbol,
          side: side,
          order_type: orderType,
          quantity: Number(quantity),
          entry_price: Number(entryPrice),
          stop_loss: Number(stopLoss),
          take_profit: Number(takeProfit),
          leverage: Number(leverage),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setExecMessage(`Order Executed! Position ID: ${json.position?.id}`);
        fetchState();
      } else {
        setExecMessage(`Error: ${json.detail || json.error || 'Execution Failed'}`);
      }
    } catch (e: any) {
      setExecMessage(`Network Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePosition = async (posId: string) => {
    try {
      const res = await fetch(`/api/execution/close/${posId}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error('Failed to close position:', e);
    }
  };

  // Calculations for live risk feedback
  const notionalValue = currentPrice * quantity;
  const marginReq = notionalValue / Math.max(leverage, 1);
  const currentCap = execState?.account?.equity || customCapital;

  const slDistance = Math.abs(currentPrice - stopLoss);
  const tpDistance = Math.abs(takeProfit - currentPrice);
  const maxDollarLoss = slDistance * quantity;
  const maxDollarLossPct = currentCap > 0 ? (maxDollarLoss / currentCap) * 100 : 0;

  const projectedGain = tpDistance * quantity;
  const projectedGainPct = currentCap > 0 ? (projectedGain / currentCap) * 100 : 0;
  const rrRatio = slDistance > 0 ? (tpDistance / slDistance).toFixed(2) : '1:2.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-cyan-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-950/40">
        {/* Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#101624]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Play className="w-4 h-4 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-wide font-mono uppercase">
                  Nexus Execution Terminal
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                  {defaultSymbol} @ ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full User Control: Customize Capital, Lot Sizes & Leverage with Real Mark-to-Market PnL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Interactive Account Capital Config Strip */}
        <div className="bg-[#0e1422] border-b border-[#1e293b] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
              <DollarSign className="w-4 h-4" />
              <span>PAPER ACCOUNT CAPITAL:</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-mono text-xs">$</span>
              <input
                type="number"
                min="100"
                step="500"
                value={customCapital}
                onChange={(e) => setCustomCapital(parseFloat(e.target.value) || 0)}
                onBlur={() => handleUpdateCapital(customCapital)}
                className="w-24 bg-[#141b2d] border border-emerald-500/30 text-emerald-300 font-mono font-extrabold text-xs px-2 py-1 rounded-lg focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => handleUpdateCapital(customCapital)}
                className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold transition-all"
              >
                {capitalUpdating ? 'Updating...' : 'Set'}
              </button>
            </div>
          </div>

          {/* Capital Quick Presets */}
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-slate-500">Presets:</span>
            {capitalPresets.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => handleUpdateCapital(cap)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  customCapital === cap
                    ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-[#141b2d] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                ${cap >= 1000 ? `${cap / 1000}k` : cap}
              </button>
            ))}
          </div>

          {/* Account Balance Snapshot */}
          {execState && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">EQUITY</span>
                <span className="text-white font-bold">${execState.account.equity.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">AVAIL MARGIN</span>
                <span className="text-slate-300 font-bold">${execState.account.available_margin.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">WIN RATE</span>
                <span className="text-cyan-400 font-bold">
                  {execState.account.win_rate_pct}% ({execState.account.win_count}W/{execState.account.loss_count}L)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Two Columns (Order Config Form + Positions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-y-auto">
          {/* Left 7 Columns: Order Placement Form */}
          <div className="lg:col-span-7 space-y-4">
            {/* Long / Short Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                  side === 'BUY'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
                    : 'bg-[#121929] text-slate-400 border-[#1e293b] hover:border-slate-600'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>LONG / BUY</span>
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                  side === 'SELL'
                    ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/25'
                    : 'bg-[#121929] text-slate-400 border-[#1e293b] hover:border-slate-600'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>SHORT / SELL</span>
              </button>
            </div>

            {/* 2. Lot Size / Quantity Configuration */}
            <div className="bg-[#121929] border border-[#1e293b] p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-cyan-300 font-bold uppercase flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Contract Size / Lot Size ({defaultSymbol.includes('XAU') ? 'Lots' : 'Units'})</span>
                </label>
                {defaultQuantity && (
                  <button
                    type="button"
                    onClick={() => setQuantity(defaultQuantity)}
                    className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md hover:bg-cyan-500/25 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Rec: {defaultQuantity}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0.001, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-[#0b101b] border border-[#1e293b] rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="text-[11px] font-mono text-slate-400 px-3 py-2 bg-[#0b101b] rounded-xl border border-[#1e293b]">
                  Notional: <strong className="text-white">${notionalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* Quick Lot Presets */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                {lotPresets.map((lp) => (
                  <button
                    key={lp}
                    type="button"
                    onClick={() => setQuantity(lp)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                      quantity === lp
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-[#0b101b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lp}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Leverage Configuration */}
            <div className="bg-[#121929] border border-[#1e293b] p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Leverage Multiplier</span>
                </label>
                <div className="flex items-center gap-1 text-xs font-mono font-bold">
                  <span className="text-slate-400">Margin:</span>
                  <span className="text-emerald-400">${marginReq.toFixed(2)}</span>
                </div>
              </div>

              {/* Leverage Preset Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {leveragePresets.map((lev) => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setLeverage(lev)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      leverage === lev
                        ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                        : 'bg-[#0b101b] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>

              {/* Custom Leverage Input */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                <span className="text-slate-400">Custom Leverage:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leverage}
                    onChange={(e) => setLeverage(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-16 bg-[#0b101b] border border-[#1e293b] rounded-lg px-2 py-1 text-xs font-mono text-center text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-slate-400">x</span>
                </div>
              </div>

              {leverage > 20 && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>High Leverage Hazard: Price wicks may trigger quick liquidation.</span>
                </div>
              )}
            </div>

            {/* SL & TP Targets */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121929] border border-red-500/20 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-red-400 font-bold">
                  <span>Stop Loss ($)</span>
                  <span>-${maxDollarLoss.toFixed(2)} ({maxDollarLossPct.toFixed(1)}%)</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b101b] border border-red-500/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="bg-[#121929] border border-emerald-500/20 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-emerald-400 font-bold">
                  <span>Take Profit ($)</span>
                  <span>+${projectedGain.toFixed(2)} ({projectedGainPct.toFixed(1)}%)</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b101b] border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Execution Feedback / Error */}
            {execMessage && (
              <div className={`p-3 rounded-xl text-xs font-mono border flex items-center gap-2 ${
                execMessage.startsWith('Error') || execMessage.startsWith('Network')
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {execMessage.startsWith('Error') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{execMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleExecute}
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-mono font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                side === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {submitting ? 'Transmitting Order...' : `EXECUTE ${side} ${quantity} ${defaultSymbol} (${leverage}x)`}
              </span>
            </button>
          </div>

          {/* Right 5 Columns: Active Positions & Live PnL */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#1e293b]">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
                Active Positions ({execState?.open_positions.length || 0})
              </h3>
              <button
                type="button"
                onClick={fetchState}
                className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Positions List */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {!execState || execState.open_positions.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500 bg-[#121929] rounded-2xl border border-[#1e293b]">
                  No open positions. Use the form on the left to deploy sample trades.
                </div>
              ) : (
                execState.open_positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="bg-[#121929] border border-[#1e293b] p-3.5 rounded-2xl space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          pos.side === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {pos.side} {pos.leverage}x
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{pos.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Qty: {pos.quantity}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClosePosition(pos.id)}
                        className="text-[10px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-400 border border-rose-500/40 px-2 py-1 rounded-lg transition-all"
                      >
                        CLOSE
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#0b101b] p-2 rounded-xl">
                      <div>
                        <span className="text-slate-500 block text-[9px]">ENTRY:</span>
                        <span className="text-slate-200">${pos.entry_price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">CURRENT:</span>
                        <span className="text-slate-200">${pos.current_price.toLocaleString()}</span>
                      </div>
                      {pos.stop_loss && (
                        <div>
                          <span className="text-slate-500 block text-[9px]">SL:</span>
                          <span className="text-red-400">${pos.stop_loss.toLocaleString()}</span>
                        </div>
                      )}
                      {pos.take_profit && (
                        <div>
                          <span className="text-slate-500 block text-[9px]">TP:</span>
                          <span className="text-emerald-400">${pos.take_profit.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#1e293b] text-xs font-mono">
                      <span className="text-slate-500">Unrealized PnL:</span>
                      <span className={`font-bold ${pos.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.unrealized_pnl >= 0 ? `+$${pos.unrealized_pnl}` : `-$${Math.abs(pos.unrealized_pnl)}`} ({pos.unrealized_pnl_pct}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeExecutionModal;
