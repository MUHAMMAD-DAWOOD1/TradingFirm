import React, { useState, useEffect } from "react";
import { TopNav } from "./components/TopNav";
import { TradeScreen } from "./screens/TradeScreen";
import { SignalsScreen } from "./screens/SignalsScreen";
import { PositionsScreen } from "./screens/PositionsScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { VaultScreen } from "./screens/VaultScreen";
import { BacktestScreen } from "./screens/BacktestScreen";
import { InstitutionalCotScreen } from "./screens/InstitutionalCotScreen";
import { AgentDeepDiveDrawer } from "./components/AgentDeepDiveDrawer";
import { ManageChannelsModal } from "./components/ManageChannelsModal";

export default function App() {
  // Theme Management (Light vs Dark OLED)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("nexus_theme");
    return saved ? saved === "dark" : true; // Default to OLED Dark
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("nexus_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("nexus_theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Navigation State (5 Top-Level Tabs)
  const [activeTab, setActiveTab] = useState<string>("trade");

  // Secondary Surfaces State (Exactly 2 secondary surfaces)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);

  // Selected Asset & Intelligence Dossier
  const [selectedAsset, setSelectedAsset] = useState<string>("XAUUSD");
  const [reportData, setReportData] = useState<any>(null);

  // Account State & Live Market Assets
  const [accountEquity, setAccountEquity] = useState<number>(100000.00);
  const [mt5Connected, setMt5Connected] = useState<boolean>(true);
  const [prefilledSignal, setPrefilledSignal] = useState<any>(null);

  // Default Assets fallback
  const defaultAssets = [
    { symbol: "XAUUSD", name: "Gold Spot", category: "commodity", price: 2684.40, change24h: 1.84, shariah_status: "Shariah Compliant", tradingview_symbol: "OANDA:XAUUSD" },
    { symbol: "BTC", name: "Bitcoin", category: "crypto", price: 68420.50, change24h: 1.18, shariah_status: "Permissible", tradingview_symbol: "BINANCE:BTCUSDT" },
    { symbol: "ETH", name: "Ethereum", category: "crypto", price: 2642.15, change24h: 2.45, shariah_status: "Permissible", tradingview_symbol: "BINANCE:ETHUSDT" },
    { symbol: "SOL", name: "Solana", category: "crypto", price: 178.90, change24h: -3.12, shariah_status: "Permissible", tradingview_symbol: "BINANCE:SOLUSDT" },
    { symbol: "BNB", name: "BNB Chain", category: "crypto", price: 588.20, change24h: 0.85, shariah_status: "Permissible", tradingview_symbol: "BINANCE:BNBUSDT" },
    { symbol: "EURUSD", name: "Euro / US Dollar", category: "forex", price: 1.0842, change24h: 0.42, shariah_status: "Forex Spot", tradingview_symbol: "FX:EURUSD" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", category: "forex", price: 1.3065, change24h: -0.18, shariah_status: "Forex Spot", tradingview_symbol: "FX:GBPUSD" },
    { symbol: "XAGUSD", name: "Silver Spot", category: "commodity", price: 31.48, change24h: 1.64, shariah_status: "Shariah Compliant", tradingview_symbol: "OANDA:XAGUSD" },
    { symbol: "NDX100", name: "Nasdaq 100", category: "index", price: 20384.50, change24h: 1.22, shariah_status: "Index Spot", tradingview_symbol: "NASDAQ:NDX" },
  ];

  const [assets, setAssets] = useState<any[]>(defaultAssets);

  // 1. Initial Assets Fetch & Health Check
  const fetchAssets = () => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.assets) && d.assets.length > 0) {
          setAssets(d.assets);
        }
      })
      .catch(() => {});
  };

  const fetchHealthAndState = () => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        if (h && typeof h.mt5_bridge_connected === "boolean") {
          setMt5Connected(h.mt5_bridge_connected);
        }
      })
      .catch(() => {});

    fetch("/api/execution/state")
      .then((r) => r.json())
      .then((s) => {
        if (s && s.account && typeof s.account.equity === "number") {
          setAccountEquity(s.account.equity);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAssets();
    fetchHealthAndState();
    const assetsInterval = setInterval(fetchAssets, 20000);
    const healthInterval = setInterval(fetchHealthAndState, 3000);
    return () => {
      clearInterval(assetsInterval);
      clearInterval(healthInterval);
    };
  }, []);

  // 2. Fetch Active Asset Dossier for Drawer
  const fetchDossier = (sym: string) => {
    fetch(`/api/reports/latest/${sym}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.asset) {
          setReportData(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDossier(selectedAsset);
  }, [selectedAsset]);

  // 3. WebSocket Real-Time Tick Streamer
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/ticks`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const tick = JSON.parse(event.data);
            if (!tick || !tick.pair) return;

            setAssets((prev) =>
              prev.map((a) => {
                const targetPair = a.symbol === "XAUUSD" ? "PAXGUSDT" : `${a.symbol}USDT`;
                if (tick.pair === targetPair || tick.symbol === a.symbol) {
                  return {
                    ...a,
                    price: tick.price,
                    change24h: tick.change_24h !== undefined ? tick.change_24h : a.change24h,
                    high24h: tick.high_24h,
                    low24h: tick.low_24h,
                  };
                }
                return a;
              })
            );
          } catch (e) {}
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handler: Deploy signal from Signals screen into Trade screen
  const handleDeploySignal = (sig: any) => {
    if (sig) {
      if (sig.asset) {
        setSelectedAsset(sig.asset);
      }
      setPrefilledSignal(sig);
    }
    setActiveTab("trade");
  };

  return (
    <div className="min-h-screen bg-canvas text-main flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        accountEquity={accountEquity}
        mt5Connected={mt5Connected}
      />

      {/* Dynamic Screen Viewport */}
      <div className="flex-1 w-full">
        {activeTab === "trade" && (
          <TradeScreen
            assets={assets}
            selectedSymbol={selectedAsset}
            onSelectSymbol={(sym) => {
              setSelectedAsset(sym);
              setPrefilledSignal(null);
            }}
            onOpenDeepDive={() => setIsDrawerOpen(true)}
            isDark={isDark}
            onTradeExecuted={() => {
              fetchAssets();
              fetchHealthAndState();
            }}
            prefilledSignal={prefilledSignal}
          />
        )}

        {activeTab === "signals" && (
          <SignalsScreen
            onOpenManageChannels={() => setIsChannelsModalOpen(true)}
            onDeploySignal={handleDeploySignal}
            isDark={isDark}
          />
        )}

        {activeTab === "positions" && (
          <PositionsScreen
            onNewOrder={() => setActiveTab("trade")}
            isDark={isDark}
          />
        )}

        {activeTab === "macro" && <InstitutionalCotScreen isDark={isDark} />}

        {activeTab === "backtest" && <BacktestScreen isDark={isDark} />}

        {activeTab === "calendar" && <CalendarScreen isDark={isDark} />}

        {activeTab === "vault" && <VaultScreen isDark={isDark} />}
      </div>

      {/* Secondary Surface 1: Agent Deep-Dive Drawer (Slide-Over from Right) */}
      <AgentDeepDiveDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        asset={selectedAsset}
        reportData={reportData}
        isDark={isDark}
      />

      {/* Secondary Surface 2: Manage Channels Modal (Centered Popup) */}
      <ManageChannelsModal
        isOpen={isChannelsModalOpen}
        onClose={() => setIsChannelsModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
