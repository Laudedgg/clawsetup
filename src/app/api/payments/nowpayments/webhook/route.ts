import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import PaymentModel from '@/models/Payment';
import { verifyIPN } from '@/lib/nowpayments';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-nowpayments-sig') || '';
    const body = await req.json();

    if (!verifyIPN(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();

    const { payment_status, order_id, payment_id, price_amount } = body;

    const [userId, tier] = (order_id || '').split('-');

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 });
    }

    if (payment_status === 'finished') {
      await UserModel.findByIdAndUpdate(userId, {
        tier,
        paymentStatus: 'completed',
      });

      const npPayment = await PaymentModel.create({
        userId,
        amount: price_amount,
        provider: 'nowpayments',
        status: 'completed',
        tier,
        nowpaymentsId: payment_id,
        txHash: body.outcome_hash,
      });

      // Credit referral commission
      try {
        const { COMMISSION_RATE } = await import('@/lib/referral');
        const ReferralModel = (await import('@/models/Referral')).default;
        const buyer = await UserModel.findById(userId).lean();
        if (buyer && (buyer as any).referredBy) {
          const referrer = await UserModel.findOne({ referralCode: (buyer as any).referredBy }).lean();
          if (referrer && referrer._id.toString() !== userId) {
            await ReferralModel.create({
              referrerId: referrer._id.toString(),
              referredUserId: userId,
              paymentId: npPayment._id.toString(),
              amount: Math.round(price_amount * COMMISSION_RATE * 100) / 100,
              status: 'pending',
            });
          }
        }
      } catch (commErr: any) {
        if (commErr?.code !== 11000) console.error('NP commission error:', commErr);
      }
    } else if (payment_status === 'failed') {
      await PaymentModel.create({
        userId,
        amount: price_amount,
        provider: 'nowpayments',
        status: 'failed',
        tier,
        nowpaymentsId: payment_id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('NowPayments webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
