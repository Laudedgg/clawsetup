'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TierBadge from '@/components/TierBadge';
import PhantomConnect from '@/components/PhantomConnect';

const TIER_ORDER = ['free', 'tier1', 'tier2', 'tier3'];
const isUnlocked = (tier: string, min: string) =>
  TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min);

const FEATURES = [
  { key: 'guide',    name: 'Setup Guide',     desc: 'Step-by-step installation walkthrough',  href: '/dashboard/guide',    min: 'tier1' },
  { key: 'chat',     name: 'AI Support',      desc: 'Get instant help from our AI assistant',  href: '/dashboard/chat',     min: 'tier1' },
  { key: 'booking',  name: 'Book a Call',      desc: 'Schedule 1-on-1 human support session',   href: '/dashboard/booking',  min: 'tier2' },
  { key: 'instance', name: 'VM Instance',      desc: 'Manage your fully hosted OpenClaw VM',    href: '/dashboard/instance', min: 'tier3' },
];

const ICONS: Record<string, React.ReactNode> = {
  guide:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  chat:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  booking:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  instance: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  lock:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  admin:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [holdingInfo, setHoldingInfo] = useState<{
    wallet: string | null;
    clawBalance: number;
    clawValueUsd: number;
    meetsThreshold: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  // Force session refresh after payment callback so the new tier is immediately visible
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      update();
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [update]);

  // Check $CLAWS holding on dashboard load if wallet is connected
  useEffect(() => {
    const wallet = (session?.user as any)?.solanaWallet;
    if (wallet) {
      fetch('/api/wallet/verify-holding')
        .then(res => res.json())
        .then(data => {
          if (data.wallet) setHoldingInfo(data);
        })
        .catch(() => {}); // silent fail
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-7 w-7 rounded-full border-2 border-t-transparent border-[rgb(255,79,90)] animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const tier = (session.user as any)?.tier || 'free';
  const isAdmin = (session.user as any)?.isAdmin;
  const solanaWallet = (session.user as any)?.solanaWallet;
  const firstName = session.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-1.5">Dashboard</p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome back, {firstName}
        </h1>
        <p className="text-[12px] sm:text-[13px] text-white/40 mt-0.5">Here&apos;s what&apos;s available on your plan.</p>
      </div>

      {/* Plan card */}
      <div
        className="rounded-xl border border-white/[0.08] p-5"
        style={{ background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Current Plan</p>
            <TierBadge tier={tier} />
          </div>
          {tier === 'free' && (
            <Link
              href="/#pricing"
              className="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-white hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      {/* $CLAWS Holder Access card */}
      <div
        className="rounded-xl border border-purple-500/20 p-5"
        style={{ background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(168,85,247)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] text-purple-300 mb-1">$CLAWS Token Access</p>
            {holdingInfo?.meetsThreshold ? (
              <div>
                <p className="text-[11px] text-emerald-400 mb-1.5">Assisted plan active via $CLAWS holdings</p>
                <p className="text-[10px] text-white/30">
                  Holding {holdingInfo.clawBalance.toLocaleString()} $CLAWS (${holdingInfo.clawValueUsd.toLocaleString()})
                </p>
              </div>
            ) : holdingInfo?.wallet ? (
              <div>
                <p className="text-[11px] text-white/50 mb-1.5">
                  Hold $300+ worth of $CLAWS for free Assisted plan access
                </p>
                <p className="text-[10px] text-white/30">
                  Current: {holdingInfo.clawBalance.toLocaleString()} $CLAWS (${holdingInfo.clawValueUsd.toLocaleString()})
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-white/50 mb-2">
                Connect your Phantom wallet to check $CLAWS holdings. Hold $300+ for free Assisted plan access.
              </p>
            )}
            {!solanaWallet && (
              <div className="mt-2.5">
                <PhantomConnect
                  compact
                  onConnect={(data) => {
                    setHoldingInfo({
                      wallet: data.wallet,
                      clawBalance: data.clawBalance,
                      clawValueUsd: data.clawValueUsd,
                      meetsThreshold: data.clawValueUsd >= 300,
                    });
                    if (data.tierGranted) router.refresh();
                  }}
                />
              </div>
            )}
            {solanaWallet && (
              <div className="mt-2">
                <PhantomConnect compact connectedWallet={solanaWallet} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2.5">Features</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const unlocked = isUnlocked(tier, f.min);
            return (
              <Link
                key={f.key}
                href={unlocked ? f.href : '/#pricing'}
                className={`group flex items-start gap-3.5 rounded-xl border p-5 transition-all ${
                  unlocked
                    ? 'border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.03]'
                    : 'border-white/[0.04] opacity-40'
                }`}
                style={unlocked ? { background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : { background: 'rgba(12,13,18,0.75)' }}
              >
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                  unlocked ? 'bg-[rgb(255,79,90)]/15 text-[rgb(255,79,90)]' : 'bg-white/[0.04] text-white/20'
                }`}>
                  {unlocked ? ICONS[f.key] : ICONS.lock}
                </div>
                <div>
                  <p className="font-semibold text-[13px] text-white/90 mb-0.5">{f.name}</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p>
                  {!unlocked && (
                    <p className="text-[10px] text-[rgb(255,79,90)]/60 mt-1.5">Requires upgrade</p>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Admin card */}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="group flex items-start gap-3.5 rounded-xl border border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.03] p-5 transition-all"
              style={{ background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 bg-[rgb(255,79,90)]/15 text-[rgb(255,79,90)]">
                {ICONS.admin}
              </div>
              <div>
                <p className="font-semibold text-[13px] text-white/90 mb-0.5">Admin Panel</p>
                <p className="text-[11px] text-white/40 leading-relaxed">Manage users, tiers, and bookings</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Upgrade banner (free only) */}
      {tier === 'free' && (
        <div
          className="rounded-xl border border-white/[0.08] p-7 text-center"
          style={{ background: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <h2 className="text-[16px] font-bold text-white/90 mb-1 font-serif italic">Unlock Premium Features</h2>
          <p className="text-[12px] text-white/40 mb-5">Get guides, AI support, and managed hosting</p>
          <Link
            href="/#pricing"
            className="inline-block px-6 py-2.5 rounded-lg text-[12px] font-semibold text-white hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
