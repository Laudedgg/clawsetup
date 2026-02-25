import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TIER_CONFIGS } from '@/lib/constants';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const tier = (session.user as any)?.tier;

    if (tier !== 'tier3') {
      return NextResponse.json({ error: 'Tier 3 subscription required' }, { status: 403 });
    }

    const tierConfig = TIER_CONFIGS.tier3;
    const priceId = tierConfig.stripePriceId;

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price ID not configured' }, { status: 500 });
    }

    const checkoutSession = await createCheckoutSession({
      userId,
      tier: 'tier3',
      priceId,
      mode: 'subscription',
      purpose: 'additional_instance',
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Instance purchase error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
