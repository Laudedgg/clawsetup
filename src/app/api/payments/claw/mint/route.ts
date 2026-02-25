import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mint = process.env.CLAW_TOKEN_MINT;
  if (!mint) {
    return NextResponse.json({ error: '$CLAWS token not configured' }, { status: 500 });
  }
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return NextResponse.json({ mint, decimals: 6, rpcUrl });
}
