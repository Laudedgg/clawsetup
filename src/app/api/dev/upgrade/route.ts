import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  await connectDB();
  const users = await UserModel.find({}, 'email name tier paymentStatus isAdmin').lean();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const { email } = await req.json();
  await connectDB();

  const user = await UserModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { tier: 'tier3', paymentStatus: 'completed', isAdmin: true },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'User upgraded', tier: user.tier, isAdmin: user.isAdmin });
}
