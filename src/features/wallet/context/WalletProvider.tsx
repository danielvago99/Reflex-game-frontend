import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  type EncryptedWalletRecord
} from '../../../utils/walletCrypto';

interface WalletContextValue {
  address: string;
  provider?: string;
  biometric: boolean;
  hasStoredWallet: boolean;
  generateSeed: () => string[];
  getSeed: () => string[];
  setPassword: (password: string, biometric: boolean) => void;
  encryptAndStore: () => Promise<EncryptedWalletRecord>;
  unlock: (password: string) => Promise<string[]>;
  connectExternalWallet: (address: string, provider: string) => void;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const createEmptyVault = () => ({ seed: [] as string[], password: '', biometric: false });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  const [biometric, setBiometric] = useState(false);
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
    vaultRef.current.seed = seed;
    return seed;
  };

  const getSeed = () => [...vaultRef.current.seed];

  const setPassword = (password: string, biometricEnabled: boolean) => {
    vaultRef.current.password = password;
    vaultRef.current.biometric = biometricEnabled;
  };

  const encryptAndStore = async () => {
    if (!vaultRef.current.seed.length || !vaultRef.current.password) {
      throw new Error('Wallet vault is empty');
    }

    const encrypted = await encryptSeedPhrase(vaultRef.current.seed, vaultRef.current.password);
    const keypair = await deriveSolanaKeypair(vaultRef.current.seed);
    const record: EncryptedWalletRecord = {
      ...encrypted,
      publicKey: keypair.publicKey.toBase58(),
      createdAt: encrypted.createdAt,
      version: '2.0'
    };

    await storeEncryptedWallet(record);
    await resetUnlockAttempts();
    setAddress(record.publicKey);
    setBiometric(vaultRef.current.biometric);
    setHasStoredWallet(true);
    vaultRef.current = createEmptyVault();
    return record;
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
      setBiometric(record.version === '2.0' ? biometric : false);
      return seed;
    } catch (error) {
      const next = await incrementUnlockAttempts();
      if (isUnlockBlocked(next)) {
        throw new Error('Too many unlock attempts');
      }
      throw error instanceof Error ? error : new Error('Unable to unlock wallet');
    }
  };

  const connectExternalWallet = (walletAddress: string, walletProvider: string) => {
    setAddress(walletAddress);
    setProvider(walletProvider);
  };

  const logout = async () => {
    setAddress('');
    setProvider(undefined);
    setBiometric(false);
    vaultRef.current = createEmptyVault();
  };

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      provider,
      biometric,
      hasStoredWallet: hasStoredWalletState,
      generateSeed,
      getSeed,
      setPassword,
      encryptAndStore,
      unlock,
      connectExternalWallet,
      logout
    }),
    [address, biometric, hasStoredWalletState, provider]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
