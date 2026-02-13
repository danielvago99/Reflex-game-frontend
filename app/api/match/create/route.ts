import { NextResponse } from 'next/server';
import { solanaEscrowService } from '../../../../server/src/services/solanaEscrowService';

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_JOIN_EXPIRY_SECONDS = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stakeAmount = body?.stakeAmount;
    const playerWallet = body?.playerWallet;

    if (typeof stakeAmount !== 'number' || !Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ error: 'Invalid stakeAmount. Expected a positive number.' }, { status: 400 });
    }

    if (typeof playerWallet !== 'string' || playerWallet.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid playerWallet. Expected a non-empty string.' }, { status: 400 });
    }

    const stakeLamports = BigInt(Math.round(stakeAmount * LAMPORTS_PER_SOL));

    const result = await solanaEscrowService.createMatch({
      playerA: playerWallet,
      stakeLamports,
      joinExpirySeconds: DEFAULT_JOIN_EXPIRY_SECONDS,
    });

    return NextResponse.json({
      serializedTransaction: result.serializedTransaction,
      gameMatch: result.gameMatch,
      vault: result.vault,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create match transaction.' },
      { status: 500 }
    );
  }
}
