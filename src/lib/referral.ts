import crypto from 'crypto';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join('');
}

export const COMMISSION_RATE = 0.10;
