'use client';

import { useEffect, useState, useRef } from 'react';

/* ── Sidebar nav items ── */
const NAV_ITEMS = [
  { icon: '◫', label: 'Overview', active: true },
  { icon: '☰', label: 'Setup Guide', active: false },
  { icon: '◉', label: 'AI Support', active: false },
  { icon: '◎', label: 'Book a Call', active: false },
  { icon: '▣', label: 'VM Instance', active: false },
];

/* ── Table data ── */
const USERS = [
  { name: 'Alex Turner', email: 'alex@startup.io', tier: 'Managed', status: 'Active', region: 'us-central1' },
  { name: 'Priya Sharma', email: 'priya@devco.com', tier: 'Assisted', status: 'Active', region: '—' },
  { name: 'Marcus Chen', email: 'marcus@buildai.co', tier: 'Managed', status: 'Deploying', region: 'eu-west1' },
  { name: 'Sofia Rodriguez', email: 'sofia@techlab.io', tier: 'DIY', status: 'Active', region: '—' },
  { name: 'James Park', email: 'james@nexgen.dev', tier: 'Managed', status: 'Active', region: 'us-east1' },
  { name: 'Emma Wilson', email: 'emma@dataflow.ai', tier: 'Assisted', status: 'Active', region: '—' },
  { name: 'Kai Nakamura', email: 'kai@cloudops.jp', tier: 'Managed', status: 'Active', region: 'asia-east1' },
  { name: 'Lena Fischer', email: 'lena@mlstack.de', tier: 'DIY', status: 'Setup', region: '—' },
];

/* ── Chat messages ── */
const CHAT_MSGS = [
  { role: 'user' as const, text: 'deploy new instance for kai@cloudops.jp' },
  { role: 'ai' as const, text: '' }, // will be streamed
];

const AI_RESPONSE = `Deploying managed instance for Kai Nakamura...

✓ Created e2-small in asia-east1
✓ Firewall rules configured
✓ Node.js 20 + PM2 installed
✓ OpenClaw cloned & configured
✓ nginx + SSL provisioned

Instance claw-prod-k8n2x is live.
IP: 35.194.72.113 — bot is online.`;

export default function HeroShowcase() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          setTimeout(() => {
            setShowChat(true);
            setTimeout(startStream, 800);
          }, 600);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startStream = () => {
    setIsStreaming(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= AI_RESPONSE.length) {
        setStreamedText(AI_RESPONSE);
        setIsStreaming(false);
        clearInterval(interval);
        // loop
        setTimeout(() => {
          setStreamedText('');
          setShowChat(false);
          setTimeout(() => {
            setShowChat(true);
            setTimeout(startStream, 800);
          }, 500);
        }, 5000);
      } else {
        setStreamedText(AI_RESPONSE.slice(0, i));
      }
    }, 20);
  };

  const tierColor = (tier: string) => {
    if (tier === 'Managed') return 'bg-[rgb(255,79,90)]/10 text-[rgb(255,79,90)]';
    if (tier === 'Assisted') return 'bg-amber-500/10 text-amber-400';
    return 'bg-sky-500/10 text-sky-400';
  };

  const statusColor = (status: string) => {
    if (status === 'Active') return 'text-emerald-400';
    if (status === 'Deploying') return 'text-amber-400';
    return 'text-white/40';
  };

  return (
    <div ref={containerRef} className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* macOS window */}
      <div className="rounded-xl border border-white/[0.08] bg-[rgb(12,13,18)] overflow-hidden shadow-2xl shadow-black/40">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <div className="flex items-center gap-1.5 ml-3 text-[11px] text-white/25 font-mono">
            <span>dashboard</span>
            <span className="text-white/10">›</span>
            <span>overview</span>
          </div>
          <span className="ml-auto text-[10px] text-white/15 font-mono">clawsetup.xyz</span>
        </div>

        <div className="flex min-h-[420px] sm:min-h-[480px]">
          {/* ── Sidebar ── */}
          <div className="hidden sm:flex flex-col w-48 border-r border-white/[0.04] bg-white/[0.01] p-3">
            <div className="flex items-center gap-2 mb-1 px-2">
              <span className="text-sm">🦀</span>
              <span className="text-xs font-semibold gradient-text">ClawSetup</span>
            </div>
            <p className="text-[9px] text-white/20 px-2 mb-3">Admin Dashboard</p>

            <div className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
                    item.active
                      ? 'bg-white/[0.06] text-white/80'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className="text-[10px] w-4 text-center opacity-60">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Stats at bottom of sidebar */}
            <div className="mt-auto pt-4 border-t border-white/[0.04] space-y-2 px-1">
              <div>
                <p className="text-[9px] text-white/20">Total Users</p>
                <p className="text-sm font-semibold text-white/70">247</p>
              </div>
              <div>
                <p className="text-[9px] text-white/20">Active Instances</p>
                <p className="text-sm font-semibold text-emerald-400/80">89</p>
              </div>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-sm font-semibold text-white/80">Users</h3>
                <p className="text-[10px] text-white/25">247 users · 89 managed instances</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-white/25">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Search users...
                </div>
                <button className="text-[10px] px-2.5 py-1.5 rounded-lg text-white/80 font-medium" style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 sm:px-5 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider">Name</th>
                    <th className="text-left px-2 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-left px-2 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider">Tier</th>
                    <th className="text-left px-2 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider">Status</th>
                    <th className="text-left px-2 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider hidden lg:table-cell">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((user, i) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 sm:px-5 py-2.5">
                        <span className="text-white/70 font-medium">{user.name}</span>
                      </td>
                      <td className="px-2 py-2.5 text-white/30 hidden md:table-cell">{user.email}</td>
                      <td className="px-2 py-2.5">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${tierColor(user.tier)}`}>
                          {user.tier}
                        </span>
                      </td>
                      <td className={`px-2 py-2.5 ${statusColor(user.status)}`}>
                        <span className="flex items-center gap-1">
                          {user.status === 'Active' && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                          {user.status === 'Deploying' && <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-white/25 font-mono hidden lg:table-cell">{user.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="hidden lg:flex flex-col w-72 border-l border-white/[0.04] bg-white/[0.01]">
            {/* Chat header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-white/60">Chat: admin</span>
                {isStreaming && (
                  <span className="text-[9px] text-[rgb(255,79,90)] animate-pulse">Streaming...</span>
                )}
              </div>
              <span className="text-white/20 text-xs">+</span>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-3 overflow-hidden space-y-2.5">
              {showChat && (
                <>
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="rounded-xl rounded-br-sm px-3 py-2 text-[11px] text-white/90 max-w-[90%]" style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}>
                      {CHAT_MSGS[0].text}
                    </div>
                  </div>

                  {/* AI response */}
                  {streamedText && (
                    <div className="flex justify-start">
                      <div className="rounded-xl rounded-bl-sm px-3 py-2 text-[11px] bg-white/[0.06] text-white/60 max-w-[95%]">
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                          {streamedText}
                          {isStreaming && (
                            <span className="inline-block w-1 h-3 ml-0.5 bg-[rgb(255,79,90)] animate-blink align-middle" />
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {showChat && !streamedText && (
                    <div className="flex justify-start">
                      <div className="rounded-xl rounded-bl-sm px-3 py-2 bg-white/[0.06] flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat input */}
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[10px] text-white/20">
                Ask about deployments...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
