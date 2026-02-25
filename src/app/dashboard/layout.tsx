'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

const navItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    name: 'Setup Guide',
    href: '/dashboard/guide',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
  },
  {
    name: 'AI Support',
    href: '/dashboard/chat',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    name: 'Book a Call',
    href: '/dashboard/booking',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    name: 'VM Instance',
    href: '/dashboard/instance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    name: 'Referral',
    href: '/dashboard/referral',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
  },
];

function getBreadcrumb(pathname: string) {
  const segments = pathname.replace('/dashboard', '').split('/').filter(Boolean);
  if (segments.length === 0) return 'overview';
  return segments.join(' › ');
}

// ── Shared Chat Interface ──
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 data URL
}

function ChatInterface({
  expanded,
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: {
  expanded: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text || (pendingImage ? 'What do you see in this screenshot?' : ''), image: pendingImage || undefined };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setPendingImage(null);
    setError('');
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (expanded) {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    }
  };

  // Shared hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageSelect}
      className="hidden"
    />
  );

  // Image preview strip (shown above input when image is pending)
  const imagePreview = pendingImage && (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg mb-2">
      <img src={pendingImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/[0.08]" />
      <span className="text-[11px] text-white/30 flex-1">Screenshot attached</span>
      <button
        onClick={() => setPendingImage(null)}
        className="text-white/20 hover:text-white/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );

  // Upload button icon
  const uploadButton = (
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={loading}
      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all disabled:opacity-20"
      title="Upload screenshot"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    </button>
  );

  // Render message bubble with optional image
  const renderMessage = (msg: ChatMessage, idx: number, compact: boolean) => (
    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`${compact ? 'max-w-[90%]' : 'max-w-[70%]'} ${
        msg.role === 'user'
          ? 'bg-[rgb(255,79,90)] text-white rounded-xl rounded-br-sm'
          : compact ? 'bg-white/[0.05] text-white/50 rounded-xl rounded-bl-sm' : 'bg-white/[0.04] text-white/70 rounded-xl rounded-bl-sm'
      } ${compact ? 'px-3 py-2 text-[12px]' : 'px-3.5 py-2.5 text-[13px]'} leading-relaxed whitespace-pre-wrap`}>
        {msg.image && (
          <img
            src={msg.image}
            alt="Uploaded screenshot"
            className={`rounded-lg border border-white/10 mb-2 ${compact ? 'max-w-full max-h-32' : 'max-w-full max-h-64'} object-contain`}
          />
        )}
        {msg.content}
      </div>
    </div>
  );

  // ── Expanded (main content) view ──
  if (expanded) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[rgb(255,79,90)] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Support</h1>
            <p className="text-[12px] text-white/30">Get instant help with OpenClaw setup & troubleshooting</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-white/25">Online</span>
          </div>
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'How do I get a Telegram bot token?',
              'Where do I find my Anthropic API key?',
              'My bot is not responding — help!',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)]">
          <div className="p-4 space-y-3">
            {messages.map((msg, idx) => renderMessage(msg, idx, false))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] px-4 py-3 rounded-xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-center">
                <span className="text-[11px] text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg">{error}</span>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {/* Input */}
        <div className="mt-3">
          {fileInput}
          {imagePreview}
          <div className="flex items-end gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 focus-within:border-white/[0.12] transition-colors">
            {uploadButton}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about OpenClaw setup..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/20 resize-none outline-none leading-relaxed py-0.5"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={send}
              disabled={loading || (!input.trim() && !pendingImage)}
              className="flex-shrink-0 w-7 h-7 rounded-md bg-[rgb(255,79,90)] flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-20"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Compact (docked right panel) view ──
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — h-10 matches breadcrumb bar */}
      <div className="flex items-center justify-between px-4 h-10 shrink-0 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
          <span className="text-[12px] font-semibold text-white/35">AI Support</span>
        </div>
        <Link href="/dashboard/chat" className="text-white/15 hover:text-white/30 transition-colors" title="Expand chat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/10 text-[11px]">Ask about OpenClaw setup...</p>
          </div>
        )}
        {messages.map((msg, i) => renderMessage(msg, i, true))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.05] px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-center">
            <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded">{error}</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.04]">
        {fileInput}
        {imagePreview}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/15 hover:text-white/30 transition-all disabled:opacity-20"
            title="Upload screenshot"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about OpenClaw..."
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] text-[12px] text-white placeholder:text-white/12 focus:outline-none focus:border-white/[0.08] transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="flex-shrink-0 w-7 h-7 rounded-md bg-[rgb(255,79,90)]/80 flex items-center justify-center hover:bg-[rgb(255,79,90)] transition-all disabled:opacity-20"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState({ users: 0, instances: 0 });

  // Shared chat state — persists across navigation
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your OpenClaw support assistant. Ask me anything about setup, Telegram bots, API keys, or troubleshooting." },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const isChatPage = pathname === '/dashboard/chat';
  const videoBgRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  // Force autoplay on iOS Safari — retry on user interaction & visibility change
  useEffect(() => {
    const v = videoBgRef.current;
    if (!v) return;
    const tryPlay = () => {
      if (v.paused) {
        v.muted = true;
        v.play().catch(() => {});
      }
    };
    tryPlay();
    // iOS often requires a user gesture before allowing play
    const events = ['touchstart', 'click', 'scroll'] as const;
    const onInteract = () => {
      tryPlay();
      events.forEach(e => document.removeEventListener(e, onInteract));
    };
    events.forEach(e => document.addEventListener(e, onInteract, { passive: true }));
    // Also retry when tab becomes visible
    const onVis = () => { if (!document.hidden) tryPlay(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      events.forEach(e => document.removeEventListener(e, onInteract));
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.isAdmin) {
      fetch('/api/admin/users')
        .then(r => r.json())
        .then(d => {
          const users = d.users || [];
          setStats({
            users: users.length,
            instances: users.filter((u: any) => u.tier === 'tier3').length,
          });
        })
        .catch(() => {});
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[rgb(10,11,16)]">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-[rgb(255,79,90)] animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = (session.user as any)?.isAdmin;

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: 'rgb(12,13,18)' }}>
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-white/[0.06]" style={{ background: 'rgb(12,13,18)' }}>
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🦀</span>
            <span className="text-[14px] font-bold gradient-text tracking-tight">ClawSetup</span>
          </div>
          {isAdmin && (
            <p className="text-[9px] text-white/20 font-medium mt-1 tracking-widest uppercase">Admin Dashboard</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.06] text-white/80'
                    : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
                }`}
              >
                <span className={isActive ? 'text-[rgb(255,79,90)]/80' : ''}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                pathname === '/dashboard/admin'
                  ? 'bg-white/[0.06] text-white/80'
                  : 'text-white/25 hover:text-white/50 hover:bg-white/[0.03]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={pathname === '/dashboard/admin' ? 'text-[rgb(255,79,90)]/80' : ''}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin
            </Link>
          )}
        </nav>

        {/* Stats footer (admin only) */}
        {isAdmin && (
          <div className="px-5 py-4 border-t border-white/[0.04] space-y-3">
            <div>
              <p className="text-[9px] text-white/15 font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-lg font-bold text-white/60">{stats.users}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/15 font-medium uppercase tracking-wider">Active Instances</p>
              <p className="text-lg font-bold text-[rgb(255,79,90)]/70">{stats.instances}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 relative" style={{ background: 'radial-gradient(800px 400px at 50% 40%, rgba(255,79,90,0.025), transparent 60%), rgb(12,13,18)' }}>
        {/* Animated claw background — brand coral rgb(255,79,90) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoBgRef}
            autoPlay
            loop
            muted
            playsInline
            webkit-playsinline=""
            preload="auto"
            className="w-[120%] h-[120%] object-cover opacity-[0.06] lg:opacity-[0.15]"
            style={{
              filter: 'contrast(3) grayscale(1) sepia(1) hue-rotate(315deg) saturate(10)',
              mixBlendMode: 'lighten',
              transform: 'scale(1.25)',
            }}
            src="/claw-bg.mp4"
          />
        </div>
        {/* Dark scrim — stronger on mobile to suppress video bleed */}
        <div
          className="absolute inset-0 pointer-events-none z-[1] lg:hidden"
          style={{ background: 'rgba(12,13,18,0.80)' }}
        />

        {/* Mobile header */}
        <div className="flex lg:hidden items-center justify-between px-4 h-14 border-b border-white/[0.04] shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🦀</span>
            <span className="text-[14px] font-bold gradient-text tracking-tight">ClawSetup</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white/20 hover:text-white/40 transition-colors p-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Breadcrumb bar — desktop only */}
        <div className="hidden lg:flex h-10 items-center px-6 border-b border-white/[0.04] shrink-0 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] text-white/25">
            <span>dashboard</span>
            <span>›</span>
            <span className="text-white/40">{getBreadcrumb(pathname)}</span>
          </div>
          <div className="ml-auto text-[11px] text-white/15 font-mono">clawsetup.xyz</div>
        </div>

        {isChatPage ? (
          /* When on AI Support page, chat expands as main content */
          <div className="flex-1 min-h-0 overflow-hidden p-4 pb-20 lg:p-6 lg:pb-6 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-3xl mx-auto h-full">
              <ChatInterface
                expanded={true}
                messages={chatMessages}
                setMessages={setChatMessages}
                input={chatInput}
                setInput={setChatInput}
                loading={chatLoading}
                setLoading={setChatLoading}
              />
            </div>
          </div>
        ) : (
          /* Normal page content */
          <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-4 pb-20 lg:p-6 lg:pb-6 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-5xl">{children}</div>
          </div>
        )}
      </main>

      {/* ── Chat panel (docked right, hidden on chat page & mobile) ── */}
      {!isChatPage && (
        <div className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-white/[0.06] min-h-0" style={{ background: 'rgb(12,13,18)' }}>
          <ChatInterface
            expanded={false}
            messages={chatMessages}
            setMessages={setChatMessages}
            input={chatInput}
            setInput={setChatInput}
            loading={chatLoading}
            setLoading={setChatLoading}
          />
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] flex items-center justify-around"
        style={{ background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {[
          { label: 'Home', href: '/dashboard', icon: navItems[0].icon },
          { label: 'Guide', href: '/dashboard/guide', icon: navItems[1].icon },
          { label: 'Chat', href: '/dashboard/chat', icon: navItems[2].icon },
          { label: 'Book', href: '/dashboard/booking', icon: navItems[3].icon },
          { label: 'VM', href: '/dashboard/instance', icon: navItems[4].icon },
          { label: 'Refer', href: '/dashboard/referral', icon: navItems[5].icon },
          ...(isAdmin ? [{
            label: 'Admin',
            href: '/dashboard/admin',
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            ),
          }] : []),
        ].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-1.5 min-w-0 transition-colors ${
                active ? 'text-[rgb(255,79,90)]' : 'text-white/25'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
