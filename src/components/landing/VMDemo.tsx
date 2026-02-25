'use client';

import { useEffect, useState, useRef } from 'react';
import DemoWindow from './DemoWindow';

const TERMINAL_LINES = [
  { type: 'prompt', text: '$ clawsetup deploy --tier managed' },
  { type: 'info', text: '' },
  { type: 'info', text: '  ▓▓ ClawSetup Managed Deployment' },
  { type: 'info', text: '' },
  { type: 'step', text: '  ✓ Authenticating with GCP...' },
  { type: 'step', text: '  ✓ Creating e2-small instance in us-central1-c...' },
  { type: 'step', text: '  ✓ Configuring firewall rules...' },
  { type: 'step', text: '  ✓ Installing Node.js 20 LTS...' },
  { type: 'step', text: '  ✓ Installing PM2 process manager...' },
  { type: 'step', text: '  ✓ Cloning OpenClaw repository...' },
  { type: 'step', text: '  ✓ Installing dependencies (npm ci)...' },
  { type: 'step', text: '  ✓ Writing environment configuration...' },
  { type: 'step', text: '  ✓ Setting up nginx reverse proxy...' },
  { type: 'step', text: '  ✓ Configuring SSL certificate...' },
  { type: 'step', text: '  ✓ Starting OpenClaw via PM2...' },
  { type: 'info', text: '' },
  { type: 'success', text: '  ✅ Deployment complete!' },
  { type: 'info', text: '' },
  { type: 'detail', text: '  Instance:  claw-prod-a7f3x2' },
  { type: 'detail', text: '  IP:        34.123.45.67' },
  { type: 'detail', text: '  Status:    ● running' },
  { type: 'detail', text: '  Uptime:    0m 12s' },
  { type: 'info', text: '' },
  { type: 'muted', text: '  Your Telegram bot is now live. Send /start to test.' },
];

export default function VMDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          animateTerminal();
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animateTerminal = () => {
    let line = 0;
    const interval = setInterval(() => {
      line++;
      setVisibleLines(line);
      if (line >= TERMINAL_LINES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setVisibleLines(0);
          hasStarted.current = true;
          setTimeout(animateTerminal, 500);
        }, 6000);
      }
    }, 120);
  };

  return (
    <div ref={containerRef}>
      <DemoWindow title="Terminal — clawsetup">
        <div className="terminal-block min-h-[300px] max-h-[340px] overflow-hidden">
          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="leading-6">
              {line.type === 'prompt' && (
                <span className="terminal-prompt">{line.text}</span>
              )}
              {line.type === 'step' && (
                <span className="text-emerald-400/70">{line.text}</span>
              )}
              {line.type === 'success' && (
                <span className="text-emerald-400 font-semibold">{line.text}</span>
              )}
              {line.type === 'detail' && (
                <span className="text-white/60">{line.text}</span>
              )}
              {line.type === 'info' && (
                <span className="text-white/40">{line.text}</span>
              )}
              {line.type === 'muted' && (
                <span className="text-white/30 italic">{line.text}</span>
              )}
            </div>
          ))}
          {visibleLines > 0 && visibleLines < TERMINAL_LINES.length && (
            <span className="inline-block w-2 h-4 bg-[rgb(255,79,90)] animate-blink" />
          )}
        </div>
      </DemoWindow>
    </div>
  );
}
