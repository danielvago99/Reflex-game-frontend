import { useNavigate } from 'react-router-dom';
import { BalanceCheckScreen } from '../../../components/wallet/BalanceCheckScreen';
import { useWallet } from '../context/WalletProvider';

export default function BalanceCheckRoute() {
  const navigate = useNavigate();
  const { address } = useWallet();

  return (
    <BalanceCheckScreen
      walletAddress={address}
      onContinue={() => navigate('/dashboard')}
      onBack={() => navigate('/wallet/ready')}
    />
  );
}
