import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import { verifyWalletSignature, getClawTokenBalance, getClawTokenPrice } from '@/lib/solana';
import { CLAW_HOLDING_THRESHOLD_USD } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { publicKey, signature, message } = await req.json();

    if (!publicKey || !signature || !message) {
      return NextResponse.json({ error: 'Missing publicKey, signature, or message' }, { status: 400 });
    }

    // Verify the signature proves wallet ownership
    const isValid = verifyWalletSignature(publicKey, message, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 400 });
    }

    await connectDB();

    // Save wallet address on user
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.solanaWallet = publicKey;
    await user.save();

    // Check $CLAWS holding for token-gated access
    let clawBalance = 0;
    let clawValueUsd = 0;
    let tierGranted = false;

    try {
      if (process.env.CLAW_TOKEN_MINT) {
        clawBalance = await getClawTokenBalance(publicKey);
        const price = await getClawTokenPrice();
        clawValueUsd = Math.round(clawBalance * price * 100) / 100;

        // Grant tier2 if holding meets threshold and user doesn't already have a higher paid tier
        const TIER_ORDER = ['free', 'tier1', 'tier2', 'tier3'];
        const currentTierIndex = TIER_ORDER.indexOf(user.tier);
        if (clawValueUsd >= CLAW_HOLDING_THRESHOLD_USD && currentTierIndex < 2) {
          user.tier = 'tier2';
          user.tierSource = 'claw_holding';
          user.paymentStatus = 'completed';
          await user.save();
          tierGranted = true;
        }
      }
    } catch (holdingErr) {
      console.warn('Could not check $CLAWS holding (token may not be launched yet):', holdingErr);
    }

    return NextResponse.json({
      success: true,
      wallet: publicKey,
      clawBalance,
      clawValueUsd,
      tierGranted,
    });
  } catch (error: any) {
    console.error('Wallet connect error:', error);
    return NextResponse.json({ error: 'Failed to connect wallet' }, { status: 500 });
  }
}
