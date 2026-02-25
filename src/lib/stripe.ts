import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
  }
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export async function createCheckoutSession({
  userId,
  tier,
  priceId,
  mode = 'payment',
  purpose,
}: {
  userId: string;
  tier: string;
  priceId: string;
  mode?: 'payment' | 'subscription';
  purpose?: string;
}) {
  const stripe = getStripe();
  const metadata: Record<string, string> = { userId, tier };
  if (purpose) metadata.purpose = purpose;

  const session = await stripe.checkout.sessions.create({
    mode,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/checkout?tier=${tier}&payment=cancelled`,
    metadata,
    client_reference_id: userId,
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return await stripe.subscriptions.retrieve(subscriptionId);
}
