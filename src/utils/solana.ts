/**
 * Solana Web3 Utility
 * Handles all blockchain interactions
 * 
 * INTEGRATION STEPS:
 * 1. Install @solana/web3.js: npm install @solana/web3.js
 * 2. Configure RPC endpoint
 * 3. Implement wallet signing
 * 4. Add transaction monitoring
 */

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * Solana service for blockchain operations
 * 
 * NOTE: This uses real Solana Web3 with devnet.
 */

export interface WalletKeypair {
  publicKey: string;
  secretKey: Uint8Array;
}

class SolanaService {
  private connection!: Connection;
  private network: string;
  private rpcUrl: string;

  constructor() {
    this.network = 'devnet';
    this.rpcUrl = clusterApiUrl('devnet');
    this.initialize();
  }

  /**
   * Initialize Solana connection
   */
  private initialize(): void {
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    console.log('[Solana] Connected to', this.network);
  }

  /**
   * Generate new wallet keypair
   */
  async generateKeypair(): Promise<WalletKeypair> {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: keypair.secretKey,
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<number> {
    const publicKey = new PublicKey(address);
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Transfer SOL
   */
  async transfer(
    fromKeypair: WalletKeypair,
    toAddress: string,
    amount: number
  ): Promise<string> {
    const fromKeypairObj = Keypair.fromSecretKey(fromKeypair.secretKey);
    const toPublicKey = new PublicKey(toAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypairObj.publicKey,
        toPubkey: toPublicKey,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      })
    );

    const signature = await sendAndConfirmTransaction(this.connection, transaction, [
      fromKeypairObj,
    ]);

    return signature;
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string): Promise<any> {
    return await this.connection.getTransaction(signature);
  }

  /**
   * Validate Solana address
   */
  isValidAddress(address: string): boolean {
    if (!address) return false;

    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sign message with wallet
   */
  async signMessage(message: string, keypair: WalletKeypair): Promise<string> {
    const keypairObj = Keypair.fromSecretKey(keypair.secretKey);
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, keypairObj.secretKey);
    return btoa(String.fromCharCode(...signature));
  }

  /**
   * Verify message signature
   */
  async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const publicKeyObj = new PublicKey(publicKey);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0));
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyObj.toBytes());
    } catch {
      return false;
    }
  }

  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * 1_000_000_000); // LAMPORTS_PER_SOL
  }

  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number): number {
    return lamports / 1_000_000_000; // LAMPORTS_PER_SOL
  }

  /**
   * Get current network
   */
  getNetwork(): string {
    return this.network;
  }

  /**
   * Get RPC URL
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }
}

// Export singleton instance
export const solanaService = new SolanaService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const Solana = {
  /**
   * Generate new wallet
   */
  generateWallet: () => solanaService.generateKeypair(),

  /**
   * Get balance
   */
  getBalance: (address: string) => solanaService.getBalance(address),

  /**
   * Send SOL
   */
  sendSol: (from: WalletKeypair, to: string, amount: number) =>
    solanaService.transfer(from, to, amount),

  /**
   * Validate address
   */
  isValidAddress: (address: string) => solanaService.isValidAddress(address),

  /**
   * Sign message
   */
  signMessage: (message: string, keypair: WalletKeypair) =>
    solanaService.signMessage(message, keypair),

  /**
   * Verify signature
   */
  verifySignature: (message: string, signature: string, publicKey: string) =>
    solanaService.verifySignature(message, signature, publicKey),

  /**
   * Convert SOL to lamports
   */
  solToLamports: (sol: number) => solanaService.solToLamports(sol),

  /**
   * Convert lamports to SOL
   */
  lamportsToSol: (lamports: number) => solanaService.lamportsToSol(lamports),

  /**
   * Get network info
   */
  getNetwork: () => solanaService.getNetwork(),
  getRpcUrl: () => solanaService.getRpcUrl(),
};
