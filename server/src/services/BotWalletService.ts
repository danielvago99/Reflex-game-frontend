import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
  type Idl,
} from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';
import { env } from '../config/env';
import prisma from '../db/prisma';
import escrowIdl from '../idl/reflex_pvp_escrow.json';
import { logger } from '../utils/logger';

export interface RankedBotIdentity {
  userId: string;
  username: string;
  publicKey: string;
  avatar: string;
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

const BOT_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/personas/svg?seed=Kai',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Aurora',
  'https://api.dicebear.com/7.x/personas/svg?seed=River',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
];

interface RankedBotProfile {
  userId: string;
  username: string;
  avatar: string;
}

interface BotJoinMatchInput {
  botKeypair: Keypair | null;
  gameMatch: string;
  stakeLamports: number;
  settleDeadlineSeconds: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const VAULT_SEED = Buffer.from('vault');
const DEFAULT_PROGRAM_ID = 'GMq3D9QQ8LxjcftXMnQUmffRoiCfczbuUoASaS7pCkp7';
const BOT_GAS_BUFFER_LAMPORTS = Math.round(0.002 * LAMPORTS_PER_SOL);

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
  private botProfilesByWallet = new Map<string, RankedBotProfile>();
  private programId: PublicKey;
  private simulationMode = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
    this.programId = new PublicKey(env.SOLANA_PROGRAM_ID ?? DEFAULT_PROGRAM_ID);
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
    this.initializationPromise = this.initializeInternal();
  }

  private async initializeInternal() {
    const rawKeys = process.env.BOT_PRIVATE_KEYS;
    const rawUsernames = process.env.BOT_USERNAMES;

    if (!rawKeys) {
      this.enableSimulationMode();
      return;
    }

    if (rawUsernames) {
      try {
        const parsedUsernames = JSON.parse(rawUsernames);
        if (
          !Array.isArray(parsedUsernames) ||
          parsedUsernames.some((entry) => typeof entry !== 'string' || !entry.trim())
        ) {
          throw new Error('BOT_USERNAMES must be a JSON array of non-empty strings.');
        }
        this.botUsernames = parsedUsernames;
      } catch (error) {
        logger.warn(
          { error },
          'Failed to parse BOT_USERNAMES env var. Falling back to default bot usernames.',
        );
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

    this.botKeypairs = keypairs;
    await this.syncBotsAsUsers();
  }

  private async syncBotsAsUsers() {
    this.botProfilesByWallet.clear();

    for (const [index, keypair] of this.botKeypairs.entries()) {
      const walletAddress = keypair.publicKey.toBase58();
      const username =
        this.botUsernames[index % this.botUsernames.length] ?? `RankedBot${index + 1}`;
      const avatar = BOT_AVATARS[index % BOT_AVATARS.length];

      try {
        const user = await prisma.user.upsert({
          where: { walletAddress },
          update: {
            username,
            avatar,
          },
          create: {
            walletAddress,
            username,
            avatar,
          },
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        });

        const existingRewards = await prisma.playerRewards.findUnique({
          where: { userId: user.id },
        });

        if (!existingRewards) {
          await prisma.playerRewards.create({
            data: {
              userId: user.id,
              reflexPoints: 0,
              totalFreeStakes: 0,
              dailyStreak: 0,
            },
          });
          logger.info({ userId: user.id }, 'Initialized PlayerRewards for bot');
        }

        this.botProfilesByWallet.set(walletAddress, {
          userId: user.id,
          username: user.username ?? username,
          avatar: user.avatar ?? avatar,
        });
      } catch (error) {
        logger.error({ error, walletAddress, username }, 'Failed to upsert ranked bot user');
      }
    }

    logger.info({ count: this.botProfilesByWallet.size }, 'Ranked bot users synced in database');
  }

  async getRankedBot(requiredStakeLamports: number): Promise<RankedBotIdentity> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (this.simulationMode) {
      return {
        userId: 'bot_opponent',
        username: 'SimulatedBot',
        publicKey: '11111111111111111111111111111111',
        avatar: BOT_AVATARS[0],
        keypair: null,
      };
    }

    const requiredLamports = Math.max(0, Math.round(requiredStakeLamports));
    const minimumBalance = requiredLamports + BOT_GAS_BUFFER_LAMPORTS;

    for (const [index, keypair] of this.botKeypairs.entries()) {
      const balance = await this.connection.getBalance(keypair.publicKey);
      if (balance >= minimumBalance) {
        const walletAddress = keypair.publicKey.toBase58();
        const profile = this.botProfilesByWallet.get(walletAddress);
        const username = this.botUsernames[index % this.botUsernames.length] ?? 'Ranked Bot';
        const avatar = BOT_AVATARS[index % BOT_AVATARS.length];

        return {
          userId: profile?.userId ?? walletAddress,
          username: profile?.username ?? username,
          publicKey: walletAddress,
          avatar: profile?.avatar ?? avatar,
          keypair,
        };
      }
    }

    throw new Error(
      `No ranked bot wallet has sufficient balance for stake + gas reserve (${minimumBalance} lamports).`,
    );
  }

  private createBotProgram(botKeypair: Keypair) {
    const botProvider = new AnchorProvider(this.connection, new Wallet(botKeypair), {
      commitment: 'confirmed',
    });

    return new Program(
      {
        ...(escrowIdl as Idl),
        address: this.programId.toBase58(),
      },
      botProvider,
    );
  }

  async joinRankedMatch({
    botKeypair,
    gameMatch,
    stakeLamports,
    settleDeadlineSeconds,
  }: BotJoinMatchInput): Promise<string> {
    if (this.simulationMode) {
      await sleep(500);
      return 'simulated_tx_signature';
    }

    if (!botKeypair) {
      throw new Error('BotWalletService is missing ranked bot keypair.');
    }

    const requiredBalance = stakeLamports + BOT_GAS_BUFFER_LAMPORTS;
    const currentBalance = await this.connection.getBalance(botKeypair.publicKey);

    if (currentBalance < requiredBalance) {
      throw new Error(
        `Ranked bot has insufficient SOL. Required=${requiredBalance} lamports, balance=${currentBalance} lamports.`,
      );
    }

    const gameMatchPubkey = new PublicKey(gameMatch);
    const vault = PublicKey.findProgramAddressSync([VAULT_SEED, gameMatchPubkey.toBuffer()], this.programId)[0];
    const program = this.createBotProgram(botKeypair);

    const signature = await program.methods
      .joinMatch(new BN(settleDeadlineSeconds))
      .accounts({
        playerB: botKeypair.publicKey,
        gameMatch: gameMatchPubkey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([botKeypair])
      .rpc();

    const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');
    const confirmation = await this.connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    );

    if (confirmation.value.err) {
      throw new Error(`Ranked bot joinMatch transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  }
}

export const botWalletService = new BotWalletService();
