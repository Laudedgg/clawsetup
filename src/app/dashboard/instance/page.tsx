'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import VMStatusCard from '@/components/VMStatusCard';

const inputCls = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[rgb(255,79,90)]/50 transition-colors';

type InstanceItem = {
  id: string;
  vmName: string;
  label: string | null;
  ip: string | null;
  status: string;
  zone: string;
  createdAt: string;
};

export default function InstancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [instances, setInstances] = useState<InstanceItem[]>([]);
  const [instanceSlots, setInstanceSlots] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [instanceLabel, setInstanceLabel] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [buyingSlot, setBuyingSlot] = useState(false);

  // Active instance for logs
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logs, setLogs] = useState('');
  const [logsOpen, setLogsOpen] = useState(false);
  const logsRef = useRef<HTMLPreElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/provisioner/instances');
      if (res.ok) {
        const data = await res.json();
        setInstances(data.instances || []);
        setInstanceSlots(data.instanceSlots || 1);
        // Auto-select first instance if none selected
        if (data.instances?.length > 0 && !activeId) {
          setActiveId(data.instances[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  const fetchLogs = useCallback(async (instId: string) => {
    try {
      const res = await fetch(`/api/provisioner/logs?instanceId=${instId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || '');
        if (data.done) {
          setInstances(prev => prev.map(i => i.id === instId ? { ...i, status: 'running' } : i));
          return true;
        }
      }
    } catch { /* silent */ }
    return false;
  }, []);

  // Poll logs for provisioning instances
  useEffect(() => {
    const provisioningInstance = instances.find(i => i.status === 'provisioning');
    if (provisioningInstance) {
      const pollId = provisioningInstance.id;
      setActiveId(pollId);
      setLogsOpen(true);
      pollRef.current = setInterval(async () => {
        const done = await fetchLogs(pollId);
        await fetchInstances();
        if (done && pollRef.current) clearInterval(pollRef.current);
      }, 5000);
      fetchLogs(pollId);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [instances.map(i => i.status).join(','), fetchLogs, fetchInstances]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const tier = (session?.user as any)?.tier;
      const paymentStatus = (session?.user as any)?.paymentStatus;
      if (tier !== 'tier3' || paymentStatus !== 'completed') {
        router.push('/dashboard');
      } else {
        fetchInstances();
      }
    }
  }, [status, session, router, fetchInstances]);

  const handleCreateInstance = async () => {
    if (!telegramToken || !anthropicKey) {
      setMsg({ text: 'Both tokens are required.', ok: false }); return;
    }
    setCreating(true); setMsg(null);
    try {
      const res = await fetch('/api/provisioner/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: telegramToken,
          anthropicApiKey: anthropicKey,
          label: instanceLabel.trim() || undefined,
        }),
      });
      if (res.ok) {
        setMsg({ text: 'VM created! Startup script is running — watch the logs below.', ok: true });
        setShowCreateForm(false);
        setTelegramToken(''); setAnthropicKey(''); setInstanceLabel('');
        await fetchInstances();
      } else {
        const data = await res.json();
        setMsg({ text: data.error || 'Failed to create instance.', ok: false });
      }
    } catch { setMsg({ text: 'Failed to create instance.', ok: false }); }
    finally { setCreating(false); }
  };

  const handleRestart = async (instId: string) => {
    const res = await fetch('/api/provisioner/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: instId }),
    });
    if (res.ok) { setTimeout(fetchInstances, 3000); }
    else { const d = await res.json(); throw new Error(d.error || 'Failed'); }
  };

  const handleConfigure = async (instId: string, config: { telegramBotToken: string; anthropicApiKey: string }) => {
    const res = await fetch('/api/provisioner/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: instId, ...config }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
  };

  const handleDelete = async (instId: string) => {
    if (!confirm('Delete this VM? This cannot be undone.')) return;
    setDeletingId(instId); setMsg(null);
    try {
      const res = await fetch(`/api/provisioner/delete?instanceId=${instId}`, { method: 'DELETE' });
      if (res.ok) {
        setInstances(prev => prev.filter(i => i.id !== instId));
        if (activeId === instId) { setActiveId(null); setLogs(''); setLogsOpen(false); }
        setMsg({ text: 'Instance deleted successfully.', ok: true });
      } else {
        const d = await res.json();
        setMsg({ text: d.error || 'Failed to delete instance.', ok: false });
      }
    } catch { setMsg({ text: 'Failed to delete instance.', ok: false }); }
    finally { setDeletingId(null); }
  };

  const handleBuySlot = async () => {
    setBuyingSlot(true); setMsg(null);
    try {
      const res = await fetch('/api/payments/stripe/instance', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMsg({ text: data.error || 'Failed to start checkout.', ok: false });
      }
    } catch { setMsg({ text: 'Failed to start checkout.', ok: false }); }
    finally { setBuyingSlot(false); }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-[rgb(255,79,90)] animate-spin" />
      </div>
    );
  }
  if (!session) return null;

  const canCreateMore = instances.length < instanceSlots;
  const activeInstance = instances.find(i => i.id === activeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="pill w-fit mb-3">Managed Instances</div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">VM Instances</h1>
          <p className="text-white/40 text-[13px] sm:text-sm">
            {instances.length} of {instanceSlots} slot{instanceSlots !== 1 ? 's' : ''} used
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateMore ? (
            <button
              onClick={() => { setShowCreateForm(true); setMsg(null); }}
              className="btn-primary px-4 py-2 text-[13px] flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Instance
            </button>
          ) : (
            <button
              onClick={handleBuySlot}
              disabled={buyingSlot}
              className="px-4 py-2 text-[13px] font-medium rounded-lg text-white flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {buyingSlot ? 'Redirecting…' : 'Buy Additional Slot — $149.99/mo'}
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && canCreateMore && (
        <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-6">
          <h3 className="text-[14px] font-semibold text-white/80 mb-4">Launch New Instance</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Instance Label (optional)</label>
              <input type="text" value={instanceLabel} onChange={(e) => setInstanceLabel(e.target.value)} className={inputCls} placeholder="e.g. My Bot, Trading Bot…" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Telegram Bot Token</label>
              <input type="text" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} className={inputCls} placeholder="1234567890:ABC..." />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Anthropic API Key</label>
              <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className={inputCls} placeholder="sk-ant-..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateForm(false); setMsg(null); }} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
              <button onClick={handleCreateInstance} disabled={creating || !telegramToken || !anthropicKey} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Provisioning…
                  </span>
                ) : 'Launch VM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instance List */}
      {instances.length > 0 ? (
        <div className="space-y-4">
          {instances.map((inst) => (
            <div key={inst.id} className="space-y-3">
              {/* Instance label header */}
              {instances.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-white/50">{inst.label || inst.vmName}</span>
                  {inst.status === 'provisioning' && (
                    <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full">Provisioning…</span>
                  )}
                </div>
              )}

              <VMStatusCard
                vmName={inst.vmName}
                ip={inst.ip || undefined}
                status={inst.status as any}
                onRestart={() => handleRestart(inst.id)}
                onConfigure={(config) => handleConfigure(inst.id, config)}
                onDelete={() => handleDelete(inst.id)}
                deleting={deletingId === inst.id}
              />

              {/* Deployment Logs (for active/provisioning instance) */}
              {(inst.id === activeId || inst.status === 'provisioning') && (
                <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] overflow-hidden">
                  <button
                    onClick={() => {
                      if (activeId === inst.id && logsOpen) {
                        setLogsOpen(false);
                      } else {
                        setActiveId(inst.id);
                        setLogsOpen(true);
                        if (!logs) fetchLogs(inst.id);
                      }
                    }}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h4"/></svg>
                      Deployment Logs
                      {inst.status === 'provisioning' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${activeId === inst.id && logsOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {activeId === inst.id && logsOpen && (
                    <div className="border-t border-white/[0.06]">
                      {logs ? (
                        <pre
                          ref={logsRef}
                          className="font-mono text-[11px] text-white/60 leading-relaxed p-4 overflow-auto max-h-72 bg-black/30"
                        >{logs}</pre>
                      ) : (
                        <p className="text-xs text-white/30 p-4 text-center">No logs yet — logs appear once the VM is booting.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !showCreateForm ? (
        /* Empty state — no instances */
        <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[rgb(255,79,90)]/10 flex items-center justify-center text-[rgb(255,79,90)] mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">No Instances Yet</h2>
          <p className="text-white/40 text-sm mb-6">
            We&apos;ll provision a Debian VM on Google Cloud, clone OpenClaw, configure it with your keys, and start it automatically.
          </p>
          <button onClick={() => { setShowCreateForm(true); setMsg(null); }} className="btn-primary px-6 py-2.5 text-sm">
            Launch Instance
          </button>
        </div>
      ) : null}
    </div>
  );
}
