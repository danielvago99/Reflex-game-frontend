import { useState, useEffect } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameArenaScreen } from './components/GameArenaScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AmbassadorScreen } from './components/AmbassadorScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { CreateWalletScreen } from './components/wallet/CreateWalletScreen';
import { SetPasswordScreen } from './components/wallet/SetPasswordScreen';
import { SeedDisplayScreen } from './components/wallet/SeedDisplayScreen';
import { SeedVerifyScreen } from './components/wallet/SeedVerifyScreen';
import { EncryptingWalletScreen } from './components/wallet/EncryptingWalletScreen';
import { WalletReadyScreen } from './components/wallet/WalletReadyScreen';
import { BalanceCheckScreen } from './components/wallet/BalanceCheckScreen';
import { ImportWalletScreen } from './components/wallet/ImportWalletScreen';
import { UnlockWalletScreen } from './components/wallet/UnlockWalletScreen';
import { Toaster } from './components/ui/sonner';
import { 
  generateSeedPhrase, 
  deriveSolanaKeypair, 
  encryptSeedPhrase, 
  storeEncryptedWallet 
} from './utils/walletCrypto';
import { initializeFreeStakes } from './utils/initFreeStakes';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('Player_0x4f2a');
  const [walletData, setWalletData] = useState<{
    seedPhrase: string[];
    address: string;
    password: string;
    biometric: boolean;
    provider?: string; // Track if connected via external wallet provider
  }>({
    seedPhrase: [],
    address: '',
    password: '',
    biometric: false,
    provider: undefined
  });
  const [matchDetails, setMatchDetails] = useState<{
    isRanked: boolean;
    stakeAmount: number;
    matchType: 'ranked' | 'friend' | 'bot';
  }>({
    isRanked: false,
    stakeAmount: 0,
    matchType: 'bot'
  });
  const [dashboardKey, setDashboardKey] = useState(0);

  // Initialize free stakes on app load
  useEffect(() => {
    initializeFreeStakes();
  }, []);

  const handleLogout = () => {
    // Logout only ends the current session - ALL DATA PERSISTS
    // Player data is tied to wallet address, not session
    // When user reconnects with same wallet, everything is restored:
    // ✓ Reflex Points, Free Stakes, Daily Challenges
    // ✓ Ambassador Stats, Match History, Game Progress
    // ✓ All statistics and achievements
    
    setWalletData({
      seedPhrase: [],
      address: '',
      password: '',
      biometric: false,
      provider: undefined
    });
    setPlayerName('Player_0x4f2a');
    setCurrentScreen('welcome');
    
    // Clear only active session marker
    // All wallet-bound data remains in localStorage
    localStorage.removeItem('connectedWallet');
  };

  // Handle external wallet connection
  const handleWalletConnect = (address: string, provider: string) => {
    setWalletData({
      seedPhrase: [],
      address,
      password: '',
      biometric: false,
      provider
    });
  };

  // Handle wallet creation with real crypto
  const handleStartWalletCreation = () => {
    // Generate real BIP-39 seed phrase
    const newSeedPhrase = generateSeedPhrase();
    setWalletData((prev) => ({ ...prev, seedPhrase: newSeedPhrase }));
    setCurrentScreen('set-password');
  };

  // Handle encryption and storage
  const handleWalletEncryption = async () => {
    try {
      // Derive Solana keypair from seed phrase
      const keypair = await deriveSolanaKeypair(walletData.seedPhrase);
      const address = keypair.publicKey.toBase58();

      // Encrypt seed phrase with password
      const encryptedSeed = await encryptSeedPhrase(walletData.seedPhrase, walletData.password);

      // Store encrypted wallet
      storeEncryptedWallet(encryptedSeed, address);

      // Update wallet data with address
      setWalletData({ ...walletData, address });

      // Move to wallet ready screen
      setCurrentScreen('wallet-ready');
    } catch (error) {
      console.error('Error encrypting wallet:', error);
      // Handle error - could show an error screen
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={setCurrentScreen} onWalletConnect={handleWalletConnect} />;
      case 'create-wallet':
        return <CreateWalletScreen 
          onContinue={handleStartWalletCreation}
          onBack={() => setCurrentScreen('welcome')}
        />;
      case 'set-password':
        return <SetPasswordScreen
          onContinue={(password, biometric) => {
            setWalletData((prev) => ({ ...prev, password, biometric }));
            setCurrentScreen('seed-display');
          }}
          onBack={() => setCurrentScreen('create-wallet')}
        />;
      case 'seed-display':
        return <SeedDisplayScreen
          seedPhrase={walletData.seedPhrase}
          walletAddress={walletData.address}
          onContinue={() => setCurrentScreen('seed-verify')}
          onBack={() => setCurrentScreen('set-password')}
        />;
      case 'seed-verify':
        return <SeedVerifyScreen
          seedPhrase={walletData.seedPhrase}
          onContinue={() => setCurrentScreen('encrypting-wallet')}
          onBack={() => setCurrentScreen('seed-display')}
        />;
      case 'encrypting-wallet':
        return <EncryptingWalletScreen
          onComplete={handleWalletEncryption}
        />;
      case 'wallet-ready':
        return <WalletReadyScreen
          walletAddress={walletData.address}
          onContinue={() => setCurrentScreen('dashboard')}
        />;
      case 'balance-check':
        return <BalanceCheckScreen
          walletAddress={walletData.address}
          onContinue={() => setCurrentScreen('dashboard')}
          onBack={() => setCurrentScreen('wallet-ready')}
        />;
      case 'import-wallet':
        return <ImportWalletScreen
          onContinue={() => setCurrentScreen('dashboard')}
          onBack={() => setCurrentScreen('unlock-wallet')}
        />;
      case 'unlock-wallet':
        return <UnlockWalletScreen
          onContinue={() => setCurrentScreen('dashboard')}
          onBack={() => setCurrentScreen('welcome')}
          onRecoveryMethod={() => setCurrentScreen('import-wallet')}
        />;
      case 'dashboard':
        return <DashboardScreen 
          key={dashboardKey} // Force re-render when returning to dashboard
          onNavigate={setCurrentScreen} 
          playerName={playerName}
          walletAddress={walletData.address}
          balance={5.42}
        />;
      case 'lobby':
        return <LobbyScreen 
          onNavigate={setCurrentScreen} 
          onStartMatch={(isRanked, stakeAmount, matchType) => {
            setMatchDetails({ isRanked, stakeAmount, matchType });
            setCurrentScreen('arena');
          }}
          walletProvider={walletData.provider}
        />;
      case 'arena':
        return <GameArenaScreen 
          onNavigate={(screen) => {
            if (screen === 'lobby' || screen === 'dashboard') {
              setDashboardKey(prev => prev + 1); // Force dashboard refresh
            }
            setCurrentScreen(screen);
          }}
          isRanked={matchDetails.isRanked}
          stakeAmount={matchDetails.stakeAmount}
          matchType={matchDetails.matchType}
        />;
      case 'profile':
        return <ProfileScreen onNavigate={setCurrentScreen} playerName={playerName} />;
      case 'ambassador':
        return <AmbassadorScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen 
          currentName={playerName}
          onNavigate={setCurrentScreen}
          onUpdateName={setPlayerName}
          onLogout={handleLogout}
        />;
      case 'rewards':
        return <RewardsScreen onNavigate={setCurrentScreen} />;
      case 'daily-challenge':
        return <DailyChallengeScreen onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} onWalletConnect={handleWalletConnect} />;
    }
  };

  return (
    <div className="antialiased">
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : (
        renderScreen()
      )}
      <Toaster />
    </div>
  );
}