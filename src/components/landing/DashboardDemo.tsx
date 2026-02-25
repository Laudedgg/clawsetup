'use client';

import { useEffect, useState, useRef } from 'react';
import DemoWindow from './DemoWindow';

export default function DashboardDemo() {
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startCycle();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startCycle = () => {
    let tab = 0;
    setInterval(() => {
      tab = (tab + 1) % 3;
      setActiveTab(tab);
    }, 3000);
  };

  const tabs = ['Overview', 'Instance', 'Logs'];

  return (
    <div ref={containerRef}>
      <DemoWindow title="Dashboard — ClawSetup">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/5">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all ${
                activeTab === i ? 'bg-white/10 text-white' : 'text-white/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <div className="space-y-3">
            {/* Plan card */}
            <div className="rounded-lg p-3 border border-white/10" style={{
              background: 'linear-gradient(135deg, rgba(255,79,90,0.15), rgba(255,138,92,0.1))'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Current Plan</p>
                  <p className="font-semibold text-sm mt-0.5">Managed</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Uptime', value: '99.9%', color: 'text-emerald-400' },
                { label: 'Messages', value: '12,847', color: 'text-white' },
                { label: 'Avg Response', value: '1.2s', color: 'text-white' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-center">
                  <p className={`text-sm font-semibold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-1.5">
              {['Setup Guide', 'AI Support', 'Book a Call', 'VM Manager'].map((f) => (
                <div key={f} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="status-dot status-dot-live" />
                <span className="text-xs text-emerald-400">Running</span>
                <span className="text-[10px] text-white/30 ml-auto font-mono">claw-prod-a7f3x2</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-white/40">IP Address</span>
                  <span className="text-white/70">34.123.45.67</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Region</span>
                  <span className="text-white/70">us-central1-c</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Machine</span>
                  <span className="text-white/70">e2-small</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Uptime</span>
                  <span className="text-white/70">14d 7h 23m</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 text-[10px] py-2 rounded-lg border border-white/10 bg-white/5 text-white/60">
                Restart
              </button>
              <button className="flex-1 text-[10px] py-2 rounded-lg border border-white/10 bg-white/5 text-white/60">
                Configure
              </button>
              <button className="flex-1 text-[10px] py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/60">
                Delete
              </button>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="rounded-lg bg-black/30 border border-white/5 p-3 font-mono text-[11px] leading-5 text-white/50 min-h-[160px]">
            <p className="text-emerald-400/70">[2026-02-23 14:23:01] PM2 — OpenClaw started</p>
            <p>[2026-02-23 14:23:02] Connecting to Telegram API...</p>
            <p className="text-emerald-400/70">[2026-02-23 14:23:03] ✓ Bot authenticated as @MyClawBot</p>
            <p>[2026-02-23 14:23:03] Loading Anthropic Claude model...</p>
            <p className="text-emerald-400/70">[2026-02-23 14:23:04] ✓ Claude API connected</p>
            <p>[2026-02-23 14:23:04] Listening for messages...</p>
            <p>[2026-02-23 14:25:17] Message from user:382 — processing</p>
            <p className="text-emerald-400/70">[2026-02-23 14:25:18] ✓ Response sent (1.2s)</p>
            <p>[2026-02-23 14:28:44] Message from user:157 — processing</p>
            <p className="text-emerald-400/70">[2026-02-23 14:28:45] ✓ Response sent (0.9s)</p>
            <span className="inline-block w-1.5 h-3 bg-[rgb(255,79,90)] animate-blink" />
          </div>
        )}
      </DemoWindow>
    </div>
  );
}
