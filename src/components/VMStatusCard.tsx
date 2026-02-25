'use client';

import { useState } from 'react';
import { VMStatus } from '@/types';

interface VMStatusCardProps {
  vmName: string;
  ip?: string;
  status: VMStatus;
  onRestart: () => Promise<void>;
  onConfigure: (config: { telegramBotToken: string; anthropicApiKey: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleting?: boolean;
}

const STATUS_META: Record<VMStatus, { label: string; dot: string; text: string }> = {
  provisioning: { label: 'Provisioning', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300' },
  running:      { label: 'Running',      dot: 'bg-emerald-400',             text: 'text-emerald-300' },
  stopped:      { label: 'Stopped',      dot: 'bg-red-400',                text: 'text-red-300' },
  error:        { label: 'Error',        dot: 'bg-red-500 animate-pulse',  text: 'text-red-300' },
};

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/15 transition-colors';

export default function VMStatusCard({ vmName, ip, status, onRestart, onConfigure, onDelete, deleting }: VMStatusCardProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const sm = STATUS_META[status] ?? STATUS_META.stopped;

  const handleRestart = async () => {
    setLoading(true); setMsg(null);
    try { await onRestart(); setMsg({ text: 'Instance restarting…', ok: true }); }
    catch { setMsg({ text: 'Failed to restart.', ok: false }); }
    finally { setLoading(false); }
  };

  const handleConfigure = async () => {
    setLoading(true); setMsg(null);
    try {
      await onConfigure({ telegramBotToken, anthropicApiKey });
      setMsg({ text: 'Configuration updated.', ok: true });
      setShowConfig(false);
      setTelegramBotToken(''); setAnthropicApiKey('');
    } catch { setMsg({ text: 'Failed to update.', ok: false }); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[15px] text-white/80">Instance Status</h3>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/[0.04] ${sm.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
          {sm.label}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2.5 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-white/30">VM Name</span>
          <span className="font-mono text-[12px] text-white/50 bg-white/[0.04] rounded-md px-2 py-0.5">{vmName}</span>
        </div>
        {ip && (
          <div className="flex items-center justify-between">
            <span className="text-white/30">IP Address</span>
            <span className="font-mono text-[12px] text-white/50 bg-white/[0.04] rounded-md px-2 py-0.5">{ip}</span>
          </div>
        )}
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`text-[12px] px-3 py-2 rounded-lg ${msg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRestart}
          disabled={loading || deleting || status !== 'running'}
          className="flex-1 py-2 rounded-lg bg-[rgb(255,79,90)] text-white text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-20"
        >
          {loading ? 'Working…' : 'Restart'}
        </button>
        <button
          onClick={() => { setShowConfig(!showConfig); setMsg(null); }}
          disabled={deleting}
          className="flex-1 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 text-[13px] font-medium hover:bg-white/[0.06] transition-all disabled:opacity-20"
        >
          {showConfig ? 'Cancel' : 'Configure'}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={loading || deleting}
            className="px-3 py-2 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-20"
          >
            {deleting ? (
              <span className="w-4 h-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin inline-block" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            )}
          </button>
        )}
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Update Configuration</p>
          <div>
            <label className="block text-[12px] text-white/30 mb-1.5">Telegram Bot Token</label>
            <input type="text" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} className={inputCls} placeholder="1234567890:ABC..." />
          </div>
          <div>
            <label className="block text-[12px] text-white/30 mb-1.5">Anthropic API Key</label>
            <input type="password" value={anthropicApiKey} onChange={(e) => setAnthropicApiKey(e.target.value)} className={inputCls} placeholder="sk-ant-..." />
          </div>
          <button
            onClick={handleConfigure}
            disabled={loading || !telegramBotToken || !anthropicApiKey}
            className="w-full py-2.5 rounded-lg bg-[rgb(255,79,90)] text-white text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-20"
          >
            {loading ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  );
}
