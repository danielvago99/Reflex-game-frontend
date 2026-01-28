import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetPasswordScreen } from '../../../components/wallet/SetPasswordScreen';
import { useWallet } from '../context/WalletProvider';

export default function SetPasswordRoute() {
  const navigate = useNavigate();
  const { setPassword, getSeed } = useWallet();

  useEffect(() => {
    if (!getSeed().length) {
      navigate('/wallet/create', { replace: true });
    }
  }, [getSeed, navigate]);

  return (
    <SetPasswordScreen
      onContinue={(password) => {
        setPassword(password);
        navigate('/wallet/seed-display');
      }}
      onBack={() => navigate('/wallet/create')}
    />
  );
}
