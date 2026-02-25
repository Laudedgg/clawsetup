import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import ReferralModel from '@/models/Referral';
import WithdrawalModel from '@/models/WithdrawalRequest';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const withdrawals = await WithdrawalModel.find().sort({ createdAt: -1 }).lean();

  // Get user info for each withdrawal
  const userIds = Array.from(new Set(withdrawals.map((w: any) => w.userId)));
  const users = await UserModel.find({ _id: { $in: userIds } }).select('email name').lean();
  const userMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u]));

  return NextResponse.json({
    withdrawals: withdrawals.map((w: any) => {
      const user = userMap[w.userId] || {};
      return {
        id: w._id.toString(),
        userId: w.userId,
        userName: (user as any).name || null,
        userEmail: (user as any).email || null,
        amount: w.amount,
        payoutDetails: w.payoutDetails,
        status: w.status,
        adminNote: w.adminNote || null,
        createdAt: w.createdAt,
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const { withdrawalId, status, adminNote } = await req.json();
  if (!withdrawalId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal) {
    return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
  }
  if (withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
  }

  withdrawal.status = status;
  if (adminNote) withdrawal.adminNote = adminNote;
  await withdrawal.save();

  // If approved, mark the user's pending referrals as paid
  if (status === 'approved') {
    await ReferralModel.updateMany(
      { referrerId: withdrawal.userId, status: 'pending' },
      { status: 'paid' }
    );
  }

  return NextResponse.json({ success: true });
}
