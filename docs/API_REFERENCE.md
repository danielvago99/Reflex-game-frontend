# API Reference

Quick reference for all API utilities, hooks, and services.

---

## 📡 API Client (`/utils/api.ts`)

### Configuration

```typescript
import { apiClient, API } from './utils/api';

// Set authentication token
apiClient.setToken('your-jwt-token');

// Clear token
apiClient.clearToken();
```

### Authentication

```typescript
// Login
await API.auth.login({ walletAddress, signature, message });

// Logout
await API.auth.logout();

// Refresh token
await API.auth.refresh();

// Verify wallet
await API.auth.verifyWallet({ walletAddress, signature });
```

### User

```typescript
// Get profile
await API.user.getProfile();

// Update profile
await API.user.updateProfile({ username: 'NewName' });

// Get stats
await API.user.getStats();

// Get transactions
await API.user.getTransactions(page);
```

### Wallet

```typescript
// Create wallet
await API.wallet.create({ username, encryptedSeed, password });

// Get balance
await API.wallet.getBalance();

// Deposit
await API.wallet.deposit({ amount, txHash });

// Withdraw
await API.wallet.withdraw({ amount, toAddress });

// Get transactions
await API.wallet.getTransactions(page);
```

### Game

```typescript
// Create lobby
await API.game.createLobby({ mode: 'random', stake: 0.1 });

// Join lobby
await API.game.joinLobby({ lobbyId: 'xxx' });

// Leave lobby
await API.game.leaveLobby('lobby-id');

// Get active lobby
await API.game.getActiveLobby();

// Submit action
await API.game.submitAction({ sessionId, action: 'ready' });

// Get history
await API.game.getHistory(page);
```

### Ambassador

```typescript
// Get profile
await API.ambassador.getProfile();

// Create referral code
await API.ambassador.createReferralCode({ customCode: 'MYCODE' });

// Get referrals
await API.ambassador.getReferrals(page);

// Get rewards
await API.ambassador.getRewards(page);

// Get stats
await API.ambassador.getStats();
```

### Leaderboard

```typescript
// Get top players
await API.leaderboard.getTop(100);

// Get user rank
await API.leaderboard.getUserRank();
```

---

## 🔌 WebSocket Service (`/utils/websocket.ts`)

### Connection

```typescript
import { wsService } from './utils/websocket';

// Connect
await wsService.connect(token);

// Disconnect
wsService.disconnect();

// Check connection
const isConnected = wsService.isConnected();
```

### Sending Messages

```typescript
// Send message
wsService.send('game:ready', { sessionId: 'xxx' });

// Send click
wsService.send('game:click', { 
  sessionId: 'xxx',
  timestamp: Date.now() 
});
```

### Subscribing to Events

```typescript
// Subscribe to event
const unsubscribe = wsService.on('game:start', (message) => {
  console.log('Game started:', message.payload);
});

// Unsubscribe
unsubscribe();
```

### Event Listeners

```typescript
// On connection open
wsService.onOpen(() => {
  console.log('Connected!');
});

// On connection close
wsService.onClose(() => {
  console.log('Disconnected!');
});

// On error
wsService.onError((error) => {
  console.error('WebSocket error:', error);
});
```

---

## ⛓️ Solana Service (`/utils/solana.ts`)

### Wallet Operations

```typescript
import { Solana } from './utils/solana';

// Generate new wallet
const wallet = await Solana.generateWallet();
// { publicKey: string, secretKey: Uint8Array }

// Get balance
const balance = await Solana.getBalance('wallet-address');

// Validate address
const isValid = Solana.isValidAddress('address');
```

### Transactions

```typescript
// Send SOL
const signature = await Solana.sendSol(
  fromKeypair,    // { publicKey, secretKey }
  toAddress,      // string
  amount          // number (SOL)
);
```

### Signing & Verification

```typescript
// Sign message
const signature = await Solana.signMessage(
  'message to sign',
  keypair
);

// Verify signature
const isValid = await Solana.verifySignature(
  'message',
  'signature',
  'publicKey'
);
```

### Conversion

```typescript
// SOL to lamports
const lamports = Solana.solToLamports(1.5); // 1500000000

// Lamports to SOL
const sol = Solana.lamportsToSol(1500000000); // 1.5
```

### Network Info

```typescript
// Get current network
const network = Solana.getNetwork(); // 'devnet' or 'mainnet-beta'

// Get RPC URL
const rpcUrl = Solana.getRpcUrl();
```

---

## 🪝 React Hooks

### useApi Hook (`/hooks/useApi.ts`)

```typescript
import { useApi } from './hooks/useApi';
import { API } from './utils/api';

function Component() {
  const { data, loading, error, execute, reset } = useApi(
    API.user.getProfile,
    {
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.error('Error:', error),
    }
  );

  useEffect(() => {
    execute();
  }, []);

  return <div>{loading ? 'Loading...' : data?.username}</div>;
}
```

### useWebSocket Hook (`/hooks/useWebSocket.ts`)

```typescript
import { useWebSocket } from './hooks/useWebSocket';

function Component() {
  const { isConnected, error, connect, disconnect, send } = useWebSocket({
    autoConnect: true,
    token: 'jwt-token',
  });

  const handleSend = () => {
    send('game:ready', { sessionId: 'xxx' });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### useWebSocketEvent Hook

```typescript
import { useWebSocketEvent } from './hooks/useWebSocket';

function Component() {
  useWebSocketEvent('game:start', (payload) => {
    console.log('Game started:', payload);
  });

  return <div>Game Component</div>;
}
```

### useGameEvents Hook

```typescript
import { useGameEvents } from './hooks/useWebSocket';

function Component() {
  useGameEvents({
    onStart: (data) => console.log('Start:', data),
    onCountdown: (data) => console.log('Countdown:', data.count),
    onShowButton: (data) => console.log('Show button!'),
    onResult: (data) => console.log('Result:', data),
  });

  return <div>Game Arena</div>;
}
```

### useLobbyEvents Hook

```typescript
import { useLobbyEvents } from './hooks/useWebSocket';

function Component() {
  useLobbyEvents({
    onUpdate: (data) => console.log('Lobby updated:', data),
    onPlayerJoined: (data) => console.log('Player joined:', data),
    onPlayerLeft: (data) => console.log('Player left:', data),
  });

  return <div>Lobby</div>;
}
```

### useSolana Hook (`/hooks/useSolana.ts`)

```typescript
import { useSolana } from './hooks/useSolana';

function Component() {
  const {
    loading,
    error,
    generateWallet,
    getBalance,
    sendSol,
    signMessage,
    verifySignature,
    isValidAddress,
  } = useSolana();

  const handleGenerate = async () => {
    const wallet = await generateWallet();
    console.log('New wallet:', wallet?.publicKey);
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        Generate Wallet
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### useWalletBalance Hook

```typescript
import { useWalletBalance } from './hooks/useSolana';

function Component({ address }: { address: string }) {
  const { balance, loading, error, refresh } = useWalletBalance(
    address,
    30000 // Refresh every 30 seconds
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {balance !== null && (
        <div>
          <p>{balance.toFixed(4)} SOL</p>
          <button onClick={refresh}>Refresh</button>
        </div>
      )}
    </div>
  );
}
```

---

## 🔐 Environment Variables

All environment variables are accessed through `/config/env.ts`:

```typescript
import { ENV } from './config/env';

// Backend API URL
ENV.API_BASE_URL

// WebSocket URL
ENV.WS_URL

// Solana RPC URL
ENV.SOLANA_RPC_URL

// Solana Network
ENV.SOLANA_NETWORK

// Platform fee percentage
ENV.PLATFORM_FEE_PERCENTAGE

// Feature flags
ENV.USE_MOCK_DATA
ENV.ENABLE_WEBSOCKET
ENV.ENABLE_BLOCKCHAIN
```

---

## 📦 Type Definitions

All TypeScript types are in `/types/api.ts`:

```typescript
import type {
  User,
  Wallet,
  GameLobby,
  GameSession,
  GamePlayer,
  GameResult,
  AmbassadorProfile,
  Referral,
  PlayerStats,
  LeaderboardEntry,
  ApiResponse,
  WSMessage,
  WSMessageType,
} from './types/api';
```

---

## 🎯 Common Patterns

### API Call with Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    const response = await API.user.getProfile();
    if (response.success) {
      console.log(response.data);
    }
  } finally {
    setLoading(false);
  }
};
```

### WebSocket with React Component

```typescript
function GameComponent() {
  const { send } = useWebSocket({ autoConnect: true });

  useGameEvents({
    onStart: (data) => {
      // Handle game start
    },
  });

  const handleAction = () => {
    send('game:ready', { sessionId: 'xxx' });
  };

  return <button onClick={handleAction}>Ready</button>;
}
```

### Solana Transaction Flow

```typescript
const { sendSol } = useSolana();

const handleTransfer = async () => {
  // 1. Send blockchain transaction
  const signature = await sendSol(from, to, amount);
  
  // 2. Notify backend
  if (signature) {
    await API.wallet.deposit({ 
      amount, 
      txHash: signature 
    });
  }
};
```

---

## 🚨 Error Handling

All API calls return:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Handle errors:

```typescript
const response = await API.user.getProfile();

if (response.success) {
  console.log('Data:', response.data);
} else {
  console.error('Error:', response.error);
}
```

---

## 💡 Best Practices

1. **Always use hooks in components** for state management
2. **Unsubscribe from WebSocket events** in cleanup
3. **Handle loading states** for better UX
4. **Validate addresses** before Solana transactions
5. **Store tokens securely** in localStorage
6. **Use environment variables** for configuration
7. **Enable mock data** during development
8. **Test incrementally** (API → WebSocket → Blockchain)

---

## 🔗 Related Files

- `/config/env.ts` - Environment configuration
- `/types/api.ts` - Type definitions
- `/utils/api.ts` - API client
- `/utils/websocket.ts` - WebSocket service
- `/utils/solana.ts` - Solana utilities
- `/hooks/useApi.ts` - API hook
- `/hooks/useWebSocket.ts` - WebSocket hooks
- `/hooks/useSolana.ts` - Solana hooks
- `/examples/IntegrationExamples.tsx` - Usage examples
- `/INTEGRATION_GUIDE.md` - Full integration guide
