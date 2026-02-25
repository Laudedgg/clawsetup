'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { CRYPTO_CURRENCIES, TIER_CONFIGS } from '@/lib/constants';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

const CURRENCY_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  USDC: '$',
  USDTTRC20: '₮',
};

type CryptoPaymentInfo = {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
};

type ClawPaymentInfo = {
  paymentId: string;
  treasuryAddress: string;
  amountClaw: number;
  pricePerClaw: number;
  originalPriceUsd: number;
  discountedPriceUsd: number;
  discountPercent: number;
  expiresAt: string;
};

function Spinner() {
  return (
    <svg className="mx-auto animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function CheckoutPageInner() {
  const params = useSearchParams();
  const tier = params.get('tier') || '';
  const router = useRouter();
  const { data: session, status } = useSession();
  const [method, setMethod] = useState<'stripe' | 'crypto' | 'claw'>('stripe');
  const [currency, setCurrency] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPaymentInfo | null>(null);
  const [clawPayment, setClawPayment] = useState<ClawPaymentInfo | null>(null);
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [txSignature, setTxSignature] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingPhantom, setSendingPhantom] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login?callbackUrl=/checkout?tier=' + tier);
  }, [status, router, tier]);

  const tierConfig = TIER_CONFIGS[tier];

  if (!tier || !tierConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-5xl mb-6">🔎</p>
          <h1 className="text-3xl font-bold mb-3">Invalid Plan</h1>
          <p className="text-white/50 mb-8">We couldn&apos;t find that pricing tier.</p>
          <Link className="btn-primary px-6 py-3" href="/">← Back to plans</Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, field: 'address' | 'amount') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const payWithStripe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Stripe checkout');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const payWithCrypto = async () => {
    setLoading(true);
    setError('');
    setCryptoPayment(null);
    try {
      const res = await fetch('/api/payments/nowpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create crypto invoice');
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setCryptoPayment({
          paymentId: data.paymentId,
          payAddress: data.payAddress,
          payAmount: data.payAmount,
          payCurrency: data.payCurrency || currency,
        });
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateClawInvoice = async () => {
    setLoading(true);
    setError('');
    setClawPayment(null);
    try {
      const res = await fetch('/api/payments/claw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create $CLAWS invoice');
      setClawPayment(data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyClawPayment = async (sigOverride?: string) => {
    const sig = sigOverride || txSignature.trim();
    if (!clawPayment || !sig) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/payments/claw/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: clawPayment.paymentId, txSignature: sig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      router.push('/dashboard?payment=success');
    } catch (e: any) {
      setError(e.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const payWithPhantom = async (existingInvoice?: ClawPaymentInfo) => {
    const phantom = (window as any).solana;
    if (!phantom?.isPhantom) {
      setError('Phantom wallet not detected. Please install Phantom or use the manual transfer option.');
      return;
    }

    setSendingPhantom(true);
    setError('');
    try {
      // Step 1: Generate invoice if we don't have one
      let invoice = existingInvoice || clawPayment;
      if (!invoice) {
        const res = await fetch('/api/payments/claw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create $CLAWS invoice');
        invoice = data as ClawPaymentInfo;
        setClawPayment(invoice);
      }

      // Step 2: Connect Phantom
      const resp = await phantom.connect();
      const senderPubkey = resp.publicKey;

      // Step 3: Fetch mint info and build transaction
      const mintRes = await fetch('/api/payments/claw/mint');
      const mintData = await mintRes.json();
      if (!mintRes.ok) throw new Error('Could not fetch token mint');
      const mint = new PublicKey(mintData.mint);
      const decimals = mintData.decimals || 6;

      const connection = new Connection(mintData.rpcUrl || 'https://api.mainnet-beta.solana.com', 'confirmed');
      const treasuryPubkey = new PublicKey(invoice.treasuryAddress);

      const senderAta = await getAssociatedTokenAddress(mint, senderPubkey);
      const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPubkey);

      const amountRaw = BigInt(Math.round(invoice.amountClaw * Math.pow(10, decimals)));

      const transaction = new Transaction();

      // Check if treasury ATA exists, create if needed
      try {
        await getAccount(connection, treasuryAta);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(senderPubkey, treasuryAta, treasuryPubkey, mint)
        );
      }

      transaction.add(
        createTransferInstruction(senderAta, treasuryAta, senderPubkey, amountRaw)
      );

      transaction.feePayer = senderPubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Step 4: Sign and send
      const { signature } = await phantom.signAndSendTransaction(transaction);

      setTxSignature(signature);
      setSendingPhantom(false);

      // Step 5: Wait for confirmation then auto-verify
      setVerifying(true);
      await new Promise(r => setTimeout(r, 3000));

      // Verify using the invoice we have
      const verifyRes = await fetch('/api/payments/claw/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: invoice.paymentId, txSignature: signature }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');
      router.push('/dashboard?payment=success');
    } catch (err: any) {
      if (err.message?.includes('User rejected')) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Phantom transaction failed. You can try the manual transfer instead.');
      }
      setSendingPhantom(false);
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen page-gradient px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to plans
        </Link>

        <div className="grid gap-6 lg:grid-cols-5">

          {/* ── Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Order Summary</p>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-bold">{tierConfig.name} Plan</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    {tierConfig.billing === 'monthly' ? 'Monthly subscription' : 'One-time purchase'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold gradient-text">${tierConfig.price}</p>
                  {tierConfig.billing === 'monthly' && <p className="text-xs text-white/40">/month</p>}
                </div>
              </div>

              <div className="h-px bg-white/10 my-4" />

              <ul className="space-y-2.5">
                {tierConfig.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="mt-0.5 shrink-0 text-emerald-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Total due today</span>
                <span className="font-bold">${tierConfig.price}{tierConfig.billing === 'monthly' ? '/mo' : ''}</span>
              </div>

              {session?.user?.email && (
                <p className="mt-4 text-xs text-white/30 truncate">Signed in as {session.user.email}</p>
              )}
            </div>
          </div>

          {/* ── Payment Panel ── */}
          <div className="lg:col-span-3 space-y-4">
            <h1 className="text-2xl font-bold">Complete Your Purchase</h1>

            {/* Method tabs */}
            <div className="card p-1 flex gap-1">
              <button
                onClick={() => { setMethod('stripe'); setError(''); setCryptoPayment(null); setClawPayment(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === 'stripe' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Card / Bank
              </button>
              <button
                onClick={() => { setMethod('crypto'); setError(''); setClawPayment(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === 'crypto' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Crypto
              </button>
              <button
                onClick={() => { setMethod('claw'); setError(''); setCryptoPayment(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === 'claw' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/40 hover:text-white/70'}`}
              >
                $CLAWS
              </button>
            </div>

            {/* Stripe */}
            {method === 'stripe' && (
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Pay with Card</h3>
                  <p className="text-sm text-white/50 mt-1">Powered by Stripe. Secure checkout — instant access after payment.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map(b => (
                    <span key={b} className="pill">{b}</span>
                  ))}
                </div>
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <button onClick={payWithStripe} disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                  {loading ? <Spinner /> : `Pay $${tierConfig.price}${tierConfig.billing === 'monthly' ? '/mo' : ''} with Stripe`}
                </button>
              </div>
            )}

            {/* Crypto — currency selector */}
            {method === 'crypto' && !cryptoPayment && (
              <div className="card p-6 space-y-5">
                <div>
                  <h3 className="font-semibold">Pay with Cryptocurrency</h3>
                  <p className="text-sm text-white/50 mt-1">Powered by NowPayments. No account needed — pay directly from your wallet.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Select Currency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CRYPTO_CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                          currency === c
                            ? 'border-[rgb(255,79,90)] bg-[rgb(255,79,90)]/10 text-white shadow-[0_0_12px_rgb(255,79,90,0.2)]'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-base w-5 text-center">{CURRENCY_ICONS[c] || '🪙'}</span>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button onClick={payWithCrypto} disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                  {loading ? <Spinner /> : `Generate ${currency} Invoice`}
                </button>
              </div>
            )}

            {/* Crypto — QR code payment view */}
            {method === 'crypto' && cryptoPayment && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold">Send Payment</h3>
                  <span className="pill animate-pulse text-amber-300 border-amber-400/20 bg-amber-400/10">
                    Awaiting payment
                  </span>
                </div>

                {/* QR + fields */}
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="rounded-2xl bg-white p-3 shrink-0 shadow-lg">
                    <QRCodeSVG value={cryptoPayment.payAddress} size={160} />
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    {/* Amount */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Send exactly</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                        <span className="flex-1 font-mono font-bold text-lg gradient-text">
                          {cryptoPayment.payAmount} {cryptoPayment.payCurrency}
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(cryptoPayment.payAmount), 'amount')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
                        >
                          {copied === 'amount' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">To address</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                        <span className="flex-1 font-mono text-xs text-white/80 break-all">{cryptoPayment.payAddress}</span>
                        <button
                          onClick={() => copyToClipboard(cryptoPayment.payAddress, 'address')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0 whitespace-nowrap"
                        >
                          {copied === 'address' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">How to complete</p>
                  <ol className="space-y-2">
                    {[
                      `Open your ${cryptoPayment.payCurrency} wallet app`,
                      'Scan the QR code or paste the address above',
                      `Send exactly ${cryptoPayment.payAmount} ${cryptoPayment.payCurrency}`,
                      'Wait for blockchain confirmation — access is granted automatically',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <button
                  onClick={() => { setCryptoPayment(null); setError(''); }}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Choose different currency
                </button>
              </div>
            )}

            {/* $CLAWS — initial view with Phantom pay + manual invoice */}
            {method === 'claw' && !clawPayment && (
              <div className="card p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-purple-300">Pay with $CLAWS</h3>
                  <p className="text-sm text-white/50 mt-1">Pay using $CLAWS tokens on Solana. Connect your Phantom wallet for a one-click payment, or generate an invoice to send manually.</p>
                </div>

                <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(168,85,247)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">30% Off with $CLAWS</p>
                      <p className="text-xs text-white/40">
                        <span className="line-through text-white/25">${tierConfig.price}</span>
                        {' '}
                        <span className="text-purple-300 font-semibold">${(Math.round(tierConfig.price * 0.7 * 100) / 100).toFixed(2)}</span>
                        {' '} — SPL token transfer on Solana
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Pay with Phantom — primary action */}
                <button
                  onClick={() => payWithPhantom()}
                  disabled={sendingPhantom || verifying || loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2"
                >
                  {sendingPhantom ? (
                    <><Spinner /> Connecting &amp; sending...</>
                  ) : verifying ? (
                    <><Spinner /> Verifying transaction...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg>
                      Pay with Phantom Wallet
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-white/25 uppercase tracking-wider">or pay manually</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Generate invoice for manual transfer — secondary */}
                <button
                  onClick={generateClawInvoice}
                  disabled={loading || sendingPhantom}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                >
                  {loading ? <Spinner /> : 'Generate Invoice for Manual Transfer'}
                </button>
              </div>
            )}

            {/* $CLAWS — QR code payment view */}
            {method === 'claw' && clawPayment && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-purple-300">Send $CLAWS</h3>
                  <span className="pill animate-pulse text-purple-300 border-purple-400/20 bg-purple-400/10">
                    Awaiting payment
                  </span>
                </div>

                {/* QR + fields */}
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="rounded-2xl bg-white p-3 shrink-0 shadow-lg">
                    <QRCodeSVG value={clawPayment.treasuryAddress} size={160} />
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    {/* Amount */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Send exactly</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                        <span className="flex-1 font-mono font-bold text-lg text-purple-300">
                          {clawPayment.amountClaw.toLocaleString(undefined, { maximumFractionDigits: 2 })} $CLAWS
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(clawPayment.amountClaw), 'amount')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
                        >
                          {copied === 'amount' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[11px] text-white/30 mt-1">
                        <span className="line-through">${clawPayment.originalPriceUsd}</span>
                        {' '}
                        <span className="text-emerald-400">${clawPayment.discountedPriceUsd} ({clawPayment.discountPercent}% off)</span>
                        {' '}at ${clawPayment.pricePerClaw.toFixed(6)}/CLAWS
                      </p>
                    </div>

                    {/* Treasury Address */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">To address</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                        <span className="flex-1 font-mono text-xs text-white/80 break-all">{clawPayment.treasuryAddress}</span>
                        <button
                          onClick={() => copyToClipboard(clawPayment.treasuryAddress, 'address')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0 whitespace-nowrap"
                        >
                          {copied === 'address' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pay with Phantom button */}
                <div>
                  <button
                    onClick={() => payWithPhantom(clawPayment!)}
                    disabled={sendingPhantom || verifying}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2"
                  >
                    {sendingPhantom ? (
                      <><Spinner /> Sending via Phantom...</>
                    ) : verifying ? (
                      <><Spinner /> Verifying transaction...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg>
                        Pay with Phantom
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-white/30 text-center mt-2">Connect your Phantom wallet to send $CLAWS directly</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-white/25 uppercase tracking-wider">or send manually</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Manual steps */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Manual transfer</p>
                  <ol className="space-y-2">
                    {[
                      'Open your Solana wallet (Phantom, Solflare, etc.)',
                      'Scan the QR code or paste the treasury address above',
                      `Send exactly ${clawPayment.amountClaw.toLocaleString(undefined, { maximumFractionDigits: 2 })} $CLAWS tokens`,
                      'Copy your transaction signature and paste below to verify',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Verify manual transaction */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Transaction Signature</label>
                    <input
                      type="text"
                      value={txSignature}
                      onChange={(e) => setTxSignature(e.target.value)}
                      placeholder="Paste your Solana transaction signature here..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-purple-500/50"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={() => verifyClawPayment()}
                    disabled={verifying || !txSignature.trim()}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                  >
                    {verifying ? <Spinner /> : "I've Sent Payment — Verify"}
                  </button>
                </div>

                <button
                  onClick={() => { setClawPayment(null); setError(''); setTxSignature(''); }}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Generate new invoice
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/40">Loading checkout…</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}
