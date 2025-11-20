import { useNavigate } from 'react-router-dom';
import { WalletReadyScreen } from '../../../components/wallet/WalletReadyScreen';
import { useWallet } from '../context/WalletProvider';

export default function WalletReadyRoute() {
  const navigate = useNavigate();
  const { address } = useWallet();

  return (
    <WalletReadyScreen
      walletAddress={address}
      onContinue={() => navigate('/dashboard')}
    />
  );
}
