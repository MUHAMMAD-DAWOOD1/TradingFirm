import React from "react";
import { 
  LayoutDashboard, 
  Coins, 
  CircleDollarSign, 
  FileText, 
  History, 
  Settings, 
  ShieldCheck, 
  Zap,
  Radio
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "signals", label: "Signal Alpha Feed", icon: Radio, badge: "Live" },
  { id: "xauusd", label: "XAU/USD Gold", icon: CircleDollarSign, badge: "Spot" },
  { id: "crypto", label: "Crypto Assets", icon: Coins, badge: "22" },
  { id: "reports", label: "Reports & Intel", icon: FileText },
  { id: "history", label: "Decision History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="w-64 bg-[#14161A] border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between p-4 min-h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22D3EE] via-[#8B5CF6] to-[#10B981] flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-base text-white">NEXUS</span>
              <span className="text-[10px] font-mono tracking-widest text-[#22D3EE] uppercase px-1.5 py-0.5 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/20">
                CAPITAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Institutional AI Trading</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-[#1B1E24] text-white border border-[rgba(255,255,255,0.12)] shadow-glass-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1B1E24]/60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#22D3EE]" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 bg-[#0A0B0D] border border-[rgba(255,255,255,0.06)] rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Risk Engine Active</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Engine: Gemini 3.6 Flash
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
