'use client';

import { useEffect, useState, useRef } from 'react';
import DemoWindow from './DemoWindow';

const STEPS = [
  { label: 'Create a GCP account', done: true },
  { label: 'Generate service account key', done: true },
  { label: 'Configure Telegram bot token', done: true },
  { label: 'Set Anthropic API key', done: false },
  { label: 'Deploy to GCP instance', done: false },
  { label: 'Verify bot is online', done: false },
];

export default function SetupDemo() {
  const [completedSteps, setCompletedSteps] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          animateSteps();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animateSteps = () => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCompletedSteps(step);
      if (step >= STEPS.length) {
        clearInterval(interval);
        // Reset after a pause
        setTimeout(() => {
          setCompletedSteps(0);
          hasStarted.current = true;
          setTimeout(animateSteps, 500);
        }, 4000);
      }
    }, 700);
  };

  const progress = (completedSteps / STEPS.length) * 100;

  return (
    <div ref={containerRef}>
      <DemoWindow title="Setup Guide — Step 3 of 6">
        <div className="space-y-1">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/40 font-mono">Progress</span>
            <span className="text-xs font-mono" style={{ color: 'rgb(var(--primary))' }}>
              {completedSteps}/{STEPS.length}
            </span>
          </div>
          <div className="progress-bar mb-5">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          {STEPS.map((step, i) => {
            const isDone = i < completedSteps;
            const isCurrent = i === completedSteps;
            return (
              <div
                key={i}
                className={`check-item transition-all duration-300 ${
                  isDone ? 'opacity-100' : isCurrent ? 'opacity-80' : 'opacity-40'
                }`}
              >
                <div className={`check-circle ${isDone ? 'done' : 'pending'}`}>
                  {isDone && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${isDone ? 'text-white/80 line-through' : isCurrent ? 'text-white' : 'text-white/40'}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[rgb(255,79,90)]/10 text-[rgb(255,79,90)]">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Code hint */}
        <div className="mt-5 rounded-lg bg-white/[0.03] border border-white/5 p-3">
          <p className="text-[10px] text-white/30 font-mono mb-2">Quick tip</p>
          <p className="text-xs text-white/50 leading-relaxed">
            You can find your Anthropic API key at{' '}
            <span className="text-[rgb(255,79,90)]">console.anthropic.com</span>
            {' '}→ API Keys → Create Key
          </p>
        </div>
      </DemoWindow>
    </div>
  );
}
