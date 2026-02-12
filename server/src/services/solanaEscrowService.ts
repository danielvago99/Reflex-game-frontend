import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MATCH_SEED = Buffer.from('match');
const VAULT_SEED = Buffer.from('vault');
const CONFIG_SEED = Buffer.from('config');

const parseServerAuthority = () => {
  const raw = env.SOLANA_SERVER_AUTHORITY_SECRET_KEY;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    }
  } catch {
    // fallback to bs58
  }

  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
};

class SolanaEscrowService {
  private readonly connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  private readonly serverAuthority = parseServerAuthority();

  get isConfigured() {
    return Boolean(env.SOLANA_PROGRAM_ID && this.serverAuthority);
  }

  deriveMatchPda(matchId: string) {
    const programId = new PublicKey(env.SOLANA_PROGRAM_ID as string);
    return PublicKey.findProgramAddressSync([MATCH_SEED, Buffer.from(matchId)], programId)[0];
  }

  deriveVaultPda(match: PublicKey) {
    const programId = new PublicKey(env.SOLANA_PROGRAM_ID as string);
    return PublicKey.findProgramAddressSync([VAULT_SEED, match.toBuffer()], programId)[0];
  }

  async settleMatch(input: {
    matchId: string;
    winner: string;
    playerA: string;
    playerB: string;
    feeVault: string;
  }) {
    if (!this.isConfigured) {
      logger.warn({ matchId: input.matchId }, 'Solana settlement skipped (service not configured).');
      return { signature: 'settlement_skipped_unconfigured' };
    }

    const authority = this.serverAuthority as Keypair;
    const programId = new PublicKey(env.SOLANA_PROGRAM_ID as string);
    const matchPda = this.deriveMatchPda(input.matchId);
    const vaultPda = this.deriveVaultPda(matchPda);

    const ixData = Buffer.from(Uint8Array.of(3, ...new PublicKey(input.winner).toBytes()));
    const configPda = PublicKey.findProgramAddressSync([CONFIG_SEED], programId)[0];

    const ix = {
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: matchPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(input.playerA), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(input.playerB), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(input.feeVault), isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId,
      data: ixData,
    };

    const tx = new Transaction().add(ix as never);
    const signature = await sendAndConfirmTransaction(this.connection, tx, [authority]);
    return { signature };
  }
}

export const solanaEscrowService = new SolanaEscrowService();
