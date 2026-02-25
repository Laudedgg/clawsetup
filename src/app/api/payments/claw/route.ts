import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import PaymentModel from '@/models/Payment';
import { TIER_CONFIGS, CLAW_PAYMENT_EXPIRY_MINUTES, CLAW_DISCOUNT_PERCENT } from '@/lib/constants';
import { getClawTokenPrice } from '@/lib/solana';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { tier } = await req.json();

    if (!tier || !TIER_CONFIGS[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const treasuryWallet = process.env.CLAW_TREASURY_WALLET;
    if (!treasuryWallet) {
      return NextResponse.json({ error: 'Treasury wallet not configured' }, { status: 500 });
    }

    if (!process.env.CLAW_TOKEN_MINT) {
      return NextResponse.json({ error: '$CLAWS token not yet configured' }, { status: 500 });
    }

    const tierConfig = TIER_CONFIGS[tier];
    const discountedPrice = Math.round(tierConfig.price * (1 - CLAW_DISCOUNT_PERCENT / 100) * 100) / 100;
    const pricePerClaw = await getClawTokenPrice();
    // Add 2% buffer to account for price fluctuation during payment
    const amountClaw = Math.ceil((discountedPrice / pricePerClaw) * 1.02 * 100) / 100;

    const clawPaymentId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + CLAW_PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    await connectDB();

    await PaymentModel.create({
      userId,
      amount: discountedPrice,
      provider: 'claw',
      status: 'pending',
      tier,
      clawPaymentId,
    });

    return NextResponse.json({
      paymentId: clawPaymentId,
      treasuryAddress: treasuryWallet,
      amountClaw,
      pricePerClaw,
      originalPriceUsd: tierConfig.price,
      discountedPriceUsd: discountedPrice,
      discountPercent: CLAW_DISCOUNT_PERCENT,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('$CLAWS payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create $CLAWS payment' }, { status: 500 });
  }
}
