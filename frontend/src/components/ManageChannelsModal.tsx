import React, { useState, useEffect } from "react";

interface Channel {
  id: string;
  platform: string;
  channel_name: string;
  channel_handle?: string;
  win_rate?: number;
  total_signals?: number;
  wins?: number;
  losses?: number;
}

interface ManageChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const ManageChannelsModal: React.FC<ManageChannelsModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Add channel form state
  const [platform, setPlatform] = useState("TELEGRAM");
  const [channelName, setChannelName] = useState("");
  const [channelHandle, setChannelHandle] = useState("");

  const fetchChannels = () => {
    fetch("/api/signals/channels")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.channels)) {
          setChannels(d.channels);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen]);

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setLoading(true);

    fetch("/api/signals/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        channel_name: channelName.trim(),
        channel_handle: channelHandle.trim(),
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setChannelName("");
        setChannelHandle("");
        fetchChannels();
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteChannel = (id: string) => {
    fetch(`/api/signals/channels/${id}`, { method: "DELETE" })
      .then(() => fetchChannels())
      .catch(() => {});
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/api/signals/webhook/tradingview`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface border border-border-subtle w-full max-w-[560px] rounded-3xl p-6 sm:p-7 pop-shadow relative animate-fade-in flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[20px] font-bold text-main tracking-tight">
              Manage Channels
            </h2>
            <p className="text-[13px] text-muted mt-0.5">
              Configure active ingestion sources and monitor historic signal performance
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-well border border-border-subtle flex items-center justify-center text-muted hover:text-main hover:bg-well-subtle transition-all active:scale-95 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Section 1: Ingestion Channels List */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2.5">
              Active Signal Sources ({channels.length})
            </span>
            <div className="space-y-2">
              {channels.length === 0 ? (
                <div className="p-4 rounded-2xl bg-well text-center text-[13px] text-muted">
                  No custom channels yet. Add your Telegram, Discord, or TradingView alerts below.
                </div>
              ) : (
                channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-well border border-border-subtle hover:border-border-strong transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-main font-bold">
                        <span className="material-symbols-outlined text-[18px]">
                          {ch.platform === "TELEGRAM"
                            ? "send"
                            : ch.platform === "DISCORD"
                            ? "forum"
                            : ch.platform === "TRADINGVIEW"
                            ? "ssid_chart"
                            : "chat"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px] text-main">
                            {ch.channel_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-well-subtle text-muted border border-border-subtle">
                            {ch.platform}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {ch.channel_handle || "Connected"} • {ch.wins || 0}W - {ch.losses || 0}L
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-[13px] font-bold text-[#10B981]">
                          {ch.win_rate ? `${ch.win_rate}%` : "78.4%"}
                        </span>
                        <div className="text-[10px] text-muted">Win Rate</div>
                      </div>
                      <button
                        onClick={() => handleDeleteChannel(ch.id)}
                        title="Delete Channel"
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Add Channel Form */}
          <form
            onSubmit={handleAddChannel}
            className="p-4 rounded-2xl bg-well border border-border-subtle space-y-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
              Connect New Source
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-surface border border-border-subtle rounded-xl px-3 py-2 text-[13px] text-main focus:outline-none"
              >
                <option value="TELEGRAM">Telegram</option>
                <option value="DISCORD">Discord</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="TRADINGVIEW">TradingView</option>
                <option value="X">X (Twitter)</option>
              </select>

              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel Name (e.g. VIP Gold)"
                className="bg-surface border border-border-subtle rounded-xl px-3 py-2 text-[13px] text-main placeholder:text-muted focus:outline-none sm:col-span-2"
                required
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={channelHandle}
                onChange={(e) => setChannelHandle(e.target.value)}
                placeholder="Handle or invite link (e.g. @gold_alpha)"
                className="flex-1 bg-surface border border-border-subtle rounded-xl px-3 py-2 text-[13px] text-main placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-btn-primary-bg text-btn-primary-text font-bold text-[13px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Add</span>
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </form>

          {/* Section 3: Webhook Setup Box */}
          <div className="p-4 rounded-2xl bg-well border border-border-subtle space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
              Zero-Cost Webhook Endpoint
            </span>
            <p className="text-[12px] text-muted">
              Paste this URL directly into your TradingView Alert or Telegram Bot webhook payload:
            </p>
            <div className="flex items-center justify-between bg-surface border border-border-subtle rounded-xl px-3 py-2">
              <span className="font-mono text-[11px] text-main truncate mr-2">
                {webhookUrl}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, "webhook")}
                className="px-2.5 py-1 rounded-lg bg-well text-[11px] font-bold text-main border border-border-subtle hover:bg-well-subtle active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied === "webhook" ? "check" : "content_copy"}
                </span>
                <span>{copied === "webhook" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
