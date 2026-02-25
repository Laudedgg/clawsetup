import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import PaymentModel from '@/models/Payment';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          const purpose = session.metadata?.purpose;

          if (purpose === 'additional_instance') {
            // Additional instance slot purchase — increment slots, don't change tier
            await UserModel.findByIdAndUpdate(userId, {
              $inc: { instanceSlots: 1 },
              stripeCustomerId: session.customer as string,
            });
          } else {
            // Normal tier upgrade
            await UserModel.findByIdAndUpdate(userId, {
              tier,
              paymentStatus: 'completed',
              stripeCustomerId: session.customer as string,
              ...(session.subscription && {
                stripeSubscriptionId: session.subscription as string,
              }),
            });
          }

          const payment = await PaymentModel.create({
            userId,
            amount: (session.amount_total || 0) / 100,
            provider: 'stripe',
            status: 'completed',
            tier,
            stripeSessionId: session.id,
          });

          // Credit referral commission
          try {
            const { COMMISSION_RATE } = await import('@/lib/referral');
            const ReferralModel = (await import('@/models/Referral')).default;
            const buyer = await UserModel.findById(userId).lean();
            if (buyer && (buyer as any).referredBy) {
              const referrer = await UserModel.findOne({ referralCode: (buyer as any).referredBy }).lean();
              if (referrer && referrer._id.toString() !== userId) {
                const commissionAmount = Math.round((session.amount_total || 0) / 100 * COMMISSION_RATE * 100) / 100;
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
            if (commErr?.code !== 11000) console.error('Commission error:', commErr);
          }
        }
        break;
      }

      case 'invoice.paid': {
        // Subscription renewal - you may record invoice payments if desired
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await UserModel.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { tier: 'free', stripeSubscriptionId: null }
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
