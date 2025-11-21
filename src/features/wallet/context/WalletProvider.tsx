import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
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
  type EncryptedWalletRecord
} from '../../../utils/walletCrypto';
import { biometricsUtils } from '../../../utils/biometrics';

interface WalletContextValue {
  address: string;
  provider?: string;
  biometric: boolean;
  hasStoredWallet: boolean;
  status: 'loading' | 'onboarding' | 'locked' | 'unlocked';
  generateSeed: () => string[];
  getSeed: () => string[];
  setPassword: (password: string, biometric: boolean) => void;
  getVaultStatus: () => { hasSeed: boolean; hasPassword: boolean; biometricEnabled: boolean };
  encryptAndStore: () => Promise<EncryptedWalletRecord>;
  unlock: (password: string) => Promise<string[]>;
  importFromSeed: (seedPhrase: string[], password: string, biometric?: boolean) => Promise<EncryptedWalletRecord>;
  importFromKeystore: (record: EncryptedWalletRecord, password: string) => Promise<string[]>;
  connectExternalWallet: (address: string, provider: string) => void;
  lock: () => void;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const createEmptyVault = () => ({ seed: [] as string[], password: '', biometric: false });
const VAULT_CLEAR_DELAY_MS = 5000;
const IDLE_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  const [biometric, setBiometric] = useState(false);
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [hasStoredWalletState, setHasStoredWallet] = useState(false);
  const [status, setStatus] = useState<WalletContextValue['status']>('loading');
  const vaultRef = useRef(createEmptyVault());
  const vaultClearTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const clearVaultRef = useCallback(() => {
    vaultRef.current = createEmptyVault();
  }, []);

  const scheduleVaultClear = useCallback(
    (delayMs: number = 0) => {
      if (vaultClearTimerRef.current) {
        clearTimeout(vaultClearTimerRef.current);
      }
      vaultClearTimerRef.current = window.setTimeout(() => {
        clearVaultRef();
        vaultClearTimerRef.current = null;
      }, delayMs);
    },
    [clearVaultRef]
  );

  const lock = useCallback(() => {
    clearVaultRef();
    setAddress('');
    setProvider(undefined);
    setBiometric(false);
    setStatus(prev => (prev === 'loading' ? prev : hasStoredWalletState ? 'locked' : 'onboarding'));
  }, [clearVaultRef, hasStoredWalletState]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (status !== 'unlocked') return;

    idleTimerRef.current = window.setTimeout(() => {
      lock();
    }, IDLE_LOCK_TIMEOUT_MS);
  }, [lock, status]);

  useEffect(() => {
    let isMounted = true;
    hasWallet()
      .then(hasStored => {
        if (!isMounted) return;
        setHasStoredWallet(hasStored);
        setStatus(hasStored ? 'locked' : 'onboarding');
      })
      .catch(() => {
        if (!isMounted) return;
        setHasStoredWallet(false);
        setStatus('onboarding');
      });

    const handleVisibility = () => {
      if (document.hidden) {
        lock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      if (vaultClearTimerRef.current) {
        clearTimeout(vaultClearTimerRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      clearVaultRef();
    };
  }, [clearVaultRef, lock]);

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    resetIdleTimer();
  }, [status, resetIdleTimer]);

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
    scheduleVaultClear();
    setStatus('unlocked');
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
      setStatus('unlocked');
      scheduleVaultClear(VAULT_CLEAR_DELAY_MS);
      return seed;
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
    scheduleVaultClear();
    setStatus('unlocked');
    return seed;
  };

  const connectExternalWallet = (walletAddress: string, walletProvider: string) => {
    setAddress(walletAddress);
    setProvider(walletProvider);
    setStatus('unlocked');
  };

  const logout = async () => {
    lock();
    setStatus('onboarding');
  };

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      provider,
      biometric,
      hasStoredWallet: hasStoredWalletState,
      status,
      generateSeed,
      getSeed,
      setPassword,
      getVaultStatus,
      encryptAndStore,
      unlock,
      importFromSeed,
      importFromKeystore,
      connectExternalWallet,
      lock,
      logout
    }),
    [address, biometric, hasStoredWalletState, lock, provider, status]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
