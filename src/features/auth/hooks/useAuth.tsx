import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet } from '../../wallet/context/WalletProvider';

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== ''
    ? import.meta.env.VITE_BACKEND_URL
    : window.location.origin;

export interface AuthUser {
  id: string;
  walletAddress: string;
  username?: string | null;
  avatar?: string | null;
}

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  loginWithInAppWallet: () => Promise<void>;
  loginWithExternalWallet: (params: {
    address: string;
    signMessage: (message: string) => Promise<Uint8Array>;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<UseAuthResult | undefined>(undefined);

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

async function fetchNonce(address: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/nonce?address=${encodeURIComponent(address)}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch login nonce');
  }

  return (await response.json()) as { address: string; nonce: string; message: string };
}

async function submitLogin(body: { address: string; signature: string; nonce: string }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }

  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { address, signMessage } = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setUser(null);
        return;
      }

      if (!response.ok) {
        setError('Failed to load session');
        return;
      }

      const data = (await response.json()) as { user: AuthUser };
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify session');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const performLogin = useCallback(
    async (walletAddress: string, signer: (message: string) => Promise<Uint8Array>) => {
      setLoading(true);
      setError(null);
      try {
        const nonceResponse = await fetchNonce(walletAddress);
        const signatureBytes = await signer(nonceResponse.message);
        const signature = toBase64(new Uint8Array(signatureBytes));
        const loggedInUser = await submitLogin({
          address: walletAddress,
          signature,
          nonce: nonceResponse.nonce,
        });

        setUser(loggedInUser);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loginWithInAppWallet = useCallback(async () => {
    if (!address) {
      throw new Error('Create or unlock your in-app wallet before logging in.');
    }

    if (!signMessage) {
      throw new Error('Wallet is not ready to sign messages.');
    }

    await performLogin(address, signMessage);
  }, [address, performLogin, signMessage]);

  const loginWithExternalWallet = useCallback(
    async ({ address: externalAddress, signMessage: externalSignMessage }) => {
      if (!externalAddress) {
        throw new Error('Wallet address is required');
      }

      await performLogin(externalAddress, externalSignMessage);
    },
    [performLogin],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value: UseAuthResult = {
    user,
    loading,
    error,
    loginWithInAppWallet,
    loginWithExternalWallet,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): UseAuthResult {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuthContext as useAuth };
