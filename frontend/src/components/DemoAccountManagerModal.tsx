import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Check,
  RotateCcw,
  Trash2,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Layers
} from 'lucide-react';

export interface DemoAccount {
  id: string;
  name: string;
  currency: string;
  initial_capital: number;
  balance: number;
  equity: number;
  margin_used: number;
  available_margin: number;
  realized_pnl: number;
  win_count: number;
  loss_count: number;
  is_active: number;
  leverage?: number;
  created_at?: string;
  updated_at?: string;
}

interface DemoAccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: DemoAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => Promise<void>;
  onCreateAccount: (name: string, capital: number, setActive: boolean, leverage?: number) => Promise<void>;
  onResetAccount: (id: string, capital?: number) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onUpdateAccountSettings?: (id: string, name?: string, leverage?: number) => Promise<void>;
  isDark?: boolean;
}

export const DemoAccountManagerModal: React.FC<DemoAccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSwitchAccount,
  onCreateAccount,
  onResetAccount,
  onDeleteAccount,
  onUpdateAccountSettings,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'create'>('accounts');
  
  // Create Account State
  const [newName, setNewName] = useState<string>('');
  const [newCapital, setNewCapital] = useState<string>('10000');
  const [newLeverage, setNewLeverage] = useState<string>('100');
  const [setAsActiveImmediately, setSetAsActiveImmediately] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Account State
  const [resettingAccountId, setResettingAccountId] = useState<string | null>(null);
  const [resetCapital, setResetCapital] = useState<string>('10000');
  const [resetLeverage, setResetLeverage] = useState<string>('100');
  const [resetting, setResetting] = useState<boolean>(false);

  // Switching & Deleting States
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickCapitalPresets = [
    { label: '$50', value: 50 },
    { label: '$200', value: 200 },
    { label: '$1,000', value: 1000 },
    { label: '$5,000', value: 5000 },
    { label: '$10,000', value: 10000 },
    { label: '$50,000', value: 50000 },
    { label: '$100,000', value: 100000 },
    { label: '$1,000,000', value: 1000000 },
    { label: '$20,000,000', value: 20000000 },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const capNum = parseFloat(newCapital);
    if (isNaN(capNum) || capNum < 1) {
      setCreateError('Please enter a valid capital amount (minimum $1.00)');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const defaultTitle = `Demo ${capNum >= 1000000 ? `$${(capNum / 1000000).toFixed(1)}M` : capNum >= 1000 ? `$${(capNum / 1000).toFixed(0)}k` : `$${capNum}`}`;
      const levNum = parseFloat(newLeverage) || 100;
      await onCreateAccount(newName.trim() || defaultTitle, capNum, setAsActiveImmediately, levNum);
      setNewName('');
      setNewCapital('10000');
      setNewLeverage('100');
      setActiveTab('accounts');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create demo account');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = async (id: string) => {
    if (id === activeAccountId) return;
    setSwitchingId(id);
    try {
      await onSwitchAccount(id);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (accounts.length <= 1) return;
    if (!window.confirm('Are you sure you want to delete this demo account and its trade history?')) return;
    setDeletingId(id);
    try {
      await onDeleteAccount(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmReset = async () => {
    if (!resettingAccountId) return;
    setResetting(true);
    try {
      const capNum = parseFloat(resetCapital);
      const levNum = parseFloat(resetLeverage);
      await onResetAccount(resettingAccountId, !isNaN(capNum) && capNum >= 1 ? capNum : undefined);
      if (onUpdateAccountSettings && !isNaN(levNum) && levNum >= 1) {
        await onUpdateAccountSettings(resettingAccountId, undefined, levNum);
      }
      setResettingAccountId(null);
    } finally {
      setResetting(false);
    }
  };

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border ${
        isDark ? 'bg-[#0e131f] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-[#121929] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight font-mono">
                  DEMO TRADING ACCOUNTS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  {accounts.length} Active {accounts.length === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real broker simulation with isolated balance, equity & persistent progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Switcher */}
            <div className={`flex items-center rounded-xl p-1 border text-xs font-mono font-bold ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'accounts'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Accounts ({accounts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Account</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Account Spotlight Banner */}
          {activeAccount && (
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30'
                : 'bg-gradient-to-r from-amber-50 via-slate-50 to-white border-amber-300'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      CURRENT ACTIVE SYSTEM ACCOUNT
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {activeAccount.id}</span>
                  </div>
                  <h3 className="text-lg font-black font-mono text-white tracking-tight flex items-center gap-2">
                    {activeAccount.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    All AI trade solutions, sizing recommendations, and execution orders are tailored to this capital.
                  </p>
                </div>

                <div className="flex items-center gap-6 font-mono text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">BALANCE</span>
                    <span className="text-base font-black text-white">
                      ${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">LIVE EQUITY</span>
                    <span className="text-base font-black text-emerald-400">
                      ${activeAccount.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">REALIZED P&L</span>
                    <span className={`text-base font-black flex items-center justify-end gap-1 ${
                      activeAccount.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {activeAccount.realized_pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {activeAccount.realized_pnl >= 0 ? `+$${activeAccount.realized_pnl.toFixed(2)}` : `-$${Math.abs(activeAccount.realized_pnl).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ACCOUNTS LIST */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Select an account to switch the entire trading environment:</span>
                <span className="text-[11px] text-slate-500">
                  {accounts.length} total demo accounts created
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const isActive = acc.id === activeAccountId;
                  const totalTrades = (acc.win_count || 0) + (acc.loss_count || 0);
                  const winRate = totalTrades > 0 ? ((acc.win_count / totalTrades) * 100).toFixed(0) : '0';
                  const returnPct = acc.initial_capital > 0 ? ((acc.realized_pnl / acc.initial_capital) * 100).toFixed(2) : '0.00';

                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isActive
                          ? isDark
                            ? 'bg-[#131a2b] border-amber-500/60 shadow-xl shadow-amber-500/10'
                            : 'bg-amber-50/60 border-amber-400 shadow-md'
                          : isDark
                          ? 'bg-[#101624] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Name & Active Badge */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">
                              {acc.name}
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-black flex items-center gap-1">
                                <Check className="w-3 h-3" /> ACTIVE
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {acc.id}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Reset Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setResettingAccountId(acc.id);
                                setResetCapital(String(acc.initial_capital));
                              }}
                              title="Reset account capital or clear trades"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (disabled if only 1 account) */}
                            {accounts.length > 1 && (
                              <button
                                type="button"
                                disabled={deletingId === acc.id}
                                onClick={() => handleDelete(acc.id)}
                                title="Delete account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Balance Grid */}
                        <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl font-mono text-xs mb-3 ${
                          isDark ? 'bg-[#090d16]' : 'bg-slate-50'
                        }`}>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">STARTING CAPITAL</span>
                            <span className="text-slate-200 font-extrabold">
                              ${acc.initial_capital.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">CURRENT BALANCE</span>
                            <span className="text-white font-black">
                              ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">AVAILABLE MARGIN</span>
                            <span className="text-emerald-400 font-extrabold">
                              ${acc.available_margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">RETURN & WIN RATE</span>
                            <span className={`font-black ${acc.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {acc.realized_pnl >= 0 ? `+${returnPct}%` : `${returnPct}%`} ({winRate}% WR)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            1:{acc.leverage || 100} Lev
                          </span>
                          <span>
                            {totalTrades} closed ({acc.win_count}W / {acc.loss_count}L)
                          </span>
                        </div>

                        {!isActive && (
                          <button
                            type="button"
                            disabled={switchingId === acc.id}
                            onClick={() => handleSwitch(acc.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>{switchingId === acc.id ? 'Switching...' : 'Switch Account'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW DEMO ACCOUNT FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="max-w-2xl mx-auto space-y-5">
              <div className={`p-4 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#121929] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Create Custom Demo Account (No Limits)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Set any custom starting capital: from small \$10 micro test accounts to \$50,000 prop challenges or \$20,000,000+ institutional funds.
                </p>
              </div>

              {/* Account Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  Account Name / Label:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Micro $50, High Capital $50,000, 20M Whale Fund"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:border-amber-400 ${
                    isDark ? 'bg-[#090d16] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Custom Capital Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Custom Starting Capital (USD):</span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    ${parseFloat(newCapital || '0').toLocaleString('en-US')}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={newCapital}
                    onChange={(e) => setNewCapital(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border text-base font-mono font-black focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#090d16] border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-amber-600'
                    }`}
                  />
                </div>

                {/* Quick Presets Buttons */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Quick Presets (or type any custom figure above):</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {quickCapitalPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setNewCapital(String(preset.value))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          newCapital === String(preset.value)
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isDark
                            ? 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Leverage Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Account Leverage Multiplier
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Active: 1:{newLeverage}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newLeverage}
                    onChange={(e) => setNewLeverage(e.target.value)}
                    placeholder="100"
                    className={`w-full px-4 py-3 rounded-xl border text-base font-mono font-black focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#090d16] border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-amber-600'
                    }`}
                  />
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Broker Leverage Presets:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[30, 50, 100, 200, 500].map((lev) => (
                      <button
                        key={lev}
                        type="button"
                        onClick={() => setNewLeverage(String(lev))}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          newLeverage === String(lev)
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isDark
                            ? 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        1:{lev}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    ℹ️ Real broker rule: Leverage is configured once at the account level. Individual trade orders won't prompt you for leverage every time.
                  </p>
                </div>
              </div>

              {/* Set as Active Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="set-active-check"
                  checked={setAsActiveImmediately}
                  onChange={(e) => setSetAsActiveImmediately(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="set-active-check" className="text-xs font-mono text-slate-300 cursor-pointer">
                  Switch to this demo account immediately upon creation
                </label>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{creating ? 'Creating Demo Account...' : 'Create Demo Account'}</span>
              </button>
            </form>
          )}

          {/* Reset Account Sub-Dialog */}
          {resettingAccountId && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className={`w-full max-w-md p-5 rounded-2xl border space-y-4 shadow-2xl ${
                isDark ? 'bg-[#101624] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-sm flex items-center gap-2 text-amber-400">
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Account Capital &amp; Leverage</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setResettingAccountId(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Resetting will cancel any open orders and restart your balance with fresh capital.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">New Capital Amount ($):</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={resetCapital}
                    onChange={(e) => setResetCapital(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-sm focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#090d16] border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-amber-600'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300">Account Leverage Multiplier (1:x):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={resetLeverage}
                    onChange={(e) => setResetLeverage(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-sm focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-[#090d16] border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-amber-600'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingAccountId(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={handleConfirmReset}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoAccountManagerModal;
