/**
 * Wallet Cryptography Utilities
 * 
 * Implements BIP-39 seed phrase generation and AES-GCM encryption
 * for secure, non-custodial Web3 wallet creation.
 */

import * as bip39 from 'bip39';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Generate a 12-word BIP-39 mnemonic seed phrase
 */
export function generateSeedPhrase(): string[] {
  const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
  return mnemonic.split(' ');
}

/**
 * Validate a BIP-39 mnemonic seed phrase
 */
export function validateSeedPhrase(seedPhrase: string[]): boolean {
  const mnemonic = seedPhrase.join(' ');
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Derive Solana Keypair from BIP-39 seed phrase
 */
export async function deriveSolanaKeypair(seedPhrase: string[]): Promise<Keypair> {
  const mnemonic = seedPhrase.join(' ');
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  // Use first 32 bytes for Solana keypair
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  return keypair;
}

/**
 * Encrypt seed phrase with AES-GCM using password
 */
export async function encryptSeedPhrase(
  seedPhrase: string[],
  password: string
): Promise<string> {
  const mnemonic = seedPhrase.join(' ');
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);

  // Derive encryption key from password using PBKDF2
  const passwordKey = await deriveKey(password);

  // Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt with AES-GCM
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    passwordKey,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt seed phrase with AES-GCM using password
 */
export async function decryptSeedPhrase(
  encryptedData: string,
  password: string
): Promise<string[]> {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Derive encryption key from password
    const passwordKey = await deriveKey(password);

    // Decrypt with AES-GCM
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      passwordKey,
      data
    );

    // Convert to string and split into words
    const decoder = new TextDecoder();
    const mnemonic = decoder.decode(decryptedData);
    return mnemonic.split(' ');
  } catch (error) {
    throw new Error('Invalid password or corrupted data');
  }
}

/**
 * Derive AES key from password using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Use a fixed salt for deterministic key derivation
  // In production, you might want to store a unique salt per wallet
  const salt = encoder.encode('reflex-wallet-salt-v1');

  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Calculate password strength (0-100)
 */
export function getPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  else if (password.length < 8) feedback.push('Use at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 10;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Add numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  else feedback.push('Add special characters');

  // Determine level
  let level: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'medium';
  else if (score < 80) level = 'strong';
  else level = 'very-strong';

  return { score, level, feedback };
}

/**
 * Store encrypted wallet in localStorage
 */
export function storeEncryptedWallet(encryptedSeed: string, publicKey: string): void {
  const walletData = {
    encryptedSeed,
    publicKey,
    createdAt: new Date().toISOString(),
    version: '1.0',
  };
  
  localStorage.setItem('reflex_wallet', JSON.stringify(walletData));
}

/**
 * Retrieve encrypted wallet from localStorage
 */
export function getEncryptedWallet(): {
  encryptedSeed: string;
  publicKey: string;
  createdAt: string;
} | null {
  const data = localStorage.getItem('reflex_wallet');
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if wallet exists
 */
export function hasWallet(): boolean {
  return !!localStorage.getItem('reflex_wallet');
}

/**
 * Delete wallet from localStorage
 */
export function deleteWallet(): void {
  localStorage.removeItem('reflex_wallet');
  localStorage.removeItem('unlock_attempts');
}

/**
 * Track unlock attempts
 */
export function getUnlockAttempts(): number {
  const attempts = localStorage.getItem('unlock_attempts');
  return attempts ? parseInt(attempts, 10) : 0;
}

export function incrementUnlockAttempts(): number {
  const attempts = getUnlockAttempts() + 1;
  localStorage.setItem('unlock_attempts', attempts.toString());
  return attempts;
}

export function resetUnlockAttempts(): void {
  localStorage.removeItem('unlock_attempts');
}
