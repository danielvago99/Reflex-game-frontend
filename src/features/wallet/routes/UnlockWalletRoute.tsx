import { useNavigate } from 'react-router-dom';
import { UnlockWalletScreen } from '../../../components/wallet/UnlockWalletScreen';

export default function UnlockWalletRoute() {
  const navigate = useNavigate();

  return (
    <UnlockWalletScreen
      onUnlocked={() => navigate('/dashboard')}
      onBack={() => navigate('/')}
      onRecoveryMethod={() => navigate('/wallet/import')}
    />
  );
}
