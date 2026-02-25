'use client';

import { useState, useCallback } from 'react';

type PhantomProvider = {
  isPhantom: boolean;
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
};

function getPhantom(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const provider = (window as any).solana;
  if (provider?.isPhantom) return provider;
  return null;
}

function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

type Props = {
  onConnect?: (data: {
    wallet: string;
    clawBalance: number;
    clawValueUsd: number;
    tierGranted: boolean;
  }) => void;
  connectedWallet?: string | null;
  compact?: boolean;
};

export default function PhantomConnect({ onConnect, connectedWallet, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState<string | null>(connectedWallet || null);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError('');

    const phantom = getPhantom();
    if (!phantom) {
      setError('Phantom wallet not detected');
      setLoading(false);
      return;
    }

    try {
      const resp = await phantom.connect();
      const publicKey = resp.publicKey.toBase58();

      // Sign verification message
      const nonce = generateNonce();
      const message = `Verify wallet ownership for ClawSetup: ${nonce}`;
      const encoded = new TextEncoder().encode(message);
      const { signature } = await phantom.signMessage(encoded, 'utf8');
      const signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

      // Send to backend for verification
      const res = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey, signature: signatureBase64, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect wallet');

      setWallet(publicKey);
      onConnect?.(data);
    } catch (err: any) {
      if (err.message?.includes('User rejected')) {
        setError('Connection cancelled');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  }, [onConnect]);

  const disconnectWallet = useCallback(async () => {
    const phantom = getPhantom();
    if (phantom) {
      try { await phantom.disconnect(); } catch {}
    }
    setWallet(null);
  }, []);

  const phantom = getPhantom();
  const truncated = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : '';

  // No Phantom installed
  if (!phantom && !wallet) {
    return (
      <a
        href="https://phantom.app/"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} font-semibold text-purple-300 hover:bg-purple-500/20 transition-all`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Install Phantom Wallet
      </a>
    );
  }

  // Connected state
  if (wallet) {
    return (
      <div className={`inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 font-mono text-purple-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          {truncated}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-white/30 hover:text-white/60 transition-colors text-xs"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-2">
      <button
        onClick={connectWallet}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 ${compact ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm'} font-semibold text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50`}
      >
        {loading ? (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg>
        )}
        {loading ? 'Connecting...' : 'Connect Phantom'}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
