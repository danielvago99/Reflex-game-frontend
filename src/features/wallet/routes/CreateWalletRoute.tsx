import { useNavigate } from 'react-router-dom';
import { CreateWalletScreen } from '../../../components/wallet/CreateWalletScreen';
import { useWallet } from '../context/WalletProvider';

export default function CreateWalletRoute() {
  const navigate = useNavigate();
  const { generateSeed } = useWallet();

  const handleContinue = () => {
    generateSeed();
    navigate('/wallet/set-password');
  };

  return <CreateWalletScreen onContinue={handleContinue} onBack={() => navigate('/')} />;
}
