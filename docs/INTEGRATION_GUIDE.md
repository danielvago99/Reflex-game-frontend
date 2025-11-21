# Backend Integration Guide

This guide explains how to connect your Web3 Solana Reaction Game to the backend, WebSocket server, and Solana blockchain.

## 📋 Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Backend API Integration](#backend-api-integration)
3. [WebSocket Integration](#websocket-integration)
4. [Solana Web3 Integration](#solana-web3-integration)
5. [Authentication Flow](#authentication-flow)
6. [Game Flow](#game-flow)
7. [Testing](#testing)

---

## 🔧 Setup & Configuration

### 1. Install Dependencies

```bash
# Install Solana Web3
npm install @solana/web3.js

# Optional: Install additional tools
npm install bs58 tweetnacl
```

### 2. Create Environment File

Create `.env` file in project root:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:3000/api
# or production: https://api.your-game.com/api

# WebSocket Server
VITE_WS_URL=ws://localhost:3000/ws
# or production: wss://api.your-game.com/ws

# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet

# Feature Flags
VITE_USE_MOCK_DATA=false
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_BLOCKCHAIN=true
```

### 3. Project Structure

```
/config
  └── env.ts                 # Environment configuration
/types
  └── api.ts                # API type definitions
/utils
  ├── api.ts               # REST API client
  ├── websocket.ts         # WebSocket service
  └── solana.ts            # Solana Web3 utilities
/hooks
  ├── useApi.ts            # API hook
  ├── useWebSocket.ts      # WebSocket hook
  └── useSolana.ts         # Solana hook
```

---

## 🌐 Backend API Integration

### Step 1: Enable Real API Calls

In `/config/env.ts`, set:
```typescript
USE_MOCK_DATA: false
```

### Step 2: Implement API Endpoints

Your backend should implement these endpoints:

#### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-wallet
```

#### User
```
GET  /api/user/profile
PUT  /api/user/profile
GET  /api/user/stats
GET  /api/user/transactions?page=1
```

#### Wallet
```
POST /api/wallet/create
GET  /api/wallet/balance
POST /api/wallet/deposit
POST /api/wallet/withdraw
GET  /api/wallet/transactions?page=1
```

#### Game
```
POST /api/game/lobby/create
POST /api/game/lobby/join
POST /api/game/lobby/{id}/leave
GET  /api/game/lobby/active
POST /api/game/action
GET  /api/game/history?page=1
```

#### Ambassador
```
GET  /api/ambassador/profile
POST /api/ambassador/referral-code
GET  /api/ambassador/referrals?page=1
GET  /api/ambassador/rewards?page=1
GET  /api/ambassador/stats
```

#### Leaderboard
```
GET  /api/leaderboard/top?limit=100
GET  /api/leaderboard/user/rank
```

### Step 3: Use API in Components

Example usage:

```typescript
import { API } from './utils/api';
import { useApi } from './hooks/useApi';

// In component
const { data, loading, error, execute } = useApi(API.user.getProfile);

useEffect(() => {
  execute();
}, []);
```

---

## 🔌 WebSocket Integration

### Step 1: Enable WebSocket

In `/config/env.ts`, set:
```typescript
ENABLE_WEBSOCKET: true
```

### Step 2: Backend WebSocket Server

Your WebSocket server should handle these message types:

#### Client → Server
```typescript
// Join lobby
{ type: 'lobby:join', payload: { lobbyId: string } }

// Ready for game
{ type: 'game:ready', payload: { sessionId: string } }

// Player clicked
{ type: 'game:click', payload: { sessionId: string, timestamp: number } }
```

#### Server → Client
```typescript
// Lobby updates
{ type: 'lobby:update', payload: { lobby: GameLobby } }
{ type: 'lobby:player_joined', payload: { player: GamePlayer } }
{ type: 'lobby:player_left', payload: { playerId: string } }

// Game events
{ type: 'game:start', payload: { sessionId: string, players: GamePlayer[] } }
{ type: 'game:countdown', payload: { count: number } }
{ type: 'game:show_button', payload: { showTime: number } }
{ type: 'game:player_clicked', payload: { userId: string, reactionTime: number } }
{ type: 'game:result', payload: { result: GameResult } }
{ type: 'game:end', payload: { sessionId: string } }
```

### Step 3: Use WebSocket in Components

Example usage:

```typescript
import { useWebSocket, useGameEvents } from './hooks/useWebSocket';

function GameArena() {
  const { isConnected, connect, send } = useWebSocket({ autoConnect: true });

  useGameEvents({
    onStart: (data) => {
      console.log('Game started:', data);
    },
    onCountdown: (data) => {
      console.log('Countdown:', data.count);
    },
    onShowButton: (data) => {
      console.log('Show button!');
    },
    onResult: (data) => {
      console.log('Game result:', data);
    },
  });

  const handleClick = () => {
    send('game:click', {
      sessionId: 'xxx',
      timestamp: Date.now(),
    });
  };

  return <div>...</div>;
}
```

---

## ⛓️ Solana Web3 Integration

### Step 1: Uncomment Solana Code

In `/utils/solana.ts`:

1. Uncomment the import statement:
```typescript
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';
```

2. Uncomment real implementations in each method
3. Enable blockchain: `VITE_ENABLE_BLOCKCHAIN=true`

### Step 2: Wallet Generation

The app generates wallets like this:

```typescript
const { generateWallet } = useSolana();

const newWallet = await generateWallet();
// { publicKey: string, secretKey: Uint8Array }
```

### Step 3: Transaction Flow

```typescript
const { sendSol, loading, error } = useSolana();

// Send SOL
const signature = await sendSol(
  fromKeypair,
  toAddress,
  amount
);
```

### Step 4: Balance Checking

```typescript
import { useWalletBalance } from './hooks/useSolana';

const { balance, loading, refresh } = useWalletBalance(
  walletAddress,
  30000 // Refresh every 30s
);
```

---

## 🔐 Authentication Flow

### Complete Flow:

```
1. User clicks "Create Wallet"
   ↓
2. Frontend generates Solana keypair
   ↓
3. User sets password
   ↓
4. Frontend encrypts seed phrase with password
   ↓
5. Send to backend: POST /api/wallet/create
   {
     username: string,
     encryptedSeed: string,
     publicKey: string
   }
   ↓
6. Backend stores encrypted seed + generates JWT
   ↓
7. Frontend stores JWT token
   ↓
8. User navigates to Dashboard
```

### Unlock Wallet Flow:

```
1. User enters password or uses biometric
   ↓
2. Frontend decrypts local seed OR
   Backend verifies password + returns encrypted seed
   ↓
3. Frontend derives keypair from seed
   ↓
4. Sign authentication message
   ↓
5. Send to backend: POST /api/auth/login
   {
     walletAddress: string,
     signature: string,
     message: string
   }
   ↓
6. Backend verifies signature
   ↓
7. Returns JWT token
   ↓
8. User authenticated
```

---

## 🎮 Game Flow

### Complete Game Flow:

```
1. Player creates/joins lobby
   → POST /api/game/lobby/create or /join
   ↓
2. WebSocket connects
   → ws.send({ type: 'lobby:join', payload: { lobbyId } })
   ↓
3. Wait for opponent
   → Receive: { type: 'lobby:player_joined' }
   ↓
4. Both players ready
   → ws.send({ type: 'game:ready' })
   ↓
5. Game starts
   → Receive: { type: 'game:start' }
   ↓
6. Countdown: 3, 2, 1
   → Receive: { type: 'game:countdown', payload: { count } }
   ↓
7. Button appears (random delay)
   → Receive: { type: 'game:show_button' }
   ↓
8. Player clicks
   → ws.send({ type: 'game:click', payload: { timestamp } })
   ↓
9. Backend calculates winner
   ↓
10. Result sent
    → Receive: { type: 'game:result', payload: { result } }
    ↓
11. Backend processes payment:
    - Deduct stake from loser
    - Calculate platform fee (15%)
    - Transfer winnings to winner
    - Process referral rewards
    ↓
12. Frontend shows results
    ↓
13. Update balances
```

---

## 🧪 Testing

### Test with Mock Data (Default)

```env
VITE_USE_MOCK_DATA=true
VITE_ENABLE_WEBSOCKET=false
VITE_ENABLE_BLOCKCHAIN=false
```

### Test with Backend Only

```env
VITE_USE_MOCK_DATA=false
VITE_ENABLE_WEBSOCKET=false
VITE_ENABLE_BLOCKCHAIN=false
```

### Test with Backend + WebSocket

```env
VITE_USE_MOCK_DATA=false
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_BLOCKCHAIN=false
```

### Full Integration

```env
VITE_USE_MOCK_DATA=false
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_BLOCKCHAIN=true
```

---

## 📝 Backend Requirements Checklist

### Security
- [ ] Implement JWT authentication
- [ ] Encrypt seed phrases with user passwords
- [ ] Validate all wallet signatures
- [ ] Rate limiting on API endpoints
- [ ] CORS configuration
- [ ] Input validation and sanitization

### Database Schema
- [ ] Users table (id, username, wallet_address, encrypted_seed, created_at)
- [ ] Wallets table (address, balance, user_id)
- [ ] Games table (id, stake, status, winner_id, created_at)
- [ ] Game_players table (game_id, user_id, reaction_time, position)
- [ ] Transactions table (id, type, amount, tx_hash, status, created_at)
- [ ] Ambassador_profiles table (user_id, referral_code, tier, total_referrals)
- [ ] Referrals table (referrer_id, referred_user_id, status, created_at)
- [ ] Referral_rewards table (referrer_id, game_id, points, amount, created_at)

### Business Logic
- [ ] Platform fee calculation (15%)
- [ ] Ambassador tier progression (Bronze → Silver → Gold)
- [ ] Referral reward distribution (90/100/110 points)
- [ ] Game result validation
- [ ] Balance management
- [ ] Leaderboard calculation

### WebSocket
- [ ] Connection authentication
- [ ] Room/lobby management
- [ ] Broadcast to specific users
- [ ] Heartbeat/ping-pong
- [ ] Reconnection handling

### Solana Integration
- [ ] Hot wallet for platform fees
- [ ] Transaction monitoring
- [ ] Confirmation waiting
- [ ] Error handling for failed transactions
- [ ] Gas fee estimation

---

## 🚀 Deployment

### Environment Variables (Production)

```env
VITE_API_BASE_URL=https://api.your-game.com/api
VITE_WS_URL=wss://api.your-game.com/ws
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_NETWORK=mainnet-beta
VITE_USE_MOCK_DATA=false
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_BLOCKCHAIN=true
```

### Build

```bash
npm run build
```

---

## 📚 Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [JWT Authentication](https://jwt.io/)

---

## ❓ Troubleshooting

### API not connecting?
- Check `VITE_API_BASE_URL` is correct
- Verify backend is running
- Check CORS configuration
- Look at browser console for errors

### WebSocket not connecting?
- Check `VITE_WS_URL` is correct
- Verify WebSocket server is running
- Check if behind proxy/firewall
- Enable `VITE_ENABLE_WEBSOCKET=true`

### Solana transactions failing?
- Verify RPC endpoint is correct
- Check wallet has sufficient balance
- Ensure network matches (devnet/mainnet)
- Enable `VITE_ENABLE_BLOCKCHAIN=true`

---

## 📞 Support

For integration help, check:
1. Browser console errors
2. Network tab in DevTools
3. Backend logs
4. This integration guide

Good luck with your integration! 🎮⚡
