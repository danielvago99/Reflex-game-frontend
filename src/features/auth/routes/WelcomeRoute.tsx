import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WelcomeScreen } from '../../../components/WelcomeScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useSolanaAuth } from '../../wallet/hooks/useSolanaAuth';
import { toast } from 'sonner';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function WelcomeRoute() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { login } = useSolanaAuth();
  const isLoggingInRef = useRef(false);

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  const handleWalletConnect = () => {
    setVisible(true);
  };

  useEffect(() => {
    if (!connected || isLoggingInRef.current) {
      return;
    }

    isLoggingInRef.current = true;

    const runLogin = async () => {
      try {
        await login();
        navigate('/dashboard');
      } catch (error) {
        console.error('Solana login failed', error);
        toast.error(error instanceof Error ? error.message : 'Failed to authenticate with wallet');
        isLoggingInRef.current = false;
      }
    };

    void runLogin();
  }, [connected, login, navigate]);

  return <WelcomeScreen onNavigate={handleNavigate} onWalletConnect={handleWalletConnect} />;
}
