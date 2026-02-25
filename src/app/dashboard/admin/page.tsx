'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
type Tier = 'free' | 'tier1' | 'tier2' | 'tier3';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  tier: Tier;
  paymentStatus: PaymentStatus;
  isAdmin?: boolean;
  createdAt: string;
};

type AdminBooking = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  scheduledAt: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
};

type AdminWithdrawal = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  amount: number;
  payoutDetails: string;
  status: WithdrawalStatus;
  adminNote: string | null;
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  completed: { label: 'Active',    color: 'text-emerald-400', dot: 'bg-emerald-400' },
  pending:   { label: 'Setup',     color: 'text-white/40',    dot: 'bg-white/30' },
  failed:    { label: 'Error',     color: 'text-red-400',     dot: 'bg-red-400' },
  cancelled: { label: 'Cancelled', color: 'text-white/30',    dot: 'bg-white/20' },
};

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'text-amber-300',
  confirmed: 'text-blue-300',
  completed: 'text-emerald-300',
  cancelled: 'text-white/30',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<'users' | 'bookings' | 'withdrawals'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [q, setQ] = useState('');
  const [usersErr, setUsersErr] = useState<string | null>(null);

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsErr, setBookingsErr] = useState<string | null>(null);

  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsErr, setWithdrawalsErr] = useState<string | null>(null);


  const isAdmin = !!(session?.user as any)?.isAdmin;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!isAdmin) { router.push('/dashboard'); return; }
    (async () => {
      try {
        setUsersLoading(true);
        setUsersErr(null);
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load users');
        setUsers(data.users || []);
      } catch (e: any) {
        setUsersErr(e.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    })();
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (tab !== 'bookings' || !isAdmin) return;
    (async () => {
      try {
        setBookingsLoading(true);
        setBookingsErr(null);
        const res = await fetch('/api/admin/bookings');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load bookings');
        setBookings(data.bookings || []);
      } catch (e: any) {
        setBookingsErr(e.message || 'Failed to load bookings');
      } finally {
        setBookingsLoading(false);
      }
    })();
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab !== 'withdrawals' || !isAdmin) return;
    (async () => {
      try {
        setWithdrawalsLoading(true);
        setWithdrawalsErr(null);
        const res = await fetch('/api/admin/referrals');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load withdrawals');
        setWithdrawals(data.withdrawals || []);
      } catch (e: any) {
        setWithdrawalsErr(e.message || 'Failed to load withdrawals');
      } finally {
        setWithdrawalsLoading(false);
      }
    })();
  }, [tab, isAdmin]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter((u) =>
      [u.email, u.name || '', u.tier, u.paymentStatus].some((v) => String(v).toLowerCase().includes(qq))
    );
  }, [q, users]);

  async function updateUser(userId: string, patch: Partial<AdminUser>) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Update failed');
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
  }

  async function updateBookingStatus(bookingId: string, newStatus: BookingStatus) {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Update failed');
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
  }

  async function updateWithdrawalStatus(withdrawalId: string, status: WithdrawalStatus, adminNote?: string) {
    const res = await fetch('/api/admin/referrals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId, status, adminNote }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Update failed');
    setWithdrawals((prev) => prev.map((w) => (w.id === withdrawalId ? { ...w, status, adminNote: adminNote || w.adminNote } : w)));
  }

  if (status === 'loading' || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const managedCount = users.filter(u => u.tier === 'tier3').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {tab === 'users' ? 'Users' : tab === 'bookings' ? 'Bookings' : 'Withdrawals'}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-white/30 mt-0.5">
              {tab === 'users'
                ? `${users.length} users · ${managedCount} managed instances`
                : tab === 'bookings'
                ? `${bookings.length} total · ${pendingCount} pending`
                : `${withdrawals.length} total · ${pendingWithdrawals} pending`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
              {(['users', 'bookings', 'withdrawals'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-[12px] font-medium capitalize transition-all ${
                    tab === t
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {t}
                  {t === 'bookings' && pendingCount > 0 && (
                    <span className="ml-1.5 text-[10px] text-[rgb(255,79,90)]">{pendingCount}</span>
                  )}
                  {t === 'withdrawals' && pendingWithdrawals > 0 && (
                    <span className="ml-1.5 text-[10px] text-[rgb(255,79,90)]">{pendingWithdrawals}</span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'users' && (
              <div className="relative flex-1 sm:flex-initial">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search users..."
                  className="w-full sm:w-48 pl-9 pr-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/15"
                />
              </div>
            )}
          </div>
        </div>

        {usersErr && <div className="mb-4 rounded-lg p-3 border border-red-500/20 bg-red-500/5 text-red-300 text-[13px]">{usersErr}</div>}
        {bookingsErr && <div className="mb-4 rounded-lg p-3 border border-red-500/20 bg-red-500/5 text-red-300 text-[13px]">{bookingsErr}</div>}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Name</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Email</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Tier</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const st = STATUS_MAP[u.paymentStatus] || STATUS_MAP.pending;
                    return (
                      <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white/80">{u.name || '—'}</td>
                        <td className="px-5 py-3.5 text-white/40">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.tier}
                            onChange={async (e) => {
                              const tier = e.target.value as Tier;
                              try { await updateUser(u.id, { tier, paymentStatus: tier === 'free' ? 'pending' : 'completed' }); }
                              catch (e: any) { alert(e.message); }
                            }}
                            className="rounded-md border border-white/[0.08] bg-transparent px-2 py-1 text-[12px] text-white/60 focus:outline-none cursor-pointer"
                          >
                            <option value="free" className="bg-[rgb(13,14,19)]">Free</option>
                            <option value="tier1" className="bg-[rgb(13,14,19)]">DIY</option>
                            <option value="tier2" className="bg-[rgb(13,14,19)]">Assisted</option>
                            <option value="tier3" className="bg-[rgb(13,14,19)]">Managed</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`flex items-center gap-1.5 text-[12px] ${st.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                              u.isAdmin
                                ? 'bg-[rgb(255,79,90)]/15 text-[rgb(255,79,90)]'
                                : 'bg-white/[0.04] text-white/30 hover:text-white/50'
                            }`}
                            onClick={async () => {
                              try { await updateUser(u.id, { isAdmin: !u.isAdmin }); }
                              catch (e: any) { alert(e.message); }
                            }}
                          >
                            {u.isAdmin ? 'Admin' : 'User'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-white/20 text-sm">
                        {q ? 'No users match your search' : 'No users yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((u) => {
                const st = STATUS_MAP[u.paymentStatus] || STATUS_MAP.pending;
                return (
                  <div key={u.id} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white/80 text-[13px] truncate">{u.name || '—'}</p>
                        <p className="text-white/35 text-[11px] truncate mt-0.5">{u.email}</p>
                      </div>
                      <button
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors shrink-0 ${
                          u.isAdmin
                            ? 'bg-[rgb(255,79,90)]/15 text-[rgb(255,79,90)]'
                            : 'bg-white/[0.04] text-white/30 hover:text-white/50'
                        }`}
                        onClick={async () => {
                          try { await updateUser(u.id, { isAdmin: !u.isAdmin }); }
                          catch (e: any) { alert(e.message); }
                        }}
                      >
                        {u.isAdmin ? 'Admin' : 'User'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={u.tier}
                        onChange={async (e) => {
                          const tier = e.target.value as Tier;
                          try { await updateUser(u.id, { tier, paymentStatus: tier === 'free' ? 'pending' : 'completed' }); }
                          catch (e: any) { alert(e.message); }
                        }}
                        className="rounded-md border border-white/[0.08] bg-transparent px-2 py-1 text-[12px] text-white/60 focus:outline-none cursor-pointer"
                      >
                        <option value="free" className="bg-[rgb(13,14,19)]">Free</option>
                        <option value="tier1" className="bg-[rgb(13,14,19)]">DIY</option>
                        <option value="tier2" className="bg-[rgb(13,14,19)]">Assisted</option>
                        <option value="tier3" className="bg-[rgb(13,14,19)]">Managed</option>
                      </select>
                      <span className={`flex items-center gap-1.5 text-[12px] ${st.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-white/20 text-sm py-10">
                  {q ? 'No users match your search' : 'No users yet'}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === 'bookings' && (
          <>
            {bookingsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] py-16 text-center text-white/20 text-sm">No bookings yet</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">User</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Date</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Notes</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-white/80 font-medium">{b.userName || '—'}</p>
                            <p className="text-white/25 text-[11px] mt-0.5">{b.userEmail}</p>
                          </td>
                          <td className="px-5 py-3.5 text-white/50 text-[12px]">
                            {new Date(b.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-white/30 text-[12px] max-w-[180px] truncate">{b.notes || '—'}</td>
                          <td className="px-5 py-3.5">
                            <select
                              value={b.status}
                              onChange={async (e) => {
                                try { await updateBookingStatus(b.id, e.target.value as BookingStatus); }
                                catch (e: any) { alert(e.message); }
                              }}
                              className={`rounded-md border border-white/[0.08] bg-transparent px-2 py-1 text-[12px] focus:outline-none cursor-pointer ${BOOKING_STATUS_STYLES[b.status]}`}
                            >
                              <option value="pending" className="bg-[rgb(13,14,19)]">Pending</option>
                              <option value="confirmed" className="bg-[rgb(13,14,19)]">Confirmed</option>
                              <option value="completed" className="bg-[rgb(13,14,19)]">Completed</option>
                              <option value="cancelled" className="bg-[rgb(13,14,19)]">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-white/80 font-medium text-[13px] truncate">{b.userName || '—'}</p>
                          <p className="text-white/30 text-[11px] truncate mt-0.5">{b.userEmail}</p>
                        </div>
                        <select
                          value={b.status}
                          onChange={async (e) => {
                            try { await updateBookingStatus(b.id, e.target.value as BookingStatus); }
                            catch (e: any) { alert(e.message); }
                          }}
                          className={`rounded-md border border-white/[0.08] bg-transparent px-2 py-1 text-[11px] focus:outline-none cursor-pointer shrink-0 ${BOOKING_STATUS_STYLES[b.status]}`}
                        >
                          <option value="pending" className="bg-[rgb(13,14,19)]">Pending</option>
                          <option value="confirmed" className="bg-[rgb(13,14,19)]">Confirmed</option>
                          <option value="completed" className="bg-[rgb(13,14,19)]">Completed</option>
                          <option value="cancelled" className="bg-[rgb(13,14,19)]">Cancelled</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-white/45">
                          {new Date(b.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {b.notes && <span className="text-white/25 truncate">{b.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {tab === 'withdrawals' && (
          <>
            {withdrawalsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] py-16 text-center text-white/20 text-sm">No withdrawal requests yet</div>
            ) : (
              <>
                {withdrawalsErr && <div className="mb-4 rounded-lg p-3 border border-red-500/20 bg-red-500/5 text-red-300 text-[13px]">{withdrawalsErr}</div>}

                {/* Desktop table */}
                <div className="hidden lg:block rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">User</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Amount</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Payout Details</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Date</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-white/80 font-medium">{w.userName || '—'}</p>
                            <p className="text-white/25 text-[11px] mt-0.5">{w.userEmail}</p>
                          </td>
                          <td className="px-5 py-3.5 text-white/80 font-medium">${w.amount.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-white/40 text-[12px] max-w-[200px] truncate" title={w.payoutDetails}>{w.payoutDetails}</td>
                          <td className="px-5 py-3.5 text-white/30 text-[12px]">
                            {new Date(w.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            {w.status === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={async () => {
                                    try { await updateWithdrawalStatus(w.id, 'approved'); }
                                    catch (e: any) { alert(e.message); }
                                  }}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    const note = prompt('Rejection reason (optional):');
                                    try { await updateWithdrawalStatus(w.id, 'rejected', note || undefined); }
                                    catch (e: any) { alert(e.message); }
                                  }}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[12px] font-medium capitalize ${w.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {w.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-white/80 font-medium text-[13px] truncate">{w.userName || '—'}</p>
                          <p className="text-white/30 text-[11px] truncate mt-0.5">{w.userEmail}</p>
                        </div>
                        <p className="text-white/80 font-bold text-[14px] shrink-0">${w.amount.toFixed(2)}</p>
                      </div>
                      <p className="text-white/30 text-[11px] truncate">{w.payoutDetails}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/20 text-[11px]">
                          {new Date(w.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {w.status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                try { await updateWithdrawalStatus(w.id, 'approved'); }
                                catch (e: any) { alert(e.message); }
                              }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-400"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const note = prompt('Rejection reason (optional):');
                                try { await updateWithdrawalStatus(w.id, 'rejected', note || undefined); }
                                catch (e: any) { alert(e.message); }
                              }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-red-500/15 text-red-400"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[11px] font-medium capitalize ${w.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {w.status}
                          </span>
                        )}
                      </div>
                      {w.adminNote && <p className="text-white/25 text-[11px] italic">{w.adminNote}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
    </div>
  );
}
