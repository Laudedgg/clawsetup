'use client';

import { useState, useCallback } from 'react';

const CheckSm = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const CopiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

type Task = { id: string; label: string; code?: string; link?: { href: string; text: string } };
type StepDef = { id: string; title: string; desc: string; emoji: string; tasks: Task[] };

const STEPS: StepDef[] = [
  {
    id: 'telegram', title: 'Create a Telegram Bot', emoji: '💬',
    desc: 'Get your bot token from BotFather — takes about 2 minutes.',
    tasks: [
      { id: 't1', label: 'Open Telegram and find @BotFather', link: { href: 'https://t.me/botfather', text: 'Open BotFather' } },
      { id: 't2', label: 'Send the /newbot command' },
      { id: 't3', label: 'Choose a display name (e.g. My AI Assistant)' },
      { id: 't4', label: 'Choose a username — must end in bot (e.g. myassistant_bot)' },
      { id: 't5', label: 'BotFather sends you a token. Copy and save it securely.', code: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz' },
    ],
  },
  {
    id: 'anthropic', title: 'Get your Anthropic API Key', emoji: '🔑',
    desc: 'Claude powers the AI in your bot — sign up and generate a key.',
    tasks: [
      { id: 'a1', label: 'Go to console.anthropic.com', link: { href: 'https://console.anthropic.com', text: 'Open Console' } },
      { id: 'a2', label: 'Create an account (or log in)' },
      { id: 'a3', label: 'Open API Keys in the left sidebar' },
      { id: 'a4', label: 'Click Create Key — give it a name like "openclaw"' },
      { id: 'a5', label: 'Copy the key immediately — you can only see it once!', code: 'sk-ant-api03-••••••••••••••••' },
    ],
  },
  {
    id: 'install', title: 'Run the Installer', emoji: '⚡',
    desc: 'A single command downloads and configures everything.',
    tasks: [
      { id: 'i1', label: 'SSH into your server or open a local terminal' },
      { id: 'i2', label: 'Run the one-line installer', code: 'curl -fsSL https://openclaw.ai/install.sh | bash' },
      { id: 'i3', label: 'Follow any on-screen prompts and wait for completion' },
      { id: 'i4', label: 'You should see "✓ OpenClaw installed successfully"' },
    ],
  },
  {
    id: 'configure', title: 'Add your credentials', emoji: '⚙️',
    desc: 'Paste your Telegram token and Anthropic key into the config file.',
    tasks: [
      { id: 'c1', label: 'Navigate to the OpenClaw directory', code: 'cd openclaw' },
      { id: 'c2', label: 'Copy and open the env file', code: 'cp .env.example .env && nano .env' },
      { id: 'c3', label: 'Set both tokens', code: 'TELEGRAM_BOT_TOKEN=your_token_here\nANTHROPIC_API_KEY=sk-ant-api03-...' },
      { id: 'c4', label: 'Save and exit (Ctrl+O → Enter → Ctrl+X in nano)' },
    ],
  },
  {
    id: 'start', title: 'Start your bot', emoji: '🚀',
    desc: 'Launch OpenClaw with PM2 so it stays running after reboot.',
    tasks: [
      { id: 's1', label: 'Start the process', code: 'pm2 start npm --name openclaw -- start' },
      { id: 's2', label: 'Persist it across reboots', code: 'pm2 save && pm2 startup' },
      { id: 's3', label: 'Check the live logs for errors', code: 'pm2 logs openclaw --lines 20' },
    ],
  },
  {
    id: 'test', title: 'Test your bot', emoji: '✅',
    desc: 'Send a message and confirm everything is working.',
    tasks: [
      { id: 'te1', label: 'Open Telegram and search for your bot by username' },
      { id: 'te2', label: 'Send /start — the bot should greet you' },
      { id: 'te3', label: 'Ask it anything — Claude should reply within seconds' },
      { id: 'te4', label: "You're live! Need help? Use the AI chat below." },
    ],
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-2.5 rounded-lg overflow-hidden border border-white/[0.06] bg-[rgb(8,9,12)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] bg-white/[0.02]">
        <span className="text-[9px] text-white/15 font-mono uppercase tracking-widest">terminal</span>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition-colors">
          {copied ? <><CopiedIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy</span></>}
        </button>
      </div>
      <pre className="p-3 text-[12px] font-mono text-white/50 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SetupGuide() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const totalTasks = STEPS.reduce((s, step) => s + step.tasks.length, 0);
  const completedTasks = done.size;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const stepDone = (step: StepDef) => step.tasks.every((t) => done.has(t.id));

  return (
    <div>
      {/* Progress */}
      <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-[13px] text-white/80">Your progress</p>
            <p className="text-white/25 text-[12px] mt-0.5">{completedTasks} of {totalTasks} tasks complete</p>
          </div>
          <span className="text-xl font-bold gradient-text">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
          />
        </div>
        {progress === 100 && (
          <p className="mt-3 text-[12px] text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckSm /> All steps complete — your bot is live!
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const complete = stepDone(step);
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-5 transition-all duration-300 ${
                complete
                  ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                  : 'border-white/[0.06] bg-[rgb(13,14,19)]'
              }`}
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all ${
                    complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[rgb(255,79,90)] text-white'
                  }`}
                >
                  {complete ? <CheckSm /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{step.emoji}</span>
                    <h2 className="font-bold text-[14px] text-white/80">{step.title}</h2>
                    {complete && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Done</span>
                    )}
                  </div>
                  <p className="text-white/30 text-[12px] mt-0.5">{step.desc}</p>
                </div>
              </div>

              <div className="space-y-3 ml-11">
                {step.tasks.map((task) => {
                  const checked = done.has(task.id);
                  return (
                    <div key={task.id}>
                      <button onClick={() => toggle(task.id)} className="flex items-start gap-2.5 w-full text-left group">
                        <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          checked
                            ? 'border-[rgb(255,79,90)] bg-[rgb(255,79,90)]/20 text-[rgb(255,79,90)]'
                            : 'border-white/15 group-hover:border-white/25'
                        }`}>
                          {checked && <CheckSm />}
                        </div>
                        <span className={`text-[13px] leading-5 transition-colors ${checked ? 'text-white/25 line-through' : 'text-white/60'}`}>
                          {task.label}
                        </span>
                      </button>
                      {task.link && (
                        <a
                          href={task.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-6.5 mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(255,138,92)] hover:text-[rgb(255,79,90)] transition-colors"
                        >
                          {task.link.text} <ExternalIcon />
                        </a>
                      )}
                      {task.code && <div className="ml-6.5"><CodeBlock code={task.code} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help footer */}
      <div className="mt-6 rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-6 text-center">
        <p className="font-bold text-[14px] text-white/80 mb-1">Stuck somewhere?</p>
        <p className="text-white/30 text-[12px] mb-4">Our AI chat answers most questions instantly.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/dashboard/chat" className="px-4 py-2 rounded-lg bg-[rgb(255,79,90)] text-white text-[13px] font-semibold hover:brightness-110 transition-all">
            Ask AI Chat
          </a>
          <a href="/dashboard/booking" className="px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 text-[13px] font-medium hover:bg-white/[0.06] transition-all">
            Book a Call
          </a>
        </div>
      </div>
    </div>
  );
}
