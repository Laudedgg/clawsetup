import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, AccountLayout } from '@solana/spl-token';
import nacl from 'tweetnacl';

export function getConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(url, 'confirmed');
}

/**
 * Fetch $CLAWS token price in USD from DexScreener API.
 */
export async function getClawTokenPrice(): Promise<number> {
  const mint = process.env.CLAW_TOKEN_MINT;
  if (!mint) throw new Error('CLAW_TOKEN_MINT is not configured');

  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
    next: { revalidate: 60 }, // cache for 60s
  });

  if (!res.ok) throw new Error('Failed to fetch token price from DexScreener');

  const data = await res.json();
  const pairs = data.pairs;
  if (!pairs || pairs.length === 0) throw new Error('No trading pairs found for $CLAWS');

  // Use the pair with highest liquidity
  const sorted = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
  const priceUsd = parseFloat(sorted[0].priceUsd);
  if (isNaN(priceUsd) || priceUsd <= 0) throw new Error('Invalid price data from DexScreener');

  return priceUsd;
}

/**
 * Get $CLAWS SPL token balance for a wallet address (in token units, not lamports).
 */
export async function getClawTokenBalance(walletAddress: string): Promise<number> {
  const mint = process.env.CLAW_TOKEN_MINT;
  if (!mint) throw new Error('CLAW_TOKEN_MINT is not configured');

  const connection = getConnection();
  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mint);

  try {
    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    const account = await getAccount(connection, ata);
    // SPL tokens on PumpFun typically have 6 decimals
    const decimals = 6;
    return Number(account.amount) / Math.pow(10, decimals);
  } catch (err: any) {
    // Account doesn't exist = 0 balance
    if (err.name === 'TokenAccountNotFoundError' || err.message?.includes('could not find account')) {
      return 0;
    }
    throw err;
  }
}

/**
 * Verify an ed25519 signature from a Solana wallet (Phantom).
 */
export function verifyWalletSignature(
  publicKey: string,
  message: string,
  signature: string
): boolean {
  try {
    const pubkeyBytes = new PublicKey(publicKey).toBytes();
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    return nacl.sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
  } catch {
    return false;
  }
}

/**
 * Verify an SPL token transfer on-chain.
 * Checks that the transaction contains a transfer of the expected token
 * to the expected recipient with at least the minimum amount.
 */
export async function verifySplTransfer(
  txSignature: string,
  expectedRecipient: string,
  expectedMint: string,
  minAmount: number
): Promise<{ verified: boolean; amount: number }> {
  const connection = getConnection();

  const tx = await connection.getParsedTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || !tx.meta || tx.meta.err) {
    return { verified: false, amount: 0 };
  }

  // Look through all inner instructions and main instructions for SPL token transfers
  const allInstructions = [
    ...(tx.transaction.message.instructions || []),
    ...(tx.meta.innerInstructions?.flatMap((ix) => ix.instructions) || []),
  ];

  for (const ix of allInstructions) {
    if ('parsed' in ix && ix.program === 'spl-token') {
      const { type, info } = ix.parsed;
      if (type === 'transfer' || type === 'transferChecked') {
        const destination = info.destination || info.account;
        const mint = info.mint;
        const amount = type === 'transferChecked'
          ? parseFloat(info.tokenAmount?.uiAmountString || '0')
          : Number(info.amount) / Math.pow(10, 6); // assume 6 decimals

        // For 'transfer' type, we need to check if the destination ATA belongs to our treasury
        // For 'transferChecked', we can check mint directly
        if (type === 'transferChecked' && mint === expectedMint && amount >= minAmount) {
          // Verify the destination is the treasury's ATA
          const treasuryAta = await getAssociatedTokenAddress(
            new PublicKey(expectedMint),
            new PublicKey(expectedRecipient)
          );
          if (destination === treasuryAta.toBase58()) {
            return { verified: true, amount };
          }
        }

        // For regular 'transfer', check if destination matches treasury ATA
        if (type === 'transfer' && amount >= minAmount) {
          const treasuryAta = await getAssociatedTokenAddress(
            new PublicKey(expectedMint),
            new PublicKey(expectedRecipient)
          );
          if (destination === treasuryAta.toBase58()) {
            return { verified: true, amount };
          }
        }
      }
    }
  }

  return { verified: false, amount: 0 };
}
