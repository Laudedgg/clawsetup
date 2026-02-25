'use client';

import { useEffect, useState } from 'react';

type ReferralItem = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  userTier: string | null;
  amount: number;
  status: string;
  createdAt: string;
};

type WithdrawalItem = {
  id: string;
  amount: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

type ReferralStats = {
  referralCode: string | null;
  referralLink: string;
  totalEarned: number;
  pendingEarnings: number;
  paidOut: number;
  referralCount: number;
  referrals: ReferralItem[];
  withdrawals: WithdrawalItem[];
  hasPendingWithdrawal: boolean;
};

const STATUS_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-300',   dot: 'bg-amber-300' },
  paid:      { label: 'Paid',      color: 'text-emerald-400', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'text-white/30',    dot: 'bg-white/20' },
  approved:  { label: 'Approved',  color: 'text-emerald-400', dot: 'bg-emerald-400' },
  rejected:  { label: 'Rejected',  color: 'text-red-400',     dot: 'bg-red-400' },
};

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawErr, setWithdrawErr] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch('/api/referral/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load referral stats');
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for iOS
      const ta = document.createElement('textarea');
      ta.value = stats.referralLink;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function submitWithdrawal() {
    if (!payoutDetails.trim()) {
      setWithdrawErr('Please enter your payout details');
      return;
    }
    try {
      setWithdrawing(true);
      setWithdrawErr('');
      const res = await fetch('/api/referral/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutDetails: payoutDetails.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal');
      setWithdrawSuccess(`Withdrawal of $${data.amount} submitted successfully!`);
      setShowWithdrawForm(false);
      setPayoutDetails('');
      fetchStats();
    } catch (e: any) {
      setWithdrawErr(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-[12px] sm:text-[13px] text-white/30 mt-0.5">
          Earn 10% commission on every purchase from your referrals
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(255,79,90)" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          <span className="text-[13px] font-semibold text-white/80">Your Referral Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[12px] text-white/50 font-mono truncate">
            {stats.referralLink}
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: copied
                ? 'rgba(34, 197, 94, 0.15)'
                : 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))',
              color: copied ? 'rgb(34, 197, 94)' : 'white',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[11px] text-white/20">
          Share this link with friends. When they sign up and make a purchase, you earn 10% commission.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Earned', value: `$${stats.totalEarned.toFixed(2)}`, color: 'text-white/80' },
          { label: 'Pending', value: `$${stats.pendingEarnings.toFixed(2)}`, color: 'text-amber-300' },
          { label: 'Paid Out', value: `$${stats.paidOut.toFixed(2)}`, color: 'text-emerald-400' },
          { label: 'Referrals', value: stats.referralCount.toString(), color: 'text-white/80' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4">
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg sm:text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Withdraw Section */}
      {stats.pendingEarnings > 0 && !stats.hasPendingWithdrawal && (
        <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-5">
          {!showWithdrawForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-white/80">Ready to withdraw?</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  You have ${stats.pendingEarnings.toFixed(2)} in pending earnings
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawForm(true)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white"
                style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
              >
                Request Withdrawal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-white/80">Request Withdrawal — ${stats.pendingEarnings.toFixed(2)}</p>
              <textarea
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder="Enter your payout details (crypto wallet address, PayPal email, etc.)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/15 resize-none"
              />
              {withdrawErr && <p className="text-[11px] text-red-400">{withdrawErr}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={submitWithdrawal}
                  disabled={withdrawing}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
                >
                  {withdrawing ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => { setShowWithdrawForm(false); setWithdrawErr(''); }}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium text-white/30 hover:text-white/50 border border-white/[0.06]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stats.hasPendingWithdrawal && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
          <p className="text-[12px] text-amber-200/80">You have a pending withdrawal request being reviewed by admin.</p>
        </div>
      )}

      {withdrawSuccess && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-[12px] text-emerald-200/80">{withdrawSuccess}</p>
        </div>
      )}

      {/* Referrals List */}
      {stats.referrals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-semibold text-white/60">Your Referrals</h2>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">User</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Tier</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Commission</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.referrals.map((r) => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={r.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-white/80 font-medium">{r.userName || '—'}</p>
                        <p className="text-white/25 text-[11px] mt-0.5">{r.userEmail || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-white/50 text-[12px] capitalize">{r.userTier || '—'}</td>
                      <td className="px-5 py-3.5 text-white/80 font-medium">${r.amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1.5 text-[12px] ${st.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/30 text-[12px]">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {stats.referrals.map((r) => {
              const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
              return (
                <div key={r.id} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/80 font-medium text-[13px] truncate">{r.userName || r.userEmail || '—'}</p>
                      <p className="text-white/25 text-[11px] mt-0.5 capitalize">{r.userTier || 'free'}</p>
                    </div>
                    <p className="text-white/80 font-bold text-[14px] shrink-0">${r.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-[11px] ${st.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="text-white/20 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Withdrawals History */}
      {stats.withdrawals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-semibold text-white/60">Withdrawal History</h2>
          <div className="space-y-2">
            {stats.withdrawals.map((w) => {
              const st = STATUS_STYLES[w.status] || STATUS_STYLES.pending;
              return (
                <div key={w.id} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 font-medium text-[13px]">${w.amount.toFixed(2)}</p>
                    <p className="text-white/25 text-[11px] mt-0.5">
                      {new Date(w.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {w.adminNote && <p className="text-white/30 text-[11px] mt-1 italic">{w.adminNote}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 text-[12px] ${st.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.referrals.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] py-12 text-center">
          <svg className="mx-auto mb-3 text-white/10" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <p className="text-white/30 text-sm">No referrals yet</p>
          <p className="text-white/15 text-[12px] mt-1">Share your referral link to start earning</p>
        </div>
      )}
    </div>
  );
}
