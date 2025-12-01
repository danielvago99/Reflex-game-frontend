import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UnlockWalletScreen } from '../../../components/wallet/UnlockWalletScreen';
import { useAuth } from '../../auth/hooks/useAuth';

export default function UnlockWalletRoute() {
  const navigate = useNavigate();
  const { loginWithInAppWallet } = useAuth();

  const handleUnlocked = async () => {
    try {
      await loginWithInAppWallet();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed after unlocking wallet', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log in with wallet');
    }
  };

  return (
    <UnlockWalletScreen
      onUnlocked={handleUnlocked}
      onBack={() => navigate('/')}
      onRecoveryMethod={() => navigate('/wallet/import')}
    />
  );
}
