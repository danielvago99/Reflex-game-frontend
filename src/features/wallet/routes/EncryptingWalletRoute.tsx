import { useNavigate } from 'react-router-dom';
import { EncryptingWalletScreen } from '../../../components/wallet/EncryptingWalletScreen';
import { useWallet } from '../context/WalletProvider';

export default function EncryptingWalletRoute() {
  const navigate = useNavigate();
  const { encryptAndStore } = useWallet();

  const handleComplete = async () => {
    try {
      await encryptAndStore();
      navigate('/wallet/ready');
    } catch (error) {
      console.error('Encryption failed', error);
      navigate('/wallet/create');
    }
  };

  return <EncryptingWalletScreen onComplete={handleComplete} />;
}
