import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    users: users.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      tier: u.tier,
      paymentStatus: u.paymentStatus,
      isAdmin: !!u.isAdmin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { userId, tier, paymentStatus, isAdmin } = body || {};

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const update: any = {};
  if (tier) update.tier = tier;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  if (typeof isAdmin === 'boolean') update.isAdmin = isAdmin;

  await connectDB();
  const updated = await UserModel.findByIdAndUpdate(userId, update, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      id: (updated as any)._id.toString(),
      email: (updated as any).email,
      name: (updated as any).name,
      tier: (updated as any).tier,
      paymentStatus: (updated as any).paymentStatus,
      isAdmin: !!(updated as any).isAdmin,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
  });
}
