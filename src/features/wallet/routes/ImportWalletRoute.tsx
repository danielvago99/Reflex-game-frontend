import { useNavigate } from 'react-router-dom';
import { ImportWalletScreen } from '../../../components/wallet/ImportWalletScreen';

export default function ImportWalletRoute() {
  const navigate = useNavigate();
  return (
    <ImportWalletScreen
      onContinue={() => navigate('/dashboard')}
      onBack={() => navigate('/wallet/unlock')}
    />
  );
}
