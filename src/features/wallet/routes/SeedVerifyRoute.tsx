import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedVerifyScreen } from '../../../components/wallet/SeedVerifyScreen';
import { useWallet } from '../context/WalletProvider';

export default function SeedVerifyRoute() {
  const navigate = useNavigate();
  const { getSeed } = useWallet();
  const seedPhrase = getSeed();

  useEffect(() => {
    if (!seedPhrase.length) {
      navigate('/wallet/create', { replace: true });
    }
  }, [seedPhrase, navigate]);

  return (
    <SeedVerifyScreen
      seedPhrase={seedPhrase}
      onContinue={() => navigate('/wallet/encrypting')}
      onBack={() => navigate('/wallet/seed-display')}
    />
  );
}
