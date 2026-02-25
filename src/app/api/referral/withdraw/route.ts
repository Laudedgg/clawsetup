import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ReferralModel from '@/models/Referral';
import WithdrawalModel from '@/models/WithdrawalRequest';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;

  const { payoutDetails } = await req.json();
  if (!payoutDetails || typeof payoutDetails !== 'string' || payoutDetails.trim().length < 3) {
    return NextResponse.json({ error: 'Payout details are required (wallet address, PayPal email, etc.)' }, { status: 400 });
  }

  // Check for existing pending withdrawal
  const existingPending = await WithdrawalModel.findOne({ userId, status: 'pending' }).lean();
  if (existingPending) {
    return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 400 });
  }

  // Calculate available balance
  const referrals = await ReferralModel.find({ referrerId: userId }).lean();
  const totalEarned = referrals
    .filter((r: any) => r.status !== 'cancelled')
    .reduce((sum: number, r: any) => sum + r.amount, 0);
  const paidOut = referrals
    .filter((r: any) => r.status === 'paid')
    .reduce((sum: number, r: any) => sum + r.amount, 0);
  const pendingEarnings = Math.round((totalEarned - paidOut) * 100) / 100;

  if (pendingEarnings <= 0) {
    return NextResponse.json({ error: 'No pending earnings to withdraw' }, { status: 400 });
  }

  const withdrawal = await WithdrawalModel.create({
    userId,
    amount: pendingEarnings,
    payoutDetails: payoutDetails.trim(),
    status: 'pending',
  });

  return NextResponse.json({
    id: withdrawal._id.toString(),
    amount: withdrawal.amount,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
  });
}
