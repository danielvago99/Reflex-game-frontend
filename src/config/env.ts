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
 * 
 * For development:
 * VITE_API_BASE_URL=http://localhost:3000/api
 * VITE_WS_URL=ws://localhost:3000/ws
 * VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
 * VITE_SOLANA_NETWORK=devnet
 */

export const ENV = {
  // Backend API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // WebSocket Configuration
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  
  // Solana Configuration
  SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_NETWORK: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  
  // Platform Configuration
  PLATFORM_FEE_PERCENTAGE: 15, // 15% platform fee
  
  // Feature Flags
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA !== 'false', // Default to mock data until backend is ready
  ENABLE_WEBSOCKET: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
  ENABLE_BLOCKCHAIN: import.meta.env.VITE_ENABLE_BLOCKCHAIN === 'true',
} as const;

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
