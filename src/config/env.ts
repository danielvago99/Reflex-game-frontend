/**
 * Environment Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a .env file in your project root
 * 2. Add the following variables:
 * 
 * VITE_API_BASE_URL=https://your-backend-api.com/api
 * VITE_WS_URL=wss://your-backend-api.com/ws
 * VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
 * VITE_SOLANA_NETWORK=mainnet-beta
 * VITE_HELIUS_API_KEY=your-helius-api-key
 * VITE_HELIUS_RPC_URL=https://rpc.helius.xyz/?api-key=your-helius-api-key
 * 
 * For development:
 * VITE_API_BASE_URL=http://localhost:3000/api
 * VITE_WS_URL=ws://localhost:3000/ws
 * VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
 * VITE_SOLANA_NETWORK=devnet
 * VITE_HELIUS_API_KEY=your-helius-api-key
 * VITE_HELIUS_RPC_URL=https://rpc-devnet.helius.xyz/?api-key=your-helius-api-key
 */

const isFlagEnabled = (value: string | undefined, defaultValue: boolean) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
};

const env = import.meta.env as Record<string, string | undefined>;

const resolveSolanaRpcUrl = () =>
  env.VITE_SOLANA_RPC_URL || env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

const resolveSolanaNetwork = (rpcUrl: string) => {
  if (env.VITE_SOLANA_NETWORK) return env.VITE_SOLANA_NETWORK;
  if (env.SOLANA_NETWORK) return env.SOLANA_NETWORK;
  if (rpcUrl.includes('mainnet')) return 'mainnet-beta';
  if (rpcUrl.includes('testnet')) return 'testnet';
  return 'devnet';
};

const solanaRpcUrl = resolveSolanaRpcUrl();
const solanaNetwork = resolveSolanaNetwork(solanaRpcUrl);

const resolveHeliusRpcUrl = (network: string) => {
  const directUrl = env.VITE_HELIUS_RPC_URL || env.HELIUS_RPC_URL;
  if (directUrl) return directUrl;

  const apiKey = env.VITE_HELIUS_API_KEY || env.HELIUS_API_KEY;
  if (!apiKey) return '';

  const baseUrl = network === 'devnet' ? 'https://rpc-devnet.helius.xyz' : 'https://rpc.helius.xyz';
  return `${baseUrl}/?api-key=${apiKey}`;
};

const heliusRpcUrl = resolveHeliusRpcUrl(solanaNetwork);

export const ENV = {
  // Backend API Configuration
  API_BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api',

  // WebSocket Configuration
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',

  // Solana Configuration
  SOLANA_RPC_URL: solanaRpcUrl,
  SOLANA_NETWORK: solanaNetwork,
  HELIUS_RPC_URL: heliusRpcUrl,

  // Platform Configuration
  PLATFORM_FEE_PERCENTAGE: 15, // 15% platform fee

  // Feature Flags
  // Default to real data + enabled websockets unless explicitly overridden
  USE_MOCK_DATA: isFlagEnabled(import.meta.env.VITE_USE_MOCK_DATA, false),
  ENABLE_WEBSOCKET: isFlagEnabled(import.meta.env.VITE_ENABLE_WEBSOCKET, true),
  ENABLE_BLOCKCHAIN: isFlagEnabled(import.meta.env.VITE_ENABLE_BLOCKCHAIN, true),
} as const;

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
