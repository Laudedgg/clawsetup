import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import { getClawTokenBalance, getClawTokenPrice } from '@/lib/solana';
import { CLAW_HOLDING_THRESHOLD_USD } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.solanaWallet) {
      return NextResponse.json({
        wallet: null,
        clawBalance: 0,
        clawValueUsd: 0,
        meetsThreshold: false,
        currentTier: user.tier,
      });
    }

    if (!process.env.CLAW_TOKEN_MINT) {
      return NextResponse.json({
        wallet: user.solanaWallet,
        clawBalance: 0,
        clawValueUsd: 0,
        meetsThreshold: false,
        currentTier: user.tier,
        message: 'Token not yet configured',
      });
    }

    const clawBalance = await getClawTokenBalance(user.solanaWallet);
    const price = await getClawTokenPrice();
    const clawValueUsd = Math.round(clawBalance * price * 100) / 100;
    const meetsThreshold = clawValueUsd >= CLAW_HOLDING_THRESHOLD_USD;

    const TIER_ORDER = ['free', 'tier1', 'tier2', 'tier3'];
    const currentTierIndex = TIER_ORDER.indexOf(user.tier);

    if (meetsThreshold && currentTierIndex < 2) {
      // Grant tier2 access
      user.tier = 'tier2';
      user.tierSource = 'claw_holding';
      user.paymentStatus = 'completed';
      await user.save();
    } else if (!meetsThreshold && (user as any).tierSource === 'claw_holding') {
      // Revert to free if access was only from token holding
      user.tier = 'free';
      user.tierSource = 'payment';
      await user.save();
    }

    return NextResponse.json({
      wallet: user.solanaWallet,
      clawBalance,
      clawValueUsd,
      meetsThreshold,
      currentTier: user.tier,
    });
  } catch (error: any) {
    console.error('Verify holding error:', error);
    return NextResponse.json({ error: 'Failed to verify holding' }, { status: 500 });
  }
}
