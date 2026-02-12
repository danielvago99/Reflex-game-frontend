import { AnchorProvider, Program, Wallet, type Idl } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import idl from '../idl/reflex_pvp_escrow.json';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const CONFIG_SEED = Buffer.from('config');
const VAULT_SEED = Buffer.from('vault');

const parseServerAuthority = () => {
  const raw = env.SOLANA_SERVER_AUTHORITY_SECRET_KEY;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    }
  } catch {
    // fallback to bs58 secret key
  }

  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
};

class SolanaEscrowService {
  private readonly connection: Connection;
  private readonly walletKeypair: Keypair | null;
  private readonly provider: AnchorProvider | null;
  private readonly program: Program<Idl> | null;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL ?? env.SOLANA_RPC_URL, 'confirmed');
    this.walletKeypair = parseServerAuthority();

    if (!this.walletKeypair || !env.SOLANA_PROGRAM_ID) {
      this.provider = null;
      this.program = null;
      return;
    }

    const wallet = new Wallet(this.walletKeypair);
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    const programId = new PublicKey(env.SOLANA_PROGRAM_ID);
    this.program = new Program(idl as Idl, this.provider);

    if (!programId.equals(this.program.programId)) {
      logger.warn(
        { envProgramId: programId.toBase58(), idlProgramId: this.program.programId.toBase58() },
        'SOLANA_PROGRAM_ID does not match IDL program address. Using env value for PDA derivations only.'
      );
    }
  }

  get isConfigured() {
    return Boolean(this.walletKeypair && this.program && env.SOLANA_PROGRAM_ID);
  }

  private getProgramId() {
    return new PublicKey(env.SOLANA_PROGRAM_ID as string);
  }

  private deriveConfigPda() {
    return PublicKey.findProgramAddressSync([CONFIG_SEED], this.getProgramId())[0];
  }

  private deriveVaultPda(gameMatch: PublicKey) {
    return PublicKey.findProgramAddressSync([VAULT_SEED, gameMatch.toBuffer()], this.getProgramId())[0];
  }

  private async resolveFeeVault(feeVault?: string) {
    if (feeVault) {
      return new PublicKey(feeVault);
    }

    if (!this.program) {
      throw new Error('Anchor program is not initialized');
    }

    const configPda = this.deriveConfigPda();
    const configAccount = await (this.program.account as any).config.fetchNullable(configPda);

    if (!configAccount) {
      throw new Error('Config account not found on-chain and feeVault was not provided');
    }

    return new PublicKey(configAccount.feeVault as PublicKey);
  }

  async settleMatch(input: {
    gameMatch?: string;
    matchId?: string;
    winner: string;
    playerA: string;
    playerB: string;
    feeVault?: string;
  }) {
    if (!this.isConfigured || !this.program || !this.provider || !this.walletKeypair) {
      logger.warn({ input }, 'Solana settlement skipped (service not configured).');
      return { signature: 'settlement_skipped_unconfigured' };
    }

    const gameMatchKey = input.gameMatch ?? input.matchId;
    if (!gameMatchKey) {
      throw new Error('gameMatch public key is required for settlement');
    }

    const gameMatch = new PublicKey(gameMatchKey);
    const winner = new PublicKey(input.winner);
    const playerA = new PublicKey(input.playerA);
    const playerB = new PublicKey(input.playerB);

    const configPda = this.deriveConfigPda();
    const vaultPda = this.deriveVaultPda(gameMatch);
    const feeVault = await this.resolveFeeVault(input.feeVault);

    const signature = await this.program.methods
      .settle(winner)
      .accounts({
        serverAuthority: this.walletKeypair.publicKey,
        config: configPda,
        gameMatch,
        vault: vaultPda,
        playerA,
        playerB,
        feeVault,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { signature };
  }
}

export const solanaEscrowService = new SolanaEscrowService();
