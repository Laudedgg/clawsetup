'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BookingCalendar from '@/components/BookingCalendar';
import Link from 'next/link';

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const tier = (session?.user as any)?.tier;
      const paymentStatus = (session?.user as any)?.paymentStatus;
      if (!['tier2', 'tier3'].includes(tier) || paymentStatus !== 'completed') {
        router.push('/dashboard');
      } else {
        fetchBookings();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/booking');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (date: Date, notes: string) => {
    setMsg(null);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: date.toISOString(), notes }),
      });
      if (res.ok) {
        setMsg({ text: "Booking created! We'll contact you soon.", ok: true });
        fetchBookings();
      } else {
        const data = await res.json();
        setMsg({ text: data.error || 'Failed to create booking.', ok: false });
      }
    } catch { setMsg({ text: 'Failed to create booking.', ok: false }); }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-t-transparent border-[rgb(255,79,90)] animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Book a Call</h1>
        <p className="text-white/40 text-[13px] sm:text-sm">Schedule a 1-on-1 session with our support team</p>
      </div>

      {/* Feedback banner */}
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <BookingCalendar onBook={handleBook} />

        {/* Bookings list */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Your Bookings</h3>
          {bookings.length === 0 ? (
            <p className="text-white/35 text-sm">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking: any) => {
                const statusStyle =
                  booking.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                  booking.status === 'pending'   ? 'bg-amber-400/10 border-amber-400/20 text-amber-300' :
                                                   'bg-white/5 border-white/10 text-white/40';
                return (
                  <div key={booking._id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm">
                        {new Date(booking.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/35">
                      {new Date(booking.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} UTC
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-white/40 mt-2 border-t border-white/8 pt-2">{booking.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
