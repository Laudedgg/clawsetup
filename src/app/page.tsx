'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import PricingCards from '@/components/PricingCards';
import AnimatedSection from '@/components/landing/AnimatedSection';
import ChatDemo from '@/components/landing/ChatDemo';
import SetupDemo from '@/components/landing/SetupDemo';
import VMDemo from '@/components/landing/VMDemo';
import DashboardDemo from '@/components/landing/DashboardDemo';
import DemoWindow from '@/components/landing/DemoWindow';
import HeroShowcase from '@/components/landing/HeroShowcase';
import HeroBlockArt from '@/components/landing/HeroBlockArt';

/* ─── Typing Text Component ─── */
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 2000);
        }
      }, 35);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {showCursor && (
        <span className="inline-block w-[2px] h-[1em] bg-[rgb(255,79,90)] animate-blink align-middle ml-0.5" />
      )}
    </span>
  );
}

/* ─── Terminal Install Block ─── */
function TerminalInstall() {
  const [copied, setCopied] = useState(false);
  const cmd = 'npx clawsetup init';

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-sm group cursor-pointer hover:border-white/20 hover:bg-white/[0.06] transition-all" onClick={handleCopy}>
      <span className="text-white/30">$</span>
      <span className="text-white/80">{cmd}</span>
      <button className="text-white/30 hover:text-white/60 transition-colors ml-2">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ─── Section Divider ─── */
function Divider() {
  return <div className="section-divider my-4" />;
}

/* ─── Feature Section (ironclaw alternating layout) ─── */
function FeatureSection({
  label,
  title,
  subtitle,
  description,
  features,
  demo,
  reverse = false,
}: {
  label: string;
  title: string;
  subtitle?: string;
  description: string;
  features?: string[];
  demo: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="px-6 py-16 sm:py-24 lg:px-8">
      <div className={`mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? 'direction-rtl' : ''}`}>
        {/* Text side */}
        <AnimatedSection direction={reverse ? 'right' : 'left'} className={reverse ? 'lg:order-2' : ''}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">{label}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] mb-4 font-serif">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg text-white/50 mb-4">{subtitle}</p>
            )}
            <p className="text-sm text-white/40 leading-relaxed mb-6">{description}</p>
            {features && (
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-1 h-1 rounded-full bg-[rgb(255,79,90)]" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnimatedSection>

        {/* Demo side */}
        <AnimatedSection direction={reverse ? 'left' : 'right'} className={reverse ? 'lg:order-1' : ''}>
          {demo}
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─── Mini window chrome for capability demos ─── */
function MiniWindow({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-[rgb(12,13,18)] overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/[0.04] bg-white/[0.02]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-white/25 font-mono">{title}</span>
        {badge && <span className="ml-auto text-[9px] text-emerald-400/70 font-mono">{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── Capabilities Cards ─── */
const CAPABILITIES = [
  {
    title: 'Guided Setup Checklist',
    desc: 'A visual, step-by-step walkthrough tuned to your environment. Each task includes inline code snippets, tips, and links — no Googling, no guesswork.',
    demo: (
      <MiniWindow title="setup-guide.md">
        <div className="space-y-3">
          {[
            { step: 'Create GCP e2-small instance', done: true },
            { step: 'Install Node.js 20 & PM2', done: true },
            { step: 'Clone OpenClaw repository', done: true },
            { step: 'Configure .env variables', done: false },
            { step: 'Set up nginx reverse proxy', done: false },
            { step: 'Enable SSL with Let\'s Encrypt', done: false },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${s.done ? 'bg-emerald-500/20 text-emerald-400' : 'border border-white/10 text-white/20'}`}>
                {s.done ? '✓' : ''}
              </div>
              <span className={`text-xs ${s.done ? 'text-white/40 line-through' : 'text-white/60'}`}>{s.step}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full w-1/2" style={{ background: 'linear-gradient(90deg, rgb(255,79,90), rgb(255,138,92))' }} />
            </div>
            <p className="text-[9px] text-white/25 mt-1.5">3 of 6 complete</p>
          </div>
        </div>
      </MiniWindow>
    ),
  },
  {
    title: 'AI Support Chat',
    desc: 'Our AI assistant knows the OpenClaw codebase inside out. Get instant answers about configuration, troubleshooting, Telegram setup, and deployment — 24/7.',
    demo: (
      <MiniWindow title="Chat: AI Support" badge="online">
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="rounded-xl rounded-br-sm px-3 py-2.5 text-[11px] text-white/90 max-w-[85%]" style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}>
              How do I set the Telegram bot token?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-xl rounded-bl-sm px-3 py-2.5 text-[11px] bg-white/[0.06] text-white/60 max-w-[90%] leading-relaxed">
              Add <code className="text-[rgb(255,138,92)] bg-white/[0.04] px-1 rounded text-[10px]">TELEGRAM_BOT_TOKEN</code> to your <code className="text-white/50 bg-white/[0.04] px-1 rounded text-[10px]">.env</code> file. You can get this from <span className="text-sky-400">@BotFather</span> on Telegram.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-xl rounded-br-sm px-3 py-2.5 text-[11px] text-white/90 max-w-[85%]" style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}>
              And the Anthropic API key?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-xl rounded-bl-sm px-3 py-2.5 text-[11px] bg-white/[0.06] text-white/60 max-w-[90%] leading-relaxed">
              Set <code className="text-[rgb(255,138,92)] bg-white/[0.04] px-1 rounded text-[10px]">ANTHROPIC_API_KEY</code> in the same file. Get yours at <span className="text-sky-400">console.anthropic.com</span> → API Keys.
            </div>
          </div>
        </div>
      </MiniWindow>
    ),
  },
  {
    title: 'One-Command Deploy',
    desc: 'For Managed tier users, we provision a dedicated GCP instance, install everything, configure SSL, and start your bot — zero DevOps required.',
    demo: (
      <MiniWindow title="Terminal" badge="completed">
        <div className="font-mono text-[11px] space-y-1.5">
          <p className="text-white/30"><span className="text-[rgb(255,79,90)]">$</span> clawsetup deploy --tier managed</p>
          <p className="text-white/25 text-[10px]">Provisioning e2-small in us-east1...</p>
          <div className="pt-1 space-y-1">
            <p className="text-emerald-400/70">✓ Instance created — 35.194.72.113</p>
            <p className="text-emerald-400/70">✓ Firewall rules configured</p>
            <p className="text-emerald-400/70">✓ Node.js 20 + PM2 installed</p>
            <p className="text-emerald-400/70">✓ OpenClaw cloned & configured</p>
            <p className="text-emerald-400/70">✓ nginx + SSL provisioned</p>
          </div>
          <div className="pt-2 border-t border-white/[0.04] mt-2">
            <p className="text-emerald-400/80">Instance <span className="text-white/60">claw-prod-x9k2</span> is live.</p>
            <p className="text-white/30">Bot online at 35.194.72.113:443</p>
          </div>
        </div>
      </MiniWindow>
    ),
  },
  {
    title: 'Full Dashboard',
    desc: 'Monitor your instance, view logs, check uptime, manage configuration, and restart your bot — all from a clean, intuitive interface.',
    demo: (
      <MiniWindow title="dashboard › overview">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Uptime', val: '99.8%', color: 'text-emerald-400' },
            { label: 'Messages', val: '12.4k', color: 'text-white/70' },
            { label: 'Region', val: 'us-east1', color: 'text-white/40' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-white/25 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { name: 'claw-prod-x9k2', status: 'Running', region: 'us-east1', dot: 'bg-emerald-400' },
            { name: 'claw-staging-m3n', status: 'Stopped', region: 'eu-west1', dot: 'bg-white/20' },
          ].map((inst) => (
            <div key={inst.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${inst.dot}`} />
                <span className="text-[11px] text-white/60 font-mono">{inst.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/25 font-mono">{inst.region}</span>
                <span className={`text-[10px] ${inst.status === 'Running' ? 'text-emerald-400/70' : 'text-white/25'}`}>{inst.status}</span>
              </div>
            </div>
          ))}
        </div>
      </MiniWindow>
    ),
  },
  {
    title: 'Flexible Pricing',
    desc: 'Four tiers to match your comfort level. DIY gives you the guide. Assisted adds human support. Managed means we handle everything. Enterprise gets a custom stack.',
    demo: (
      <MiniWindow title="pricing">
        <div className="space-y-2.5">
          {[
            { name: 'DIY', price: '$29.99', tag: '3-day', color: '#38bdf8', features: 'Setup guide + AI chat' },
            { name: 'Assisted', price: '$69.99', tag: '7-day', color: '#fbbf24', features: 'Guide + 1-on-1 call' },
            { name: 'Managed', price: '$149.99', tag: '/month', color: 'rgb(255,79,90)', features: 'Full deploy & maintenance' },
            { name: 'Enterprise', price: 'Custom', tag: 'contact us', color: '#c084fc', features: 'Done-for-you deployment' },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <div>
                  <span className="text-xs font-semibold text-white/70">{p.name}</span>
                  <p className="text-[9px] text-white/25">{p.features}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-white/60">{p.price}</span>
                <p className="text-[9px] text-white/20">{p.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </MiniWindow>
    ),
  },
  {
    title: 'Book a Call',
    desc: 'Assisted and Managed plans include a live 1-on-1 session with our team. Schedule directly from your dashboard — no email back-and-forth.',
    demo: (
      <MiniWindow title="book-a-call">
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(255,79,90)] to-[rgb(255,138,92)] flex items-center justify-center text-[10px] font-bold text-white">CS</div>
            <div>
              <p className="text-xs text-white/70 font-medium">ClawSetup Team</p>
              <p className="text-[10px] text-white/30">30 min onboarding session</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
              <div key={d} className={`text-center py-2 rounded-lg text-[10px] ${i === 2 ? 'bg-[rgb(255,79,90)]/20 text-[rgb(255,79,90)] border border-[rgb(255,79,90)]/20' : 'bg-white/[0.03] text-white/30 border border-white/[0.04]'}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {['10:00 AM', '2:00 PM', '4:30 PM'].map((t, i) => (
              <div key={t} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] ${i === 1 ? 'bg-[rgb(255,79,90)]/15 text-[rgb(255,79,90)] border border-[rgb(255,79,90)]/20' : 'bg-white/[0.03] text-white/30 border border-white/[0.04]'}`}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </MiniWindow>
    ),
  },
];

/* ─── Integrations / Supported Platforms ─── */
const INTEGRATIONS = [
  {
    name: 'Google Cloud',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12.19 5.24l3.17-3.17A9.93 9.93 0 0012 1C5.93 1 1.11 5.42.17 11.12l3.9.67A6.52 6.52 0 0112.19 5.24z" fill="#EA4335"/><path d="M23.83 11.12A11.94 11.94 0 0015.36 2.07l-3.17 3.17a6.52 6.52 0 014.1 2.3l3.64-1.08 3.9 4.66z" fill="#4285F4"/><path d="M5.24 11.81A6.52 6.52 0 007.54 19l3.17-3.17a3.07 3.07 0 01-1.55-1.55L5.24 11.81z" fill="#34A853"/><path d="M12 17.48a6.52 6.52 0 005.46-2.97l-3.17-3.17a3.07 3.07 0 01-4.58.46l-3.17 3.17A9.93 9.93 0 0012 17.48z" fill="#FBBC05"/></svg>
    ),
    color: '#4285F4',
  },
  {
    name: 'Telegram',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#26A5E4"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.53 8.09l-1.83 8.63c-.14.62-.5.77-.99.48l-2.75-2.03-1.33 1.27c-.15.15-.27.27-.56.27l.2-2.8 5.1-4.61c.22-.2-.05-.31-.34-.12l-6.31 3.98-2.72-.85c-.59-.18-.6-.59.13-.88l10.62-4.1c.49-.18.92.12.76.87z"/></svg>
    ),
    color: '#26A5E4',
  },
  {
    name: 'Claude',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#D4A574"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
    ),
    color: '#D4A574',
  },
  {
    name: 'Node.js',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#68A063"><path d="M12 1.85c-.27 0-.55.07-.78.2L3.78 6.35c-.48.28-.78.8-.78 1.36v8.58c0 .56.3 1.08.78 1.36l7.44 4.3c.48.28 1.08.28 1.56 0l7.44-4.3c.48-.28.78-.8.78-1.36V7.71c0-.56-.3-1.08-.78-1.36l-7.44-4.3a1.56 1.56 0 00-.78-.2z"/></svg>
    ),
    color: '#68A063',
  },
  {
    name: 'Stripe',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#635BFF"><path d="M13.98 11.02c0-1.02-.5-1.44-1.63-1.44-.85 0-1.76.3-2.68.82V7.96c.9-.4 1.8-.64 2.9-.64 2.33 0 3.63 1.12 3.63 3.4v5.56h-2.2l-.1-.84c-.7.66-1.55 1.02-2.5 1.02-1.57 0-2.7-1.04-2.7-2.6 0-1.8 1.48-2.76 3.95-2.92l1.33-.08v-.84zm0 2.2l-1.04.07c-1.26.08-1.86.48-1.86 1.24 0 .58.4.98 1.06.98.64 0 1.26-.34 1.84-.9v-1.4z"/></svg>
    ),
    color: '#635BFF',
  },
  {
    name: 'MongoDB',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#00ED64"><path d="M12.55 2.18c-.34-.6-.7-1.18-1.08-1.74-.1-.15-.2-.32-.36-.4-.06.5-.18.97-.36 1.42A10.7 10.7 0 009.5 4.06c-1.28 1.2-2.24 2.64-2.72 4.3-.56 1.96-.5 3.92.14 5.84.58 1.72 1.6 3.14 3.02 4.22.18.14.38.26.56.4l.06.34c.04.54.1 1.08.16 1.62l.04.22h1.52c.04-.16.06-.34.08-.5l.18-1.42c.02-.12.06-.16.18-.2 1.06-.32 1.96-.88 2.72-1.62 1.62-1.58 2.5-3.5 2.6-5.74.08-1.7-.3-3.3-1.16-4.78-.66-1.14-1.56-2.06-2.56-2.88-.2-.16-.4-.34-.6-.52.02-.06.04-.1.04-.16zm-.82 15.46c-.08-.56-.14-1.08-.22-1.6-.02-.06-.06-.14-.12-.16-.76-.38-1.24-1-1.4-1.82-.02-.1-.06-.14-.16-.12-.02 0-.04 0-.06.02.16 1.08.46 2.12.96 3.08.16.28.32.56.5.84l.06.04c.04-.16.04-.38.06-.56l.38.28z"/></svg>
    ),
    color: '#00ED64',
  },
  {
    name: 'Docker',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#2496ED"><path d="M13.98 11.08h2.12v-1.9h-2.12v1.9zm-2.5 0h2.12v-1.9h-2.12v1.9zm-2.5 0h2.12v-1.9H8.98v1.9zm-2.5 0h2.12v-1.9H6.48v1.9zm2.5-2.3h2.12V6.88H8.98v1.9zm2.5 0h2.12V6.88h-2.12v1.9zm2.5 0h2.12V6.88h-2.12v1.9zm-2.5-2.3h2.12V4.58h-2.12v1.9zm2.5 0h2.12V4.58h-2.12v1.9zM23.97 11.3s-1.26-.74-2.77-.56c-.28-1.78-1.88-2.66-1.88-2.66s-1.5 1.82-.82 3.78c-.78.42-2.08.52-2.08.52H.5c-.28 1.46.12 3.42 1.22 4.8 1.18 1.48 3.04 2.22 5.46 2.22 5.08 0 9.2-2.98 11.14-8.42.74.04 2.36.04 3.26-1.08.12-.14.38-.6.38-.6z"/></svg>
    ),
    color: '#2496ED',
  },
  {
    name: 'nginx',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#009639"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm3.5 14.5c0 .55-.45 1-1 1s-.9-.35-1.5-.9L9.5 12v4.5c0 .55-.45 1-1 1s-1-.45-1-1v-9c0-.55.45-1 1-1s.9.35 1.5.9L13.5 12V7.5c0-.55.45-1 1-1s1 .45 1 1v9z"/></svg>
    ),
    color: '#009639',
  },
  {
    name: 'PM2',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#2B037A"><rect x="2" y="2" width="20" height="20" rx="4"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">PM2</text></svg>
    ),
    color: '#2B037A',
  },
  {
    name: 'Ubuntu',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#E95420"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 3.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-4 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>
    ),
    color: '#E95420',
  },
  {
    name: "Let's Encrypt",
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#003A70"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z"/></svg>
    ),
    color: '#003A70',
  },
  {
    name: 'NowPayments',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#00C26F"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" fill="none"/></svg>
    ),
    color: '#00C26F',
  },
];

/* ─── Main Page ─── */
function CaptureReferral() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      document.cookie = `ref_code=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, []);
  return null;
}

export default function HomePage() {
  return (
    <div className="min-h-screen page-gradient">
      <CaptureReferral />
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-4 sm:pt-20 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          {/* Massive animated block art "CLAWSETUP" */}
          <div className="mb-3 sm:mb-4">
            <HeroBlockArt />
          </div>

          {/* CA badge */}
          <div className="mb-5 sm:mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">CA</span>
              <span className="text-xs font-mono text-white/50">Coming soon</span>
            </div>
          </div>

          {/* Serif italic tagline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.3] mb-3 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            OpenClaw, running on your own terms.
          </h1>
          <p className="text-base sm:text-lg font-serif italic text-white/35 mb-5 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            Built on OpenClaw.
          </p>

          {/* Terminal install */}
          <div className="mb-2 opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <TerminalInstall />
          </div>

          {/* Opens at text */}
          <p className="text-[11px] text-white/20 font-mono mb-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
            opens at localhost:3002
          </p>

          <div className="mb-2 opacity-0 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[rgb(255,79,90)] to-[rgb(255,138,92)] px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgb(255,79,90)]/20 hover:shadow-[rgb(255,79,90)]/30 hover:scale-105 transition-all duration-300">
              Access Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ HERO SHOWCASE (ironclaw-style) ═══════════════════════════ */}
      <section className="pb-10 sm:pb-16">
        <AnimatedSection>
          <HeroShowcase />
        </AnimatedSection>
      </section>

      <Divider />

      {/* ═══════════════════════════ CAPABILITIES ═══════════════════════════ */}
      <section id="capabilities" className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-12 sm:mb-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">Capabilities</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.2] mb-4">
                Everything you need to deploy OpenClaw
              </h2>
              <p className="text-base sm:text-lg text-white/35 max-w-2xl">
                ClawSetup handles everything — from guided self-install to a one-click GCP deploy that spins up a VM and installs OpenClaw A–Z — so you go from zero to live in minutes.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            {CAPABILITIES.map((cap, i) => (
              <AnimatedSection key={cap.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300">
                  <h3 className="text-lg sm:text-xl font-semibold text-white/90 mb-2">{cap.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{cap.desc}</p>
                  {cap.demo}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={400}>
            <div className="mt-12 text-center">
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[rgb(255,79,90)] to-[rgb(255,138,92)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgb(255,79,90)]/20 hover:shadow-[rgb(255,79,90)]/30 hover:scale-105 transition-all duration-300">
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ HOW IT WORKS ═══════════════════════════ */}
      <section id="how-it-works" className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-12 sm:mb-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">Process</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.2]">
                How it works
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up in under a minute — email or Google.',
              },
              {
                step: '02',
                title: 'Pick a plan',
                desc: 'DIY with a guide, get AI support, or let us manage everything.',
              },
              {
                step: '03',
                title: 'Go live',
                desc: 'Follow your personalised guide or we handle the entire deployment for you.',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 120}>
                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300 h-full">
                  <span className="block text-4xl sm:text-5xl font-bold gradient-text font-mono mb-5">{item.step}</span>
                  <h3 className="text-lg sm:text-xl font-semibold text-white/90 mb-2">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ FEATURE DEMOS ═══════════════════════════ */}
      <div id="features">
        {/* Setup Guide Demo */}
        <FeatureSection
          label="Guided Setup"
          title="Not just docs — a visual walkthrough"
          subtitle="Every step tracked, nothing missed."
          description="A step-by-step interactive checklist tuned to your environment. Each task includes inline code snippets, tips, and links. No Googling, no guesswork."
          features={[
            'Interactive progress tracking',
            'Inline code blocks you can copy',
            'Environment-specific instructions',
            'Quick tips for common gotchas',
          ]}
          demo={<SetupDemo />}
        />

        <Divider />

        {/* AI Chat Demo */}
        <FeatureSection
          label="AI Support"
          title="Ask anything about OpenClaw"
          description="Our AI assistant knows the OpenClaw codebase inside out. Get instant answers about configuration, troubleshooting, Telegram bot setup, API keys, and more."
          features={[
            'Trained on the full OpenClaw documentation',
            'Instant responses — no waiting for humans',
            'Code snippets and step-by-step solutions',
            'Available 24/7 from your dashboard',
          ]}
          demo={<ChatDemo />}
          reverse
        />

        <Divider />

        {/* VM Deployment Demo */}
        <FeatureSection
          label="Managed Deployment"
          title="One command. Fully deployed."
          subtitle="Zero DevOps required."
          description="For Managed tier users, we provision a dedicated GCP instance, install everything, configure SSL, and start your bot. The entire process takes under 10 minutes."
          features={[
            'Dedicated e2-small GCP instance',
            'Auto-configured nginx + SSL',
            'PM2 process management',
            'Automatic restarts on failure',
          ]}
          demo={<VMDemo />}
        />

        <Divider />

        {/* Dashboard Demo */}
        <FeatureSection
          label="Dashboard"
          title="Your command center"
          description="Everything you need in one place. Monitor your instance, check uptime, view logs, and manage your OpenClaw deployment from a clean, intuitive dashboard."
          features={[
            'Real-time instance monitoring',
            'One-click restart & configuration',
            'Deployment logs with live streaming',
            'Usage statistics and uptime tracking',
          ]}
          demo={<DashboardDemo />}
          reverse
        />
      </div>

      <Divider />

      {/* ═══════════════════════════ INTEGRATIONS ═══════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="text-[rgb(255,79,90)]">{'›'}</span>{' '}
                <span className="text-white/90">Works With Everything</span>
              </h2>
            </div>
          </AnimatedSection>
          <AnimatedSection stagger>
            <div className="flex flex-wrap gap-3">
              {INTEGRATIONS.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm text-white/60 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all cursor-default group"
                >
                  <span className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">{item.logo}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ PAIN vs SOLUTION ═══════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">Why ClawSetup</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.2] mb-4">Why not just do it yourself?</h2>
              <p className="mt-3 text-base sm:text-lg text-white/40">You could. Most people try. Here&apos;s what usually happens.</p>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 gap-5">
            <AnimatedSection direction="left">
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 sm:p-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-7">The DIY route</p>
                <ul className="space-y-5">
                  {[
                    'Spin up a server and get root access',
                    'Install Node, PM2, nginx — in the right order',
                    'Debug missing dependencies for an hour',
                    'Configure reverse proxy and SSL from scratch',
                    'Something breaks; Google for 2 more hours',
                    'Still not running — ask on Reddit',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3.5 text-[15px] text-white/45 leading-snug">
                      <span className="mt-0.5 shrink-0 text-red-400/60 text-base">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="right">
              <div className="h-full rounded-2xl p-8 sm:p-9" style={{ background: 'linear-gradient(145deg, rgba(255,79,90,0.25) 0%, rgba(255,138,92,0.30) 50%, rgba(255,79,90,0.20) 100%)', border: '1px solid rgba(255,120,100,0.15)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-7">With ClawSetup</p>
                <ul className="space-y-5">
                  {[
                    'Create an account in 30 seconds',
                    'Pick the plan that matches your comfort level',
                    'Follow a guided, visual setup checklist',
                    'Ask the AI assistant if anything is unclear',
                    'Book a 1-on-1 call if you need a human',
                    'OpenClaw is live — go use it',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3.5 text-[15px] text-white/80 leading-snug">
                      <span className="mt-0.5 shrink-0 text-[rgb(255,79,90)]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/auth/register" className="flex items-center justify-center w-full mt-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110" style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}>
                  Get started →
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ PRICING ═══════════════════════════ */}
      <section id="pricing" className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-12 sm:mb-16 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">Pricing</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.2]">
                Simple, transparent pricing
              </h2>
              <p className="mt-3 text-base text-white/35">Pick a plan that fits. Upgrade anytime.</p>
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <PricingCards />
          </AnimatedSection>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ $CLAWS TOKEN ═══════════════════════════ */}
      <section id="claw" className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">$CLAWS Token</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/80 leading-[1.2] mb-4">
                More than a token — a utility layer
              </h2>
              <p className="text-base sm:text-lg text-white/35 max-w-2xl mx-auto mb-5">
                $CLAWS is designed with one simple principle: real, platform-native value. Instead of speculation-only mechanics, $CLAWS directly enhances your ClawSetup experience.
              </p>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgb(255,79,90)]/20 bg-[rgb(255,79,90)]/5 px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-[rgb(255,79,90)] animate-pulse" />
                <span className="text-xs font-medium text-white/60">Building in public — PumpFun Build in Public Hackathon participant</span>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {/* Pay with $CLAWS */}
            <AnimatedSection delay={0}>
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[rgb(255,79,90)]/15 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(255,79,90)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Pay with $CLAWS</h3>
                <p className="text-2xl font-bold gradient-text mb-3">Save 30%</p>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  Use $CLAWS at checkout and receive an automatic 30% discount on eligible plans.
                </p>
                <ul className="space-y-2.5">
                  {['Lower cost for users', 'Continuous token utility', 'Demand driven by platform usage'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                      <span className="w-1 h-1 rounded-full bg-[rgb(255,79,90)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            {/* Holder Access */}
            <AnimatedSection delay={100}>
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[rgb(255,79,90)]/15 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(255,79,90)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Holder Dashboard Access</h3>
                <p className="text-2xl font-bold gradient-text mb-3">Hold $300+</p>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  Hold $300+ worth of $CLAWS and unlock ClawSetup Dashboard Access — including guides, AI chat, and booking.
                </p>
                <p className="text-[11px] text-white/25 leading-relaxed italic">
                  Applies to dashboard features only. VPS Managed &amp; Enterprise packages excluded.
                </p>
              </div>
            </AnimatedSection>

            {/* Ecosystem Utility */}
            <AnimatedSection delay={200}>
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[rgb(255,79,90)]/15 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(255,138,92)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Ecosystem Utility</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  $CLAWS is not a meme accessory. It is an expanding utility layer across the ClawSetup platform.
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">Coming soon</p>
                <ul className="space-y-2.5">
                  {['Skills Marketplace Access', 'Service & expertise unlocks', 'Platform-native perks', 'Advanced tooling utilities'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
                      <span className="w-1 h-1 rounded-full bg-[rgb(255,79,90)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={300}>
            <div className="mt-10 text-center">
              <p className="text-sm font-semibold text-[rgb(255,79,90)]/80">$CLAWS — aligned with real platform value.</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ STATS ═══════════════════════════ */}
      <section className="px-6 py-16 sm:py-20 lg:px-8">
        <AnimatedSection>
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {[
                { val: '200+', label: 'Instances deployed' },
                { val: '< 10 min', label: 'Avg. setup time' },
                { val: '4 tiers', label: 'Pick your level' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-8 sm:py-10 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                  <p className="text-3xl sm:text-4xl font-bold gradient-text">{s.val}</p>
                  <p className="text-xs sm:text-sm text-white/35 mt-2">{s.label}</p>
                </div>
              ))}

              {/* Payment options - with logos */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-8 sm:py-10 text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">Card, Crypto & $CLAWS</p>
                <p className="text-xs sm:text-sm text-white/35 mt-2 mb-4">Payment options</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {/* Visa */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1">
                    <svg className="h-4 w-auto" viewBox="0 0 48 16" fill="none">
                      <path d="M18.6 1.2l-3.9 13.5h-3.2L15.4 1.2h3.2zm16.1 8.7l1.7-4.6.9 4.6h-2.6zm3.6 4.8h3l-2.6-13.5h-2.8c-.6 0-1.2.4-1.4.9l-5 12.6h3.5l.7-1.9h4.3l.3 1.9zm-8.8-4.4c0-3.6-4.9-3.8-4.9-5.4 0-.5.5-1 1.5-1.1.5-.1 1.9-.1 3.5.7l.6-2.9C29.5 1.2 28.3 1 26.8 1c-3.3 0-5.6 1.7-5.6 4.2 0 1.8 1.6 2.9 2.9 3.5 1.3.6 1.7 1 1.7 1.6 0 .8-1 1.2-2 1.2-1.6 0-2.6-.4-3.3-.8l-.6 2.9c.8.4 2.1.7 3.6.7 3.5 0 5.8-1.7 5.8-4.3zM11.5 1.2L6.2 14.7H2.7L.1 3.5C0 3 0 2.8-.3 2.5-.7 2-.5 1.5-2.1 1.2L-2 1l.1-.1c2.4 0 4.5 1 5.7 2.6L6 14.7h3.5L15 1.2h-3.5z" fill="white" fillOpacity="0.5" transform="translate(5,0)"/>
                    </svg>
                  </span>
                  {/* Mastercard */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1">
                    <svg className="h-4 w-auto" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="7" fill="rgb(255,79,90)" fillOpacity="0.6"/>
                      <circle cx="21" cy="10" r="7" fill="rgb(255,138,92)" fillOpacity="0.6"/>
                    </svg>
                  </span>
                  {/* Apple Pay */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/45 tracking-wide">
                     Pay
                  </span>
                  {/* USDC */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/45 tracking-wide">
                    USDC
                  </span>
                  {/* USDT */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/45 tracking-wide">
                    USDT
                  </span>
                  {/* BTC */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/45 tracking-wide">
                    BTC
                  </span>
                  {/* ETH */}
                  <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/45 tracking-wide">
                    ETH
                  </span>
                  {/* $CLAWS */}
                  <span className="inline-flex items-center rounded-md border border-[rgb(255,79,90)]/20 bg-[rgb(255,79,90)]/10 px-2.5 py-1 text-[10px] font-bold text-[rgb(255,79,90)] tracking-wide">
                    $CLAWS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <Divider />

      {/* ═══════════════════════════ FAQ ═══════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-4">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif">Common questions</h2>
              <p className="mt-3 text-base text-white/40">Still on the fence? These might help.</p>
            </div>
          </AnimatedSection>
          <AnimatedSection stagger>
            <div className="space-y-3">
              {[
                {
                  q: 'What exactly is OpenClaw?',
                  a: 'OpenClaw is a self-hosted AI assistant that runs on Telegram. Unlike cloud AI services, it runs on your own server — giving you full privacy, no usage caps, and complete control over your data.',
                },
                {
                  q: 'Does OpenClaw have access to all my data?',
                  a: "No — that's a common misconception. OpenClaw only has access to what you explicitly grant it. You control which tasks it can perform and what permissions it has. It doesn't read your messages, contacts, or files unless you specifically configure it to. Think of it like an app on your phone: it only does what you allow.",
                },
                {
                  q: 'Do I need to be technical?',
                  a: 'Not at all for the Managed plan — we handle everything. DIY and Assisted plans include a visual, step-by-step guide that walks you through each stage without needing DevOps experience.',
                },
                {
                  q: "What's the difference between the plans?",
                  a: 'DIY ($29.99, 3-day access) gives you a setup guide and AI chat. Assisted ($69.99, 7-day access) adds a live 1-on-1 session with our team. Managed ($149.99/mo) means we deploy, configure, and maintain everything for you. All plans are currently at launch pricing.',
                },
                {
                  q: 'What if I get stuck mid-setup?',
                  a: 'Every plan includes access to our AI support chat, which knows the OpenClaw setup inside out. Assisted and Managed plans also include human support sessions bookable directly from your dashboard.',
                },
                {
                  q: 'Can I pay with crypto?',
                  a: 'Yes — we accept BTC, ETH, USDC, and USDT (TRC20) via NowPayments, alongside standard card payments via Stripe. You can also pay with $CLAWS tokens on Solana and save 30%.',
                },
              ].map((item) => (
                <details key={item.q} className="card p-5 group cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-sm list-none">
                    {item.q}
                    <svg className="shrink-0 ml-4 transition-transform duration-200 group-open:rotate-45 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-white/40 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════ FOOTER BLOCK ART ═══════════════════════════ */}
      <section className="py-20 sm:py-28 overflow-hidden">
        <AnimatedSection>
          <HeroBlockArt />
        </AnimatedSection>
      </section>

      <Divider />

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="text-lg">🦀</span>
              <span className="text-sm font-bold gradient-text">ClawSetup</span>
              <div className="flex items-center gap-3">
                {/* X (Twitter) */}
                <a
                  href="https://x.com/clawsetup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/60 hover:border-white/15 transition-all"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Telegram */}
                <a
                  href="https://t.me/clawsetup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white/60 hover:border-white/15 transition-all"
                  aria-label="Telegram"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="text-xs text-white/20">
              © 2026 ClawSetup · Built on{' '}
              <a href="#" className="underline underline-offset-2 hover:text-white/40 transition-colors">OpenClaw</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
