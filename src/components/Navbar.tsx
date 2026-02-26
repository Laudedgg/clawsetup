'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide on dashboard — it has its own sidebar
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[rgb(10,11,16)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦀</span>
            <span className="text-xl font-bold gradient-text">ClawSetup</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="/#capabilities" className="text-xs text-white/50 hover:text-white transition-colors">Capabilities</a>
            <a href="/#how-it-works" className="text-xs text-white/50 hover:text-white transition-colors">How it works</a>
            <a href="/#pricing" className="text-xs text-white/50 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://x.com/clawsetup" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center text-white/40 hover:text-white/70 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://t.me/clawsetup" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center text-white/40 hover:text-white/70 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            {session ? (
              <>
                <Link href="/dashboard" className="text-xs text-white/50 hover:text-white transition-colors">Dashboard</Link>
                <button onClick={() => signOut()} className="text-xs text-white/50 hover:text-white transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-xs text-white/50 hover:text-white transition-colors">Log in</Link>
                <Link href="/auth/register" className="text-xs px-3.5 py-1.5 rounded-lg font-medium text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
