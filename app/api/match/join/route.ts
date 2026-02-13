import { NextResponse } from 'next/server';
import { solanaEscrowService } from '../../../../server/src/services/solanaEscrowService';

const DEFAULT_SETTLE_DEADLINE_SECONDS = 900;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gameMatch = body?.gameMatch;
    const playerWallet = body?.playerWallet;

    if (typeof gameMatch !== 'string' || gameMatch.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid gameMatch. Expected a non-empty string.' }, { status: 400 });
    }

    if (typeof playerWallet !== 'string' || playerWallet.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid playerWallet. Expected a non-empty string.' }, { status: 400 });
    }

    const { serializedTransaction } = await solanaEscrowService.joinMatch({
      gameMatch,
      playerB: playerWallet,
      settleDeadlineSeconds: DEFAULT_SETTLE_DEADLINE_SECONDS,
    });

    return NextResponse.json({ serializedTransaction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create join transaction.' },
      { status: 500 }
    );
  }
}
