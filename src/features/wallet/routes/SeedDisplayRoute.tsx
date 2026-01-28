import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedDisplayScreen } from '../../../components/wallet/SeedDisplayScreen';
import { useWallet } from '../context/WalletProvider';

export default function SeedDisplayRoute() {
  const navigate = useNavigate();
  const { getSeed } = useWallet();
  const seed = getSeed();

  useEffect(() => {
    if (!seed.length) {
      navigate('/wallet/create', { replace: true });
    }
  }, [seed, navigate]);

  return (
    <SeedDisplayScreen
      seedPhrase={seed}
      onContinue={() => navigate('/wallet/seed-verify')}
      onBack={() => navigate('/wallet/set-password')}
    />
  );
}
