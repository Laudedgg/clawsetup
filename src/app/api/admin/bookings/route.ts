import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking';
import UserModel from '@/models/User';

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const bookings = await BookingModel.find({}).sort({ createdAt: -1 }).lean();

  // Enrich with user info
  const userIds = Array.from(new Set(bookings.map((b: any) => b.userId)));
  const users = await UserModel.find({ _id: { $in: userIds } }).lean();
  const userMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u]));

  return NextResponse.json({
    bookings: bookings.map((b: any) => {
      const user = (userMap[b.userId] || {}) as any;
      return {
        id: b._id.toString(),
        userId: b.userId,
        userName: user.name || null,
        userEmail: user.email || null,
        scheduledAt: b.scheduledAt,
        status: b.status,
        notes: b.notes || null,
        createdAt: b.createdAt,
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, status } = await req.json();
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

  if (!bookingId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await connectDB();

  const booking = await BookingModel.findByIdAndUpdate(
    bookingId,
    { status },
    { new: true }
  ).lean();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  return NextResponse.json({ success: true, booking });
}

