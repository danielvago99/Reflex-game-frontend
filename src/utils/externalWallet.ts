type ExternalWalletProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toBase58?: () => string } | string;
  connect?: () => Promise<{ publicKey?: { toBase58?: () => string } | string }>;
  signMessage?: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array } | Uint8Array>;
};

type ExternalWalletConnection = {
  address: string;
  provider: string;
  signMessage: (message: string) => Promise<Uint8Array>;
};

const resolveAddress = (publicKey?: { toBase58?: () => string } | string) => {
  if (!publicKey) return '';
  if (typeof publicKey === 'string') return publicKey;
  if (typeof publicKey.toBase58 === 'function') return publicKey.toBase58();
  return '';
};

const getProvider = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const phantom = (window as any).phantom?.solana as ExternalWalletProvider | undefined;
  if (phantom?.isPhantom) {
    return { provider: phantom, name: 'Phantom' };
  }

  const solflare = (window as any).solflare as ExternalWalletProvider | undefined;
  if (solflare) {
    return { provider: solflare, name: 'Solflare' };
  }

  return null;
};

export const connectToExternalWallet = async (): Promise<ExternalWalletConnection> => {
  const resolved = getProvider();
  if (!resolved) {
    throw new Error('No compatible wallet provider detected. Install Phantom or Solflare to continue.');
  }

  const { provider, name } = resolved;

  if (!provider.connect) {
    throw new Error(`${name} wallet is unavailable for connection.`);
  }

  const response = await provider.connect();
  const address = resolveAddress(provider.publicKey) || resolveAddress(response?.publicKey);

  if (!address) {
    throw new Error('Unable to read wallet address from provider.');
  }

  const signMessage = async (message: string) => {
    if (!provider.signMessage) {
      throw new Error('Wallet provider does not support message signing.');
    }

    const encoded = new TextEncoder().encode(message);
    const result = await provider.signMessage(encoded, 'utf8');

    if (result instanceof Uint8Array) {
      return result;
    }

    if ('signature' in result && result.signature instanceof Uint8Array) {
      return result.signature;
    }

    throw new Error('Wallet did not return a valid signature.');
  };

  return { address, provider: name, signMessage };
};
