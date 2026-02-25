import { TierConfig } from '@/types';

export const TIER_CONFIGS: Record<string, TierConfig> = {
  tier1: {
    name: 'DIY',
    price: 29.99,
    originalPrice: 49.99,
    billing: 'one-time',
    accessPeriod: '3-day access',
    features: [
      'Step-by-step setup guide',
      'AI chat support agent',
      'Video tutorial access',
      'Community forum access',
    ],
    cta: 'Get Started',
    stripePriceId: process.env.STRIPE_PRICE_TIER1,
  },
  tier2: {
    name: 'Assisted',
    price: 69.99,
    originalPrice: 99.99,
    billing: 'one-time',
    accessPeriod: '7-day access',
    features: [
      'Everything in DIY',
      '1-on-1 human support session',
      'Priority AI support',
      'Booking system access',
      'Setup assistance',
    ],
    cta: 'Get Started',
    stripePriceId: process.env.STRIPE_PRICE_TIER2,
  },
  tier3: {
    name: 'Managed',
    price: 149.99,
    originalPrice: 199.99,
    billing: 'monthly',
    accessPeriod: '1 month',
    popular: true,
    features: [
      'Everything in Assisted',
      'One-click GCP VM creation from your ClawSetup dashboard',
      'Full OpenClaw install & configuration A–Z (domains, HTTPS, services)',
      'VM management dashboard & status',
      'Status monitoring & alerts',
      'Automatic updates',
      'Priority support',
    ],
    cta: 'Get Started',
    stripePriceId: process.env.STRIPE_PRICE_TIER3,
  },
  tier4: {
    name: 'Business & Enterprise',
    price: 0,
    billing: 'custom',
    tagline: "We run AI agents inside your company",
    features: [
      'Done-for-you OpenClaw deployment & hardening',
      'Custom AI agents: CRM automation, LinkedIn outreach, lead enrichment, email sequences',
      'Technical agents: DevOps engineer, senior ML engineer, data pipelines',
      'Team onboarding, SOPs, and priority support',
    ],
    cta: 'Contact us',
  },
};

export const CRYPTO_CURRENCIES = ['USDC', 'BTC', 'ETH', 'USDTTRC20'];

export const NOWPAYMENTS_MIN_AMOUNT = 10; // USD

export const CLAW_DISCOUNT_PERCENT = 30;
export const CLAW_HOLDING_THRESHOLD_USD = 300;
export const CLAW_PAYMENT_EXPIRY_MINUTES = 30;

export const GCP_MACHINE_TYPE = 'e2-small';
export const GCP_DISK_SIZE_GB = 30;
export const GCP_NETWORK_TIER = 'STANDARD';
