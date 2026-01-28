/**
 * Wallet Cryptography Utilities
 */
import { generateMnemonic, validateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import { argon2idAsync } from '@noble/hashes/argon2';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { openDB } from 'idb';

// Argon2id is the sole KDF for wallet encryption; tweak the parameters below to strengthen or relax derivation cost.
export const ARGON2_TIME_COST = 3;
export const ARGON2_MEMORY_COST = 65_536; // KiB (64 MiB)
export const ARGON2_PARALLELISM = 1;
export const ARGON2_HASH_LENGTH = 32; // bytes

const DB_NAME = 'reflex_wallet_secure';
const DB_VERSION = 3;
const WALLET_STORE = 'wallet';
const ATTEMPT_STORE = 'attempts';
const BIOMETRIC_STORE = 'biometric';
const ACTIVE_KEY = 'active_wallet';
const BIOMETRIC_KEY = 'biometric_key';
const BIOMETRIC_PAYLOAD = 'biometric_payload';
const MAX_UNLOCK_ATTEMPTS = 5;

type WalletStorage = {
  get: <T>(store: string, key: string) => Promise<T | undefined>;
  put: (store: string, value: unknown, key: string) => Promise<void>;
  delete: (store: string, key: string) => Promise<void>;
};

let storagePromise: Promise<WalletStorage> | null = null;

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

type BiometricPayload = {
  ciphertext: string;
  iv: string;
};

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(WALLET_STORE)) {
        db.createObjectStore(WALLET_STORE);
      }
      if (!db.objectStoreNames.contains(ATTEMPT_STORE)) {
        db.createObjectStore(ATTEMPT_STORE);
      }
      if (!db.objectStoreNames.contains(BIOMETRIC_STORE)) {
        db.createObjectStore(BIOMETRIC_STORE);
      }

      if (oldVersion < 2) {
        // Placeholder to keep migration hook; actual migration handled at runtime
      }
      if (oldVersion < 3 && !db.objectStoreNames.contains(BIOMETRIC_STORE)) {
        db.createObjectStore(BIOMETRIC_STORE);
      }
    }
  });
}

async function createStorage(): Promise<WalletStorage> {
  try {
    const db = await getDb();
    return {
      get: (store, key) => db.get(store, key),
      put: (store, value, key) => db.put(store, value, key),
      delete: (store, key) => db.delete(store, key)
    };
  } catch (error) {
    console.warn('IndexedDB unavailable, falling back to in-memory wallet store', error);
    const walletStore = new Map<string, unknown>();
    const attemptStore = new Map<string, unknown>();
    const biometricStore = new Map<string, unknown>();

    const resolveStore = (store: string) => {
      if (store === WALLET_STORE) return walletStore;
      if (store === ATTEMPT_STORE) return attemptStore;
      return biometricStore;
    };

    return {
      get: async <T>(store, key) => resolveStore(store).get(key) as T | undefined,
      put: async (store, value, key) => {
        resolveStore(store).set(key, value);
      },
      delete: async (store, key) => {
        resolveStore(store).delete(key);
      }
    };
  }
}

async function getStorage(): Promise<WalletStorage> {
  if (!storagePromise) {
    storagePromise = createStorage();
  }

  return storagePromise;
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

export async function signMessageWithSeedPhrase(
  seedPhrase: string[],
  message: string | Uint8Array
): Promise<Uint8Array> {
  const keypair = await deriveSolanaKeypair(seedPhrase);
  const messageBytes = typeof message === 'string' ? encoder.encode(message) : message;
  return nacl.sign.detached(messageBytes, keypair.secretKey);
}

type SaltSource = Uint8Array | ArrayBufferLike;

function normalizeSalt(salt: SaltSource): Uint8Array {
  return salt instanceof Uint8Array ? salt : new Uint8Array(salt);
}

// Derive an AES-GCM key from the password using Argon2id and the tunable parameters above.
async function deriveKeyArgon2id(password: string, salt: SaltSource): Promise<CryptoKey> {
  const cryptoApi = getWebCrypto();
  const saltBytes = normalizeSalt(salt);
  const keyBytes = await argon2idAsync(password, saltBytes, {
    t: ARGON2_TIME_COST,
    m: ARGON2_MEMORY_COST,
    p: ARGON2_PARALLELISM,
    dkLen: ARGON2_HASH_LENGTH
  });

  return cryptoApi.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
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
  const storage = await getStorage();
  await storage.put(WALLET_STORE, record, ACTIVE_KEY);
}

export async function getEncryptedWallet(): Promise<EncryptedWalletRecord | null> {
  const storage = await getStorage();
  const record = (await storage.get<EncryptedWalletRecord>(WALLET_STORE, ACTIVE_KEY)) || null;
  if (!record) return null;

  return {
    ...record,
    createdAt: typeof record.createdAt === 'string' ? Date.parse(record.createdAt) || Date.now() : record.createdAt
  };
}

export async function hasWallet(): Promise<boolean> {
  const storage = await getStorage();
  const record = await storage.get(WALLET_STORE, ACTIVE_KEY);
  return !!record;
}

export async function deleteWallet(): Promise<void> {
  const storage = await getStorage();
  await storage.delete(WALLET_STORE, ACTIVE_KEY);
  await storage.delete(ATTEMPT_STORE, ACTIVE_KEY);
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
  const storage = await getStorage();
  return (await storage.get<number>(ATTEMPT_STORE, ACTIVE_KEY)) || 0;
}

export async function incrementUnlockAttempts(): Promise<number> {
  const storage = await getStorage();
  const next = (await getUnlockAttempts()) + 1;
  await storage.put(ATTEMPT_STORE, next, ACTIVE_KEY);
  return next;
}

export async function resetUnlockAttempts(): Promise<void> {
  const storage = await getStorage();
  await storage.put(ATTEMPT_STORE, 0, ACTIVE_KEY);
}

export function isUnlockBlocked(attempts: number): boolean {
  return attempts >= MAX_UNLOCK_ATTEMPTS;
}

export async function storeBiometricUnlockSecret(password: string): Promise<void> {
  const cryptoApi = getWebCrypto();
  const storage = await getStorage();
  let key = await storage.get<CryptoKey>(BIOMETRIC_STORE, BIOMETRIC_KEY);

  if (!key) {
    key = await cryptoApi.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await storage.put(BIOMETRIC_STORE, key, BIOMETRIC_KEY);
  }

  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const ciphertext = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(password));
  const payload: BiometricPayload = {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv)
  };

  await storage.put(BIOMETRIC_STORE, payload, BIOMETRIC_PAYLOAD);
}

export async function hasBiometricUnlockSecret(): Promise<boolean> {
  const storage = await getStorage();
  const payload = await storage.get<BiometricPayload>(BIOMETRIC_STORE, BIOMETRIC_PAYLOAD);
  return Boolean(payload?.ciphertext && payload?.iv);
}

export async function getBiometricUnlockSecret(): Promise<string | null> {
  const cryptoApi = getWebCrypto();
  const storage = await getStorage();
  const key = await storage.get<CryptoKey>(BIOMETRIC_STORE, BIOMETRIC_KEY);
  const payload = await storage.get<BiometricPayload>(BIOMETRIC_STORE, BIOMETRIC_PAYLOAD);

  if (!key || !payload?.ciphertext || !payload?.iv) {
    return null;
  }

  try {
    const decrypted = await cryptoApi.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext)
    );
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt biometric unlock secret', error);
    return null;
  }
}

export async function clearBiometricUnlockSecret(): Promise<void> {
  const storage = await getStorage();
  await storage.delete(BIOMETRIC_STORE, BIOMETRIC_KEY);
  await storage.delete(BIOMETRIC_STORE, BIOMETRIC_PAYLOAD);
}
