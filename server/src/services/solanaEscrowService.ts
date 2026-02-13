import { AnchorProvider, BN, Program, Wallet, type Idl } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import idl from '../idl/reflex_pvp_escrow.json';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const CONFIG_SEED = Buffer.from('config');
const VAULT_SEED = Buffer.from('vault');
const DEFAULT_PROGRAM_ID = 'GMq3D9QQ8LxjcftXMnQUmffRoiCfczbuUoASaS7pCkp7';

const parseServerAuthority = () => {
  const raw = env.SOLANA_SERVER_AUTHORITY_SECRET_KEY?.trim();
  if (!raw) {
    logger.error('SOLANA_SERVER_AUTHORITY_SECRET_KEY is missing or empty after trimming.');
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
      logger.info('Parsed SOLANA_SERVER_AUTHORITY_SECRET_KEY as JSON array.');
      return keypair;
    }
    logger.error(
      { parsedType: typeof parsed },
      'SOLANA_SERVER_AUTHORITY_SECRET_KEY JSON parsing succeeded but did not produce an array.'
    );
    return null;
  } catch (jsonError) {
    if (raw.startsWith('[')) {
      logger.error(
        { err: jsonError },
        'Failed to parse SOLANA_SERVER_AUTHORITY_SECRET_KEY JSON array. Base58 fallback blocked to prevent corrupt key decoding.'
      );
      return null;
    }
  }

  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(raw));
    logger.info('Parsed SOLANA_SERVER_AUTHORITY_SECRET_KEY as base58.');
    return keypair;
  } catch (base58Error) {
    logger.error(
      { err: base58Error },
      'Failed to parse SOLANA_SERVER_AUTHORITY_SECRET_KEY as base58.'
    );
    return null;
  }
};

const parseProgramId = (value?: string) => {
  if (!value) return null;

  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
};

class SolanaEscrowService {
  private readonly connection: Connection;
  private readonly walletKeypair: Keypair | null;
  private readonly programId: PublicKey | null;
  private readonly provider: AnchorProvider | null;
  private readonly program: Program<Idl> | null;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL ?? env.SOLANA_RPC_URL, 'confirmed');
    this.walletKeypair = parseServerAuthority();
    this.programId = parseProgramId(env.SOLANA_PROGRAM_ID ?? DEFAULT_PROGRAM_ID);

    if (!this.walletKeypair || !this.programId) {
      if (env.SOLANA_PROGRAM_ID && !this.programId) {
        logger.warn({ programId: env.SOLANA_PROGRAM_ID }, 'Invalid SOLANA_PROGRAM_ID. Solana settlement disabled.');
      }
      this.provider = null;
      this.program = null;
      return;
    }

    const wallet = new Wallet(this.walletKeypair);
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    this.program = new Program(
      {
        ...(idl as Idl),
        address: this.programId.toBase58(),
      },
      this.provider
    );

    if (!this.programId.equals(this.program.programId)) {
      logger.warn(
        { envProgramId: this.programId.toBase58(), idlProgramId: this.program.programId.toBase58() },
        'SOLANA_PROGRAM_ID does not match IDL program address. Using env value for PDA derivations only.'
      );
    }
  }

  get isConfigured() {
    return Boolean(this.walletKeypair && this.program && this.programId);
  }

  get configuredProgramId() {
    return this.programId?.toBase58() ?? DEFAULT_PROGRAM_ID;
  }

  private getProgramId() {
    if (!this.programId) {
      throw new Error('SOLANA_PROGRAM_ID is not configured');
    }

    return this.programId;
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
      .accountsStrict({
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

  async createMatch(input: {
    playerA: string;
    stakeLamports: bigint;
    joinExpirySeconds: number;
  }) {
    if (!this.isConfigured || !this.program || !this.walletKeypair) {
      throw new Error('Solana escrow service is not configured');
    }

    const playerA = new PublicKey(input.playerA);
    const gameMatch = Keypair.generate();
    const configPda = this.deriveConfigPda();
    const vaultPda = this.deriveVaultPda(gameMatch.publicKey);

    const tx = await this.program.methods
      .createMatch(new BN(input.stakeLamports.toString()), new BN(input.joinExpirySeconds))
      .accountsStrict({
        serverAuthority: this.walletKeypair.publicKey,
        playerA,
        config: configPda,
        gameMatch: gameMatch.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = playerA;
    tx.partialSign(this.walletKeypair, gameMatch);

    return {
      gameMatch: gameMatch.publicKey.toBase58(),
      vault: vaultPda.toBase58(),
      serializedTransaction: tx
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString('base64'),
      lastValidBlockHeight,
    };
  }

  async confirmTransaction(signature: string) {
    const status = await this.connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    const confirmation = status.value;
    if (!confirmation) {
      throw new Error('Transaction status not found');
    }

    if (confirmation.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.err)}`);
    }

    if (!confirmation.confirmationStatus || confirmation.confirmationStatus === 'processed') {
      throw new Error('Transaction is not yet confirmed');
    }

    return confirmation;
  }
}

export const solanaEscrowService = new SolanaEscrowService();
