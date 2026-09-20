import React from "react";
import { DemoAccount } from "./DemoAccountManagerModal";

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  accountEquity?: number;
  mt5Connected?: boolean;
  activeAccount?: DemoAccount | null;
  onOpenAccountManager?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  accountEquity = 84250.00,
  mt5Connected = true,
  activeAccount,
  onOpenAccountManager,
}) => {
  const navItems = [
    { id: "trade", label: "Trade" },
    { id: "macro", label: "Macro & COT" },
    { id: "signals", label: "Signals" },
    { id: "positions", label: "Positions" },
    { id: "backtest", label: "Backtest Lab" },
    { id: "calendar", label: "Calendar" },
    { id: "vault", label: "Vault" },
  ];

  return (
    <header className="w-full bg-surface border-b border-border-subtle sticky top-0 z-40 transition-colors duration-200">
      <div className="flex justify-between items-center w-full px-4 lg:px-8 py-3 max-w-[1600px] mx-auto">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab("trade")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
            <div className="w-3.5 h-3.5 rounded-full bg-surface transition-colors duration-200" />
          </div>
          <span className="tracking-tight text-main font-extrabold text-[17px]">
            Nexus Capital
          </span>
        </div>

        {/* Persistent 5-Tab Segmented Navigation Bar */}
        <nav className="hidden md:flex items-center bg-well border border-border-subtle rounded-full p-1 gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-150 ${
                  isActive
                    ? isDark
                      ? "bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                      : "bg-black text-white font-bold shadow-sm"
                    : "text-muted hover:text-main"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-2.5">
          {/* MT5 Status Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-well border border-border-subtle px-3 py-1.5 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                mt5Connected
                  ? "bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span className="font-semibold text-main text-[12px] tracking-tight">
              {mt5Connected ? "MT5 Connected" : "MT5 Standby"}
            </span>
          </div>

          {/* Interactive Demo Account Switcher Chip */}
          <button
            type="button"
            onClick={onOpenAccountManager}
            title="Manage and switch demo trading accounts"
            className="flex items-center gap-2 bg-well hover:bg-well-hover border border-border-subtle hover:border-amber-400/50 px-3.5 py-1.5 rounded-full transition-all cursor-pointer group active:scale-95 shadow-sm"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">
                account_balance_wallet
              </span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted uppercase font-bold tracking-tight">
                  {activeAccount ? activeAccount.name : "DEMO ACCOUNT"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="font-mono text-[12px] font-extrabold text-main tabular-nums leading-none">
                ${(activeAccount ? activeAccount.equity : accountEquity).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="material-symbols-outlined text-muted text-[16px] group-hover:text-amber-400 transition-colors ml-0.5">
              expand_more
            </span>
          </button>

          {/* Theme Toggle Button (Light / Dark OLED) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-full bg-well border border-border-subtle flex items-center justify-center text-muted hover:text-main hover:border-border-strong transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-9 h-9 rounded-full bg-well-subtle border border-border-strong flex items-center justify-center cursor-pointer hover:border-amber-400/50 transition-colors">
            <span className="text-[12px] text-main font-bold">NC</span>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Nav Bar */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-border-subtle bg-surface">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                isActive
                  ? isDark
                    ? "bg-white text-black font-bold"
                    : "bg-black text-white font-bold"
                  : "text-muted"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
