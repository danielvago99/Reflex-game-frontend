import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWallet } from '../../wallet/context/WalletProvider';
import { wsService } from '../../../utils/websocket';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

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
  loginWithInAppWallet: (walletAddress?: string) => Promise<void>;
  loginWithExternalWallet: (params: {
    address: string;
    signMessage: (message: string) => Promise<Uint8Array>;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (updates: { username?: string; avatar?: string }) => Promise<void>;
}

const AuthContext = createContext<UseAuthResult | undefined>(undefined);

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

const getStoredToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);

const buildAuthHeaders = () => {
  const token = getStoredToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

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

async function submitLogin(body: {
  address: string;
  signature: string;
  nonce: string;
  referralCode?: string;
}) {
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

  const data = (await response.json()) as { user: AuthUser; token: string };
  return data;
}

function buildSuggestedUsername(walletAddress: string) {
  const prefix = walletAddress.slice(0, 4);
  const suffix = walletAddress.slice(-4);
  return `Player_${prefix}${suffix}`;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { address, signMessage } = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionVersionRef = useRef(0);

  const refresh = useCallback(async () => {
    const refreshVersion = sessionVersionRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...buildAuthHeaders(),
        },
      });

      if (response.status === 401) {
        if (refreshVersion === sessionVersionRef.current) {
          setUser(null);
        }
        localStorage.removeItem('auth_token');
        return;
      }

      if (!response.ok) {
        if (refreshVersion === sessionVersionRef.current) {
          setError('Failed to load session');
        }
        return;
      }

      const data = (await response.json()) as { user: AuthUser };
      if (refreshVersion === sessionVersionRef.current) {
        setUser(data.user);
      }
    } catch (err) {
      if (refreshVersion === sessionVersionRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to verify session');
      }
    } finally {
      if (refreshVersion === sessionVersionRef.current) {
        setLoading(false);
      }
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
        const storedReferralCode = localStorage.getItem('referralCode');
        const loginResponse = await submitLogin({
          address: walletAddress,
          signature,
          nonce: nonceResponse.nonce,
          referralCode: storedReferralCode || undefined,
        });

        if (storedReferralCode) {
          localStorage.removeItem('referralCode');
        }

        localStorage.setItem('auth_token', loginResponse.token);

        sessionVersionRef.current += 1;
        let nextUser = loginResponse.user;

        if (!nextUser.username?.trim()) {
          const suggestedUsername = buildSuggestedUsername(walletAddress);
          const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
            credentials: 'include',
            body: JSON.stringify({ username: suggestedUsername }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to set username');
          }

          const data = (await response.json()) as { user: AuthUser };
          nextUser = data.user;
        }

        setUser(nextUser);
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

  const loginWithInAppWallet = useCallback(async (walletAddress?: string) => {
    const activeAddress = walletAddress ?? address;

    if (!activeAddress) {
      throw new Error('Create or unlock your in-app wallet before logging in.');
    }

    if (!signMessage) {
      throw new Error('Wallet is not ready to sign messages.');
    }

    await performLogin(activeAddress, signMessage);
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
        headers: {
          ...buildAuthHeaders(),
        },
      });
    } finally {
      wsService.disconnect();
      localStorage.removeItem('auth_token');
      sessionVersionRef.current += 1;
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (updates: { username?: string; avatar?: string }) => {
    if (!updates.username && !updates.avatar) return;

    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        sessionVersionRef.current += 1;
        setUser(null);
        setError('Session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }

      const data = (await response.json()) as { user: AuthUser };
      setUser((prev) => ({ ...prev, ...data.user }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update profile';
      setError(message);
      throw err;
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
    updateProfile,
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
