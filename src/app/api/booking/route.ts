import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import BookingModel from '@/models/Booking';
import { sendBookingNotificationToAdmin } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { scheduledAt, notes } = await req.json();

    await connectDB();

    const user = await UserModel.findById(userId);
    if (!user || !['tier2', 'tier3'].includes(user.tier)) {
      return NextResponse.json(
        { error: 'Tier 2 or higher required' },
        { status: 403 }
      );
    }

    const booking = await BookingModel.create({
      userId,
      scheduledAt: new Date(scheduledAt),
      status: 'pending',
      notes,
    });

    // Fire-and-forget email — don't fail the booking if email errors
    sendBookingNotificationToAdmin({
      userName: user.name,
      userEmail: user.email,
      scheduledAt: new Date(scheduledAt),
      notes,
    }).catch((err) => console.error('Booking email failed:', err));

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await connectDB();

    const bookings = await BookingModel.find({ userId }).sort({ scheduledAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 });
  }
}
