import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import {
  deriveSolanaKeypair,
  encryptSeedPhrase,
  decryptSeedPhrase,
  generateSeedPhrase,
  getEncryptedWallet,
  getUnlockAttempts,
  hasWallet,
  incrementUnlockAttempts,
  isUnlockBlocked,
  resetUnlockAttempts,
  storeEncryptedWallet,
  validateSeedPhrase,
  signMessageWithSeedPhrase,
  type EncryptedWalletRecord
} from '../../../utils/walletCrypto';

interface WalletContextValue {
  address: string;
  provider?: string;
  hasStoredWallet: boolean;
  generateSeed: () => string[];
  getSeed: () => string[];
  setPassword: (password: string) => void;
  getVaultStatus: () => { hasSeed: boolean; hasPassword: boolean };
  encryptAndStore: () => Promise<EncryptedWalletRecord>;
  unlock: (password: string) => Promise<{ seed: string[]; publicKey: string }>;
  importFromSeed: (seedPhrase: string[], password: string) => Promise<EncryptedWalletRecord>;
  importFromKeystore: (record: EncryptedWalletRecord, password: string) => Promise<{ seed: string[]; publicKey: string }>;
  connectExternalWallet: (address: string, provider: string) => void;
  signMessage: (message: string | Uint8Array) => Promise<Uint8Array>;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const createEmptyVault = () => ({ seed: [] as string[], password: '' });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [hasStoredWalletState, setHasStoredWallet] = useState(false);
  const vaultRef = useRef(createEmptyVault());

  useEffect(() => {
    hasWallet().then(setHasStoredWallet).catch(() => setHasStoredWallet(false));
    return () => {
      vaultRef.current = createEmptyVault();
    };
  }, []);

  const generateSeed = () => {
    const seed = generateSeedPhrase();
    vaultRef.current = createEmptyVault();
    vaultRef.current.seed = seed;
    return seed;
  };

  const getSeed = () => [...vaultRef.current.seed];

  const setPassword = (password: string) => {
    vaultRef.current.password = password;
  };

  const getVaultStatus = () => ({
    hasSeed: vaultRef.current.seed.length > 0,
    hasPassword: Boolean(vaultRef.current.password)
  });

  const persistVaultToStorage = async (seedPhrase: string[], password: string) => {
    const encrypted = await encryptSeedPhrase(seedPhrase, password);
    const keypair = await deriveSolanaKeypair(seedPhrase);
    const record: EncryptedWalletRecord = {
      ...encrypted,
      publicKey: keypair.publicKey.toBase58(),
      createdAt: encrypted.createdAt,
      version: '2.0'
    };

    await storeEncryptedWallet(record);

    await resetUnlockAttempts();
    setAddress(record.publicKey);
    setHasStoredWallet(true);
    vaultRef.current = { seed: seedPhrase, password: '' };
    return record;
  };

  const encryptAndStore = async () => {
    const { hasSeed, hasPassword } = getVaultStatus();

    if (!hasSeed && !hasPassword) {
      throw new Error('Cannot encrypt wallet: seed phrase and password are missing');
    }

    if (!hasSeed) {
      throw new Error('Cannot encrypt wallet: seed phrase was not generated');
    }

    if (!hasPassword) {
      throw new Error('Cannot encrypt wallet: password was not set');
    }

    return persistVaultToStorage(vaultRef.current.seed, vaultRef.current.password);
  };

  const unlock = async (password: string) => {
    const attempts = await getUnlockAttempts();
    if (isUnlockBlocked(attempts)) {
      throw new Error('Too many unlock attempts');
    }

    const record = await getEncryptedWallet();
    if (!record) {
      throw new Error('No wallet found');
    }

    try {
      const seed = await decryptSeedPhrase(record, password);
      await resetUnlockAttempts();
      vaultRef.current.seed = seed;
      const keypair = await deriveSolanaKeypair(seed);
      const publicKey = record.publicKey || keypair.publicKey.toBase58();
      setAddress(publicKey);
      return { seed, publicKey };
    } catch (error) {
      const next = await incrementUnlockAttempts();
      if (isUnlockBlocked(next)) {
        throw new Error('Too many unlock attempts');
      }
      throw error instanceof Error ? error : new Error('Unable to unlock wallet');
    }
  };

  const importFromSeed = async (seedPhrase: string[], password: string) => {
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error('Invalid seed phrase');
    }

    vaultRef.current.seed = seedPhrase;
    vaultRef.current.password = password;
    return persistVaultToStorage(seedPhrase, password);
  };

  const importFromKeystore = async (record: EncryptedWalletRecord, password: string) => {
    if (!record?.ciphertext || !record.iv || !record.salt) {
      throw new Error('Invalid keystore file');
    }

    const seed = await decryptSeedPhrase(record, password);
    const keypair = await deriveSolanaKeypair(seed);
    const publicKey = record.publicKey || keypair.publicKey.toBase58();

    const normalized: EncryptedWalletRecord = {
      ...record,
      publicKey,
      createdAt: typeof record.createdAt === 'string' ? Date.parse(record.createdAt) || Date.now() : record.createdAt || Date.now(),
      version: record.version || '2.0'
    } as EncryptedWalletRecord;

    await storeEncryptedWallet(normalized);
    await resetUnlockAttempts();
    setAddress(publicKey);
    setHasStoredWallet(true);
    vaultRef.current = { seed, password: '' };
    return { seed, publicKey };
  };

  const connectExternalWallet = (walletAddress: string, walletProvider: string) => {
    setAddress(walletAddress);
    setProvider(walletProvider);
  };

  const signMessage = async (message: string | Uint8Array) => {
    if (!vaultRef.current.seed.length) {
      throw new Error('Wallet is locked. Unlock or create a wallet to sign messages.');
    }

    return signMessageWithSeedPhrase(vaultRef.current.seed, message);
  };

  const sendTransaction = async (transaction: Transaction, connection: Connection) => {
    if (!vaultRef.current.seed.length) {
      throw new Error('Wallet is locked. Unlock or create a wallet to send transactions.');
    }

    const keypair = await deriveSolanaKeypair(vaultRef.current.seed);
    transaction.partialSign(keypair);
    return connection.sendRawTransaction(transaction.serialize());
  };

  const signTransaction = async <T extends Transaction | VersionedTransaction>(transaction: T) => {
    if (!vaultRef.current.seed.length) {
      throw new Error('Wallet is locked. Unlock or create a wallet to sign transactions.');
    }

    const keypair = await deriveSolanaKeypair(vaultRef.current.seed);
    transaction.sign([keypair]);
    return transaction;
  };

  const signAllTransactions = async <T extends Transaction | VersionedTransaction>(transactions: T[]) =>
    Promise.all(transactions.map((transaction) => signTransaction(transaction)));

  const logout = async () => {
    setAddress('');
    setProvider(undefined);
    vaultRef.current = createEmptyVault();
  };

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      provider,
      hasStoredWallet: hasStoredWalletState,
      generateSeed,
      getSeed,
      setPassword,
      getVaultStatus,
      encryptAndStore,
      unlock,
      importFromSeed,
      importFromKeystore,
      connectExternalWallet,
      signMessage,
      signTransaction,
      signAllTransactions,
      sendTransaction,
      logout
    }),
    [address, hasStoredWalletState, provider]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
