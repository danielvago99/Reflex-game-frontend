import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedVerifyScreen } from '../../../components/wallet/SeedVerifyScreen';
import { useWallet } from '../context/WalletProvider';

export default function SeedVerifyRoute() {
  const navigate = useNavigate();
  const { getSeed } = useWallet();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);

  useEffect(() => {
    const seed = getSeed();

    if (!seed.length) {
      navigate('/wallet/create', { replace: true });
      return;
    }

    setSeedPhrase(seed);
  }, [getSeed, navigate]);

  return (
    <SeedVerifyScreen
      seedPhrase={seedPhrase}
      onContinue={() => navigate('/wallet/encrypting')}
      onBack={() => navigate('/wallet/seed-display')}
    />
  );
}
