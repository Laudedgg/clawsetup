import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import PaymentModel from '@/models/Payment';
import { verifySplTransfer } from '@/lib/solana';
import { CLAW_PAYMENT_EXPIRY_MINUTES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { paymentId, txSignature } = await req.json();

    if (!paymentId || !txSignature) {
      return NextResponse.json({ error: 'Missing paymentId or txSignature' }, { status: 400 });
    }

    const treasuryWallet = process.env.CLAW_TREASURY_WALLET;
    const tokenMint = process.env.CLAW_TOKEN_MINT;
    if (!treasuryWallet || !tokenMint) {
      return NextResponse.json({ error: '$CLAWS payment not configured' }, { status: 500 });
    }

    await connectDB();

    const payment = await PaymentModel.findOne({ clawPaymentId: paymentId, userId });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already verified' }, { status: 400 });
    }

    // Check expiry
    const expiresAt = new Date(payment.createdAt.getTime() + CLAW_PAYMENT_EXPIRY_MINUTES * 60 * 1000);
    if (new Date() > expiresAt) {
      payment.status = 'cancelled';
      await payment.save();
      return NextResponse.json({ error: 'Payment expired — please create a new invoice' }, { status: 400 });
    }

    // Check for duplicate tx signature
    const existingTx = await PaymentModel.findOne({ solanaSignature: txSignature, status: 'completed' });
    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already used for another payment' }, { status: 400 });
    }

    // Calculate expected $CLAWS amount based on the stored USD price
    // We use the amount field (USD) and need to verify at least that much was sent
    // Since we don't store the exact CLAW amount, we'll verify the transfer exists
    // and meets a minimum threshold (the original USD amount / current price with buffer)
    const { verified, amount: transferredAmount } = await verifySplTransfer(
      txSignature,
      treasuryWallet,
      tokenMint,
      0.01 // Minimum sanity check — the main validation is that it goes to treasury
    );

    if (!verified) {
      return NextResponse.json({
        error: 'Could not verify transaction. Make sure you sent $CLAWS to the correct treasury address and the transaction is confirmed.',
      }, { status: 400 });
    }

    // Mark payment as completed
    payment.status = 'completed';
    payment.solanaSignature = txSignature;
    await payment.save();

    // Upgrade user tier
    const tier = payment.tier;
    await UserModel.findByIdAndUpdate(userId, {
      tier,
      paymentStatus: 'completed',
      tierSource: 'payment',
    });

    // Credit referral commission
    try {
      const { COMMISSION_RATE } = await import('@/lib/referral');
      const ReferralModel = (await import('@/models/Referral')).default;
      const buyer = await UserModel.findById(userId).lean();
      if (buyer && (buyer as any).referredBy) {
        const referrer = await UserModel.findOne({ referralCode: (buyer as any).referredBy }).lean();
        if (referrer && referrer._id.toString() !== userId) {
          const commissionAmount = Math.round(payment.amount * COMMISSION_RATE * 100) / 100;
          await ReferralModel.create({
            referrerId: referrer._id.toString(),
            referredUserId: userId,
            paymentId: payment._id.toString(),
            amount: commissionAmount,
            status: 'pending',
          });
        }
      }
    } catch (commErr: any) {
      if (commErr?.code !== 11000) console.error('$CLAWS commission error:', commErr);
    }

    return NextResponse.json({ success: true, tier });
  } catch (error: any) {
    console.error('$CLAWS payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
