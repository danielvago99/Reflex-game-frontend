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
  updateWalletRecord,
  validateSeedPhrase,
  signMessageWithSeedPhrase,
  type EncryptedWalletRecord
} from '../../../utils/walletCrypto';
import { biometricsUtils } from '../../../utils/biometrics';

interface WalletContextValue {
  address: string;
  provider?: string;
  biometric: boolean;
  hasStoredWallet: boolean;
  generateSeed: () => string[];
  getSeed: () => string[];
  setPassword: (password: string, biometric: boolean) => void;
  getVaultStatus: () => { hasSeed: boolean; hasPassword: boolean; biometricEnabled: boolean };
  encryptAndStore: () => Promise<EncryptedWalletRecord>;
  unlock: (password: string) => Promise<{ seed: string[]; publicKey: string }>;
  importFromSeed: (seedPhrase: string[], password: string, biometric?: boolean) => Promise<EncryptedWalletRecord>;
  importFromKeystore: (record: EncryptedWalletRecord, password: string) => Promise<{ seed: string[]; publicKey: string }>;
  connectExternalWallet: (address: string, provider: string) => void;
  signMessage: (message: string | Uint8Array) => Promise<Uint8Array>;
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
    vaultRef.current = createEmptyVault();
    vaultRef.current.seed = seed;
    return seed;
  };

  const getSeed = () => [...vaultRef.current.seed];

  const setPassword = (password: string, biometricEnabled: boolean) => {
    vaultRef.current.password = password;
    vaultRef.current.biometric = biometricEnabled;
  };

  const getVaultStatus = () => ({
    hasSeed: vaultRef.current.seed.length > 0,
    hasPassword: Boolean(vaultRef.current.password),
    biometricEnabled: vaultRef.current.biometric
  });

  const persistVaultToStorage = async (seedPhrase: string[], password: string, biometricEnabled: boolean) => {
    const encrypted = await encryptSeedPhrase(seedPhrase, password);
    const keypair = await deriveSolanaKeypair(seedPhrase);
    let record: EncryptedWalletRecord = {
      ...encrypted,
      publicKey: keypair.publicKey.toBase58(),
      createdAt: encrypted.createdAt,
      version: '2.0',
      biometricEnabled: biometricEnabled || undefined
    };

    await storeEncryptedWallet(record);

    if (biometricEnabled) {
      try {
        const available = await biometricsUtils.isBiometricAvailable();
        if (available) {
          const credentialId = await biometricsUtils.registerBiometricCredential(record.publicKey);
          record = await updateWalletRecord({ biometricCredentialId: credentialId, biometricEnabled: true });
        } else {
          record = await updateWalletRecord({ biometricEnabled: false, biometricCredentialId: undefined });
        }
      } catch (error) {
        console.error('Biometric registration failed', error);
        record = await updateWalletRecord({ biometricEnabled: false, biometricCredentialId: undefined });
      }
    }

    await resetUnlockAttempts();
    setAddress(record.publicKey);
    setBiometric(Boolean(record.biometricEnabled && record.biometricCredentialId));
    setHasStoredWallet(true);
    vaultRef.current = { seed: seedPhrase, password: '', biometric: biometricEnabled };
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

    return persistVaultToStorage(vaultRef.current.seed, vaultRef.current.password, vaultRef.current.biometric);
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
      setBiometric(Boolean(record.biometricEnabled && record.biometricCredentialId));
      return { seed, publicKey };
    } catch (error) {
      const next = await incrementUnlockAttempts();
      if (isUnlockBlocked(next)) {
        throw new Error('Too many unlock attempts');
      }
      throw error instanceof Error ? error : new Error('Unable to unlock wallet');
    }
  };

  const importFromSeed = async (seedPhrase: string[], password: string, biometricEnabled = false) => {
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error('Invalid seed phrase');
    }

    vaultRef.current.seed = seedPhrase;
    vaultRef.current.password = password;
    vaultRef.current.biometric = biometricEnabled;
    return persistVaultToStorage(seedPhrase, password, biometricEnabled);
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
    setBiometric(Boolean(normalized.biometricEnabled && normalized.biometricCredentialId));
    setHasStoredWallet(true);
    vaultRef.current = { seed, password: '', biometric: Boolean(normalized.biometricEnabled) };
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
      getVaultStatus,
      encryptAndStore,
      unlock,
      importFromSeed,
      importFromKeystore,
      connectExternalWallet,
      signMessage,
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
