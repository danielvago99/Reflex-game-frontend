/**
 * Integration Examples
 * 
 * This file shows how to use the API, WebSocket, and Solana utilities
 * in your components. Copy these patterns to your actual components.
 */

import { useEffect, useState } from 'react';
import { API } from '../utils/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket, useGameEvents, useLobbyEvents } from '../hooks/useWebSocket';
import { useSolana, useWalletBalance } from '../hooks/useSolana';
import { toast } from 'sonner';

// ============================================================================
// EXAMPLE 1: Fetch User Profile
// ============================================================================

export function UserProfileExample() {
  const { data, loading, error, execute } = useApi(API.user.getProfile, {
    onSuccess: (data) => {
      console.log('Profile loaded:', data);
      toast.success('Profile loaded');
    },
    onError: (error) => {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    },
  });

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.username}</h1>
      <p>{data.walletAddress}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Create Game Lobby
// ============================================================================

export function CreateLobbyExample() {
  const { loading, execute } = useApi(API.game.createLobby, {
    onSuccess: (lobby) => {
      console.log('Lobby created:', lobby);
      toast.success('Lobby created!');
      // Navigate to lobby screen
    },
    onError: (error) => {
      toast.error('Failed to create lobby');
    },
  });

  const handleCreateLobby = async () => {
    await execute({
      mode: 'random',
      stake: 0.1,
    });
  };

  return (
    <button onClick={handleCreateLobby} disabled={loading}>
      {loading ? 'Creating...' : 'Create Lobby'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 3: WebSocket Game Events
// ============================================================================

export function GameArenaExample() {
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'active' | 'result'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [showButton, setShowButton] = useState(false);
  const [result, setResult] = useState(null);

  const { isConnected, send } = useWebSocket({
    autoConnect: true,
    token: localStorage.getItem('auth_token') || undefined,
  });

  // Subscribe to game events
  useGameEvents({
    onStart: (data) => {
      console.log('Game starting:', data);
      setGameState('countdown');
      toast.info('Game starting!');
    },
    
    onCountdown: (data) => {
      console.log('Countdown:', data.count);
      setCountdown(data.count);
    },
    
    onShowButton: (data) => {
      console.log('Button shown at:', data.showTime);
      setGameState('active');
      setShowButton(true);
    },
    
    onPlayerClicked: (data) => {
      console.log('Player clicked:', data);
      toast.info(`Player clicked: ${data.reactionTime}ms`);
    },
    
    onResult: (data) => {
      console.log('Game result:', data.result);
      setGameState('result');
      setResult(data.result);
      setShowButton(false);
      
      if (data.result.winner.userId === 'current-user-id') {
        toast.success('You won!');
      } else {
        toast.error('You lost!');
      }
    },
  });

  const handleClick = () => {
    if (!showButton) return;
    
    const reactionTime = Date.now(); // Calculate from button show time
    
    send('game:click', {
      sessionId: 'current-session-id',
      timestamp: reactionTime,
    });
    
    setShowButton(false);
  };

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      
      {gameState === 'countdown' && (
        <div className="text-6xl">{countdown}</div>
      )}
      
      {gameState === 'active' && showButton && (
        <button onClick={handleClick} className="w-32 h-32 bg-green-500 rounded-full">
          CLICK ME!
        </button>
      )}
      
      {gameState === 'result' && result && (
        <div>
          <h2>Game Over!</h2>
          {/* Display result */}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Lobby WebSocket Events
// ============================================================================

export function LobbyExample() {
  const [lobby, setLobby] = useState(null);
  const [players, setPlayers] = useState([]);

  useLobbyEvents({
    onUpdate: (data) => {
      console.log('Lobby updated:', data);
      setLobby(data.lobby);
    },
    
    onPlayerJoined: (data) => {
      console.log('Player joined:', data);
      setPlayers(prev => [...prev, data.player]);
      toast.success(`${data.player.username} joined!`);
    },
    
    onPlayerLeft: (data) => {
      console.log('Player left:', data);
      setPlayers(prev => prev.filter(p => p.userId !== data.playerId));
      toast.info('Player left');
    },
  });

  return (
    <div>
      <h2>Lobby</h2>
      <div>
        {players.map(player => (
          <div key={player.userId}>{player.username}</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Solana Wallet Balance
// ============================================================================

export function WalletBalanceExample() {
  const walletAddress = 'your-wallet-address';
  const { balance, loading, error, refresh } = useWalletBalance(
    walletAddress,
    30000 // Refresh every 30 seconds
  );

  return (
    <div>
      <h2>Wallet Balance</h2>
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

// ============================================================================
// EXAMPLE 6: Send SOL Transaction
// ============================================================================

export function SendSolExample() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const { sendSol, loading, error } = useSolana();

  const handleSend = async () => {
    // Get wallet keypair from secure storage
    const fromKeypair = {
      publicKey: 'from-address',
      secretKey: new Uint8Array(64), // Load from secure storage
    };

    const signature = await sendSol(fromKeypair, toAddress, parseFloat(amount));
    
    if (signature) {
      toast.success(`Transaction sent! Signature: ${signature.slice(0, 8)}...`);
      
      // Update backend
      await API.wallet.deposit({
        amount: parseFloat(amount),
        txHash: signature,
      });
    }
  };

  return (
    <div>
      <h2>Send SOL</h2>
      <input
        type="text"
        placeholder="To Address"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Deposit SOL to Platform
// ============================================================================

export function DepositExample() {
  const [amount, setAmount] = useState('');
  const { sendSol, loading: solLoading } = useSolana();
  const { loading: apiLoading, execute } = useApi(API.wallet.deposit);

  const handleDeposit = async () => {
    try {
      // Step 1: Send SOL to platform wallet
      const platformWalletAddress = 'PLATFORM_WALLET_ADDRESS'; // Get from backend
      const userKeypair = {
        publicKey: 'user-address',
        secretKey: new Uint8Array(64), // Load from secure storage
      };

      const signature = await sendSol(
        userKeypair,
        platformWalletAddress,
        parseFloat(amount)
      );

      if (!signature) {
        throw new Error('Transaction failed');
      }

      // Step 2: Notify backend
      await execute({
        amount: parseFloat(amount),
        txHash: signature,
      });

      toast.success('Deposit successful!');
      setAmount('');
    } catch (error) {
      toast.error('Deposit failed');
    }
  };

  const isLoading = solLoading || apiLoading;

  return (
    <div>
      <h2>Deposit SOL</h2>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleDeposit} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Ambassador Referral System
// ============================================================================

export function AmbassadorExample() {
  const { data: profile, loading, execute } = useApi(API.ambassador.getProfile);

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!profile) return null;

  return (
    <div>
      <h2>Ambassador Dashboard</h2>
      <p>Referral Code: {profile.referralCode}</p>
      <p>Tier: {profile.tier}</p>
      <p>Total Referrals: {profile.totalReferrals}</p>
      <p>Total Earnings: {profile.totalEarnings} SOL</p>
      <p>Points per Referral: {profile.pointsPerReferral}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Paginated Game History
// ============================================================================

export function GameHistoryExample() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const { loading, execute } = useApi(
    (p: number) => API.game.getHistory(p),
    {
      onSuccess: (data) => {
        setHistory(prev => [...prev, ...data.items]);
      },
    }
  );

  useEffect(() => {
    execute(page);
  }, [page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div>
      <h2>Game History</h2>
      {history.map((game: any) => (
        <div key={game.id}>
          <p>Stake: {game.stake} SOL</p>
          <p>Result: {game.winner ? 'Won' : 'Lost'}</p>
        </div>
      ))}
      <button onClick={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Complete Login Flow
// ============================================================================

export function LoginExample() {
  const { signMessage } = useSolana();
  const { loading, execute } = useApi(API.auth.login, {
    onSuccess: (data) => {
      // Store token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);
      
      // Set in API client
      import('../utils/api').then(({ apiClient }) => {
        apiClient.setToken(data.token);
      });
      
      toast.success('Logged in successfully!');
      // Navigate to dashboard
    },
  });

  const handleLogin = async () => {
    try {
      // Step 1: Create message to sign
      const message = `Sign this message to authenticate with the game.\nTimestamp: ${Date.now()}`;
      
      // Step 2: Sign message with wallet
      const userKeypair = {
        publicKey: 'user-address',
        secretKey: new Uint8Array(64), // Load from secure storage
      };
      
      const signature = await signMessage(message, userKeypair);
      
      if (!signature) {
        throw new Error('Failed to sign message');
      }
      
      // Step 3: Send to backend
      await execute({
        walletAddress: userKeypair.publicKey,
        signature,
        message,
      });
    } catch (error) {
      toast.error('Login failed');
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Login with Wallet'}
    </button>
  );
}
