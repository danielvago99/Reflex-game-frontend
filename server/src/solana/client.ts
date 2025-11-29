import { Connection, clusterApiUrl } from '@solana/web3.js';
import { env } from '../config/env';

export const solanaConnection = new Connection(
  env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
  'confirmed',
);
