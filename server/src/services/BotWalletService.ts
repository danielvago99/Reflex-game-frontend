import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { env } from '../config/env';
import { logger } from '../utils/logger';

dotenv.config();

export interface RankedBotIdentity {
  username: string;
  publicKey: string;
  keypair: Keypair | null;
}

const BOT_USERNAMES = [
  'SolanaSlayer',
  'CryptoViking',
  'ChainRunner',
  'NFTNomad',
  'BlockBlitz',
  'GaslessGuru',
  'PhantomPulse',
  'LamportLion',
  'AnchorAce',
  'SatoshiSprint',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseBotKeypair = (entry: unknown): Keypair | null => {
  if (Array.isArray(entry)) {
    return Keypair.fromSecretKey(Uint8Array.from(entry));
  }

  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return Keypair.fromSecretKey(Uint8Array.from(parsed));
      }
    } catch {
      // Fall through to base58 decode.
    }

    const decoded = bs58.decode(trimmed);
    return Keypair.fromSecretKey(decoded);
  }

  return null;
};

class BotWalletService {
  private connection: Connection;
  private botKeypairs: Keypair[] = [];
  private botUsernames: string[] = BOT_USERNAMES;
  private treasuryWallet: PublicKey | null = null;
  private simulationMode = false;

  constructor() {
    this.connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
    this.initialize();
  }

  get isSimulationMode() {
    return this.simulationMode;
  }

  private enableSimulationMode() {
    if (!this.simulationMode) {
      this.simulationMode = true;
      logger.warn('BotWalletService running in SIMULATION mode (no real SOL payments).');
    }
  }

  private initialize() {
    const rawKeys = env.BOT_PRIVATE_KEYS;
    const treasuryWallet = env.GAME_TREASURY_WALLET;
    const rawUsernames = env.BOT_USERNAMES;

    if (!rawKeys || !treasuryWallet) {
      this.enableSimulationMode();
      return;
    }

    if (rawUsernames) {
      try {
        const parsedUsernames = JSON.parse(rawUsernames);
        if (!Array.isArray(parsedUsernames) || parsedUsernames.some((entry) => typeof entry !== 'string' || !entry.trim())) {
          throw new Error('BOT_USERNAMES must be a JSON array of non-empty strings.');
        }
        this.botUsernames = parsedUsernames;
      } catch (error) {
        logger.warn({ error }, 'Failed to parse BOT_USERNAMES env var. Falling back to default bot usernames.');
      }
    }

    let parsedKeys: unknown;
    try {
      parsedKeys = JSON.parse(rawKeys);
    } catch (error) {
      logger.warn({ error }, 'Failed to parse BOT_PRIVATE_KEYS env var.');
      this.enableSimulationMode();
      return;
    }

    if (!Array.isArray(parsedKeys) || parsedKeys.length === 0) {
      this.enableSimulationMode();
      return;
    }

    const keypairs: Keypair[] = [];
    for (const entry of parsedKeys) {
      const keypair = parseBotKeypair(entry);
      if (!keypair) {
        this.enableSimulationMode();
        return;
      }
      keypairs.push(keypair);
    }

    try {
      this.treasuryWallet = new PublicKey(treasuryWallet);
    } catch (error) {
      logger.warn({ error }, 'Failed to parse GAME_TREASURY_WALLET env var.');
      this.enableSimulationMode();
      return;
    }

    this.botKeypairs = keypairs;
  }

  async getRankedBot(requiredStake: number): Promise<RankedBotIdentity> {
    if (this.simulationMode) {
      return {
        username: 'SimulatedBot',
        publicKey: '11111111111111111111111111111111',
        keypair: null,
      };
    }

    const requiredLamports = Math.max(0, Math.round(requiredStake * LAMPORTS_PER_SOL));

    for (const [index, keypair] of this.botKeypairs.entries()) {
      const balance = await this.connection.getBalance(keypair.publicKey);
      if (balance >= requiredLamports) {
        return {
          username: this.botUsernames[index % this.botUsernames.length] ?? 'Ranked Bot',
          publicKey: keypair.publicKey.toBase58(),
          keypair,
        };
      }
    }

    throw new Error('No ranked bot wallet has sufficient balance for the required stake.');
  }

  async payEntryStake(botKeypair: Keypair | null, amount: number): Promise<string> {
    if (this.simulationMode) {
      await sleep(500);
      return 'simulated_tx_signature';
    }

    if (!botKeypair || !this.treasuryWallet) {
      throw new Error('BotWalletService is missing required keypairs or treasury wallet.');
    }

    const lamports = Math.max(0, Math.round(amount * LAMPORTS_PER_SOL));
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: botKeypair.publicKey,
        toPubkey: this.treasuryWallet,
        lamports,
      }),
    );

    return sendAndConfirmTransaction(this.connection, transaction, [botKeypair]);
  }
}

export const botWalletService = new BotWalletService();
