export type Tier = 'free' | 'tier1' | 'tier2' | 'tier3';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type PaymentProvider = 'stripe' | 'nowpayments' | 'claw';

export type TierSource = 'payment' | 'claw_holding';

export type VMStatus = 'provisioning' | 'running' | 'stopped' | 'error';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface User {
  _id: string;
  email: string;
  name?: string;
  password?: string;
  googleId?: string;
  tier: Tier;
  paymentStatus: PaymentStatus;
  vmIds?: string[];
  instanceSlots?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  solanaWallet?: string;
  tierSource?: TierSource;
  isAdmin?: boolean;
  referralCode?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  userId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  tier: Tier;
  txHash?: string;
  stripeSessionId?: string;
  nowpaymentsId?: string;
  clawPaymentId?: string;
  solanaSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instance {
  _id: string;
  userId: string;
  vmName: string;
  zone: string;
  ip?: string;
  status: VMStatus;
  label?: string;
  config: {
    telegramBotToken?: string;
    anthropicApiKey?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  _id: string;
  userId: string;
  scheduledAt: Date;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReferralStatus = 'pending' | 'paid' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Referral {
  _id: string;
  referrerId: string;
  referredUserId: string;
  paymentId: string;
  amount: number;
  status: ReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  amount: number;
  payoutDetails: string;
  status: WithdrawalStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierConfig {
  name: string;
  price: number;
  originalPrice?: number;
  billing: 'one-time' | 'monthly' | 'custom';
  accessPeriod?: string;
  features: string[];
  stripePriceId?: string;
  tagline?: string;
  cta?: string;
  popular?: boolean;
}
