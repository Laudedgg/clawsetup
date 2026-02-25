import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import ReferralModel from '@/models/Referral';
import WithdrawalModel from '@/models/WithdrawalRequest';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;
  const user = await UserModel.findById(userId).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const referrals = await ReferralModel.find({ referrerId: userId }).sort({ createdAt: -1 }).lean();

  const totalEarned = referrals
    .filter((r: any) => r.status !== 'cancelled')
    .reduce((sum: number, r: any) => sum + r.amount, 0);
  const paidOut = referrals
    .filter((r: any) => r.status === 'paid')
    .reduce((sum: number, r: any) => sum + r.amount, 0);

  const withdrawals = await WithdrawalModel.find({ userId }).sort({ createdAt: -1 }).lean();
  const pendingWithdrawal = withdrawals.find((w: any) => w.status === 'pending');

  // Get referred user emails for display
  const referredUserIds = referrals.map((r: any) => r.referredUserId);
  const referredUsers = await UserModel.find({ _id: { $in: referredUserIds } }).select('email name tier').lean();
  const userMap = Object.fromEntries(referredUsers.map((u: any) => [u._id.toString(), u]));

  return NextResponse.json({
    referralCode: (user as any).referralCode || null,
    referralLink: `${process.env.NEXTAUTH_URL}/?ref=${(user as any).referralCode || ''}`,
    totalEarned: Math.round(totalEarned * 100) / 100,
    pendingEarnings: Math.round((totalEarned - paidOut) * 100) / 100,
    paidOut: Math.round(paidOut * 100) / 100,
    referralCount: referrals.length,
    referrals: referrals.map((r: any) => {
      const ru = userMap[r.referredUserId] || {};
      return {
        id: r._id.toString(),
        userName: (ru as any).name || null,
        userEmail: (ru as any).email || null,
        userTier: (ru as any).tier || null,
        amount: r.amount,
        status: r.status,
        createdAt: r.createdAt,
      };
    }),
    withdrawals: withdrawals.map((w: any) => ({
      id: w._id.toString(),
      amount: w.amount,
      status: w.status,
      adminNote: w.adminNote || null,
      createdAt: w.createdAt,
    })),
    hasPendingWithdrawal: !!pendingWithdrawal,
  });
}
