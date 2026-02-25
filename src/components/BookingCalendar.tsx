'use client';

import { useState } from 'react';

interface BookingCalendarProps {
  onBook: (date: Date, notes: string) => Promise<void>;
}

export default function BookingCalendar({ onBook }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    await onBook(dateTime, notes);
    setLoading(false);
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
  };

  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] text-white focus:outline-none focus:border-white/15 transition-colors';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[rgb(13,14,19)] p-6">
      <h3 className="text-[15px] font-bold text-white/80 mb-5">Book Your Support Session</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-white/30 mb-1.5">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-white/30 mb-1.5">Select Time (UTC)</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className={inputCls}
            required
          >
            <option value="" className="bg-[rgb(13,14,19)]">Choose a time</option>
            {timeSlots.map((time) => (
              <option key={time} value={time} className="bg-[rgb(13,14,19)]">{time}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-white/30 mb-1.5">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputCls + ' resize-none'}
            placeholder="Tell us what you need help with..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedDate || !selectedTime}
          className="w-full py-2.5 rounded-lg bg-[rgb(255,79,90)] text-white text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-30"
        >
          {loading ? 'Booking...' : 'Book Session'}
        </button>
      </form>
    </div>
  );
}
