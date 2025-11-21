/**
 * Wallet Cryptography Utilities
 */
import { generateMnemonic, validateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import { hash, ArgonType } from 'argon2-browser';
import wasmURL from 'argon2-browser/dist/argon2.wasm?url';
import { Keypair } from '@solana/web3.js';
import { openDB } from 'idb';

const DB_NAME = 'reflex_wallet_secure';
const DB_VERSION = 2;
const WALLET_STORE = 'wallet';
const ATTEMPT_STORE = 'attempts';
const ACTIVE_KEY = 'active_wallet';
const MAX_UNLOCK_ATTEMPTS = 5;

export const ARGON2_TIME_COST = 3;
export const ARGON2_MEMORY_COST = 65_536; // KiB (64 MB)
export const ARGON2_PARALLELISM = 1;
export const ARGON2_HASH_LENGTH = 32; // bytes

export interface EncryptedWalletRecord {
  ciphertext: string;
  iv: string;
  salt: string;
  publicKey: string;
  createdAt: number;
  version: '2.0';
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
}

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(WALLET_STORE)) {
        db.createObjectStore(WALLET_STORE);
      }
      if (!db.objectStoreNames.contains(ATTEMPT_STORE)) {
        db.createObjectStore(ATTEMPT_STORE);
      }

      if (oldVersion < 2) {
        // Placeholder to keep migration hook; actual migration handled at runtime
      }
    }
  });
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getWebCrypto(): Crypto {
  const scope = globalThis as typeof globalThis & { crypto?: Crypto; msCrypto?: Crypto };
  const cryptoApi = scope.crypto ?? scope.msCrypto;

  if (!cryptoApi || !cryptoApi.subtle) {
    throw new Error(
      'Secure cryptography APIs are not available. Please try again in a modern browser over HTTPS or in a secure context.'
    );
  }

  return cryptoApi;
}

const toBase64 = (data: ArrayBuffer | Uint8Array) => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes));
};

const fromBase64 = (value: string) => new Uint8Array(atob(value).split('').map((char) => char.charCodeAt(0)));

export function generateSeedPhrase(): string[] {
  const mnemonic = generateMnemonic(englishWordlist, 128);
  return mnemonic.split(' ');
}

export function validateSeedPhrase(seedPhrase: string[]): boolean {
  return validateMnemonic(seedPhrase.join(' '), englishWordlist);
}

export async function deriveSolanaKeypair(seedPhrase: string[]): Promise<Keypair> {
  const mnemonic = seedPhrase.join(' ');
  const seed = await mnemonicToSeed(mnemonic);
  return Keypair.fromSeed(seed.slice(0, 32));
}

type SaltSource = Uint8Array | ArrayBufferLike;

function normalizeSalt(salt: SaltSource): Uint8Array {
  return salt instanceof Uint8Array ? salt : new Uint8Array(salt);
}

async function deriveKeyArgon2id(password: string, salt: SaltSource): Promise<CryptoKey> {
  const cryptoApi = getWebCrypto();
  const saltBytes = normalizeSalt(salt);
  const { hash: derivedBytes } = await hash({
    pass: password,
    salt: saltBytes,
    type: ArgonType.Argon2id,
    time: ARGON2_TIME_COST,
    mem: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
    hashLen: ARGON2_HASH_LENGTH,
    wasmURL
  });

  return cryptoApi.subtle.importKey(
    'raw',
    derivedBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSeedPhrase(seedPhrase: string[], password: string): Promise<EncryptedWalletRecord> {
  const cryptoApi = getWebCrypto();
  const mnemonic = seedPhrase.join(' ');
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyArgon2id(password, salt);
  const ciphertext = await cryptoApi.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(mnemonic)
  );

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
    publicKey: '',
    createdAt: Date.now(),
    version: '2.0'
  };
}

export async function decryptSeedPhrase(record: EncryptedWalletRecord, password: string): Promise<string[]> {
  try {
    const cryptoApi = getWebCrypto();
    const salt = fromBase64(record.salt);
    const iv = fromBase64(record.iv);
    const key = await deriveKeyArgon2id(password, salt);
    const decrypted = await cryptoApi.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      fromBase64(record.ciphertext)
    );
    const mnemonic = decoder.decode(decrypted);
    return mnemonic.split(' ');
  } catch (error) {
    throw new Error('Invalid password or corrupted data');
  }
}

export function getPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  else if (password.length < 8) feedback.push('Use at least 8 characters');
  if (/[a-z]/.test(password)) score += 10;
  else feedback.push('Add lowercase letters');
  if (/[A-Z]/.test(password)) score += 10;
  else feedback.push('Add uppercase letters');
  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Add numbers');
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  else feedback.push('Add special characters');

  let level: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'medium';
  else if (score < 80) level = 'strong';
  else level = 'very-strong';

  return { score, level, feedback };
}

export async function storeEncryptedWallet(record: EncryptedWalletRecord): Promise<void> {
  const db = await getDb();
  await db.put(WALLET_STORE, record, ACTIVE_KEY);
}

export async function getEncryptedWallet(): Promise<EncryptedWalletRecord | null> {
  const db = await getDb();
  const record = (await db.get(WALLET_STORE, ACTIVE_KEY)) as EncryptedWalletRecord | null;
  if (!record) return null;

  return {
    ...record,
    createdAt: typeof record.createdAt === 'string' ? Date.parse(record.createdAt) || Date.now() : record.createdAt
  };
}

export async function hasWallet(): Promise<boolean> {
  const db = await getDb();
  const record = await db.get(WALLET_STORE, ACTIVE_KEY);
  return !!record;
}

export async function deleteWallet(): Promise<void> {
  const db = await getDb();
  await db.delete(WALLET_STORE, ACTIVE_KEY);
  await db.delete(ATTEMPT_STORE, ACTIVE_KEY);
}

export async function updateWalletRecord(update: Partial<EncryptedWalletRecord>): Promise<EncryptedWalletRecord> {
  const current = await getEncryptedWallet();
  if (!current) {
    throw new Error('No wallet found');
  }

  const merged: EncryptedWalletRecord = {
    ...current,
    ...update,
    createdAt: current.createdAt || Date.now(),
    version: '2.0'
  };

  await storeEncryptedWallet(merged);
  return merged;
}

export async function getUnlockAttempts(): Promise<number> {
  const db = await getDb();
  return (await db.get(ATTEMPT_STORE, ACTIVE_KEY)) || 0;
}

export async function incrementUnlockAttempts(): Promise<number> {
  const db = await getDb();
  const next = (await getUnlockAttempts()) + 1;
  await db.put(ATTEMPT_STORE, next, ACTIVE_KEY);
  return next;
}

export async function resetUnlockAttempts(): Promise<void> {
  const db = await getDb();
  await db.put(ATTEMPT_STORE, 0, ACTIVE_KEY);
}

export function isUnlockBlocked(attempts: number): boolean {
  return attempts >= MAX_UNLOCK_ATTEMPTS;
}

// Argon2id is the sole KDF used for wallet protection; adjust the Argon2 constants above to tune security vs. performance.
// PBKDF2 support was removed; all wallets are derived exclusively with Argon2id parameters defined in this module.
