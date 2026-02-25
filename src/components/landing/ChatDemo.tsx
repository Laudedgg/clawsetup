'use client';

import { useEffect, useState, useRef } from 'react';
import DemoWindow from './DemoWindow';

const MESSAGES = [
  { role: 'user' as const, text: 'How do I configure the Telegram bot token?' },
  {
    role: 'ai' as const,
    text: "Great question! Here's how to set up your Telegram bot token:\n\n1. Open @BotFather on Telegram\n2. Send /newbot and follow the prompts\n3. Copy the token it gives you\n4. Add it to your .env file:\n   TELEGRAM_BOT_TOKEN=your_token_here\n5. Restart OpenClaw with pm2 restart all\n\nYour bot should be online within 30 seconds. Let me know if you need help with anything else!",
  },
  { role: 'user' as const, text: 'How do I set up the Anthropic API key?' },
  {
    role: 'ai' as const,
    text: 'To configure your Anthropic API key:\n\n1. Go to console.anthropic.com\n2. Navigate to API Keys → Create Key\n3. Add to your .env file:\n   ANTHROPIC_API_KEY=sk-ant-...\n4. Run pm2 restart all\n\nDone! OpenClaw will now use Claude for responses.',
  },
];

export default function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startSequence();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startSequence = () => {
    let msgIndex = 0;

    const showNext = () => {
      if (msgIndex >= MESSAGES.length) {
        // Loop back after a pause
        setTimeout(() => {
          setVisibleMessages(0);
          setStreamedText('');
          setIsStreaming(false);
          msgIndex = 0;
          hasStarted.current = true;
          setTimeout(showNext, 500);
        }, 4000);
        return;
      }

      const msg = MESSAGES[msgIndex];
      if (msg.role === 'user') {
        setVisibleMessages(msgIndex + 1);
        msgIndex++;
        setTimeout(showNext, 800);
      } else {
        // Stream AI response
        setVisibleMessages(msgIndex + 1);
        setIsStreaming(true);
        setStreamedText('');
        const fullText = msg.text;
        let charIndex = 0;
        const streamInterval = setInterval(() => {
          charIndex += 2;
          if (charIndex >= fullText.length) {
            setStreamedText(fullText);
            setIsStreaming(false);
            clearInterval(streamInterval);
            msgIndex++;
            setTimeout(showNext, 2000);
          } else {
            setStreamedText(fullText.slice(0, charIndex));
          }
        }, 15);
      }
    };

    setTimeout(showNext, 600);
  };

  return (
    <div ref={containerRef}>
      <DemoWindow title="AI Support — ClawSetup">
        <div className="space-y-3 min-h-[280px] max-h-[320px] overflow-hidden">
          {MESSAGES.slice(0, visibleMessages).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {msg.role === 'ai' && i === visibleMessages - 1
                    ? streamedText
                    : msg.role === 'ai'
                    ? msg.text
                    : msg.text}
                  {msg.role === 'ai' && i === visibleMessages - 1 && isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-blink align-middle" />
                  )}
                </pre>
              </div>
            </div>
          ))}
          {visibleMessages > 0 &&
            MESSAGES[visibleMessages - 1]?.role === 'user' &&
            visibleMessages < MESSAGES.length && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
        </div>
        {/* Input bar */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
          <span className="text-sm text-white/30 flex-1">Ask about OpenClaw setup...</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </div>
      </DemoWindow>
    </div>
  );
}
