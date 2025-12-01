import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EncryptingWalletScreen } from '../../../components/wallet/EncryptingWalletScreen';
import { useWallet } from '../context/WalletProvider';
import { useAuth } from '../../auth/hooks/useAuth';

export default function EncryptingWalletRoute() {
  const navigate = useNavigate();
  const { encryptAndStore, getVaultStatus } = useWallet();
  const { loginWithInAppWallet } = useAuth();

  const handleComplete = async () => {
    const vaultStatus = getVaultStatus();

    if (!vaultStatus.hasSeed || !vaultStatus.hasPassword) {
      const message = 'Wallet setup is incomplete. Please restart and ensure the seed and password are set before encryption.';
      console.error(message, vaultStatus);
      toast.error(message);
      navigate('/wallet/create', { replace: true });
      return;
    }

    try {
      await encryptAndStore();
      await loginWithInAppWallet();
      navigate('/wallet/ready');
    } catch (error) {
      console.error('Encryption failed', error);
      toast.error(error instanceof Error ? error.message : 'Failed to encrypt wallet. Please try again.');
      navigate('/wallet/create', { replace: true });
    }
  };

  // The create wallet flow is orchestrated through route components: each step guards its prerequisites
  // and this encrypting route finalizes the flow by calling encryptAndStore before navigating to WalletReady.
  return <EncryptingWalletScreen onComplete={handleComplete} />;
}
