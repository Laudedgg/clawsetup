import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPayment } from '@/lib/nowpayments';
import { TIER_CONFIGS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, currency } = await req.json();

    if (!tier || !TIER_CONFIGS[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierConfig = TIER_CONFIGS[tier];
    const userId = (session.user as any).id;

    const payment = await createPayment({
      price_amount: tierConfig.price,
      price_currency: 'USD',
      pay_currency: currency || 'USDC',
      order_id: `${userId}-${tier}-${Date.now()}`,
      order_description: `Claw Installer - ${tierConfig.name} Tier`,
      ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/payments/nowpayments/webhook`,
    });

    return NextResponse.json({
      paymentId: payment.payment_id,
      paymentUrl: payment.invoice_url,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
    });
  } catch (error: any) {
    console.error('NowPayments error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
