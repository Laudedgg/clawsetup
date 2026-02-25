import axios from 'axios';
import crypto from 'crypto';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

const nowpaymentsClient = axios.create({
  baseURL: NOWPAYMENTS_API_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface CreatePaymentParams {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
}

export async function createPayment(params: CreatePaymentParams) {
  const response = await nowpaymentsClient.post('/payment', params);
  return response.data;
}

export async function getPaymentStatus(paymentId: string) {
  const response = await nowpaymentsClient.get(`/payment/${paymentId}`);
  return response.data;
}

export async function getAvailableCurrencies() {
  const response = await nowpaymentsClient.get('/currencies');
  return response.data.currencies;
}

export async function getMinimumPaymentAmount(currency: string) {
  const response = await nowpaymentsClient.get(`/min-amount?currency_from=${currency}&currency_to=usd`);
  return response.data;
}

export function verifyIPN(data: any, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET || '';
  if (!secret) return false;

  // NowPayments IPN signature is HMAC-SHA512 over the raw JSON payload.
  // We recompute using JSON.stringify. For strict compatibility, ensure the
  // same payload string is used; in our webhook route we pass through the
  // parsed body (best-effort). If you need strict verification, capture raw body.
  const payload = JSON.stringify(data);
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(payload);
  const calculated = hmac.digest('hex');

  // Case-insensitive compare
  return calculated.toLowerCase() === (signature || '').toLowerCase();
}
