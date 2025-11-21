import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeedDisplayScreen } from '../../../components/wallet/SeedDisplayScreen';
import { useWallet } from '../context/WalletProvider';

export default function SeedDisplayRoute() {
  const navigate = useNavigate();
  const { getSeed, address } = useWallet();
  const [seed, setSeed] = useState<string[]>([]);

  useEffect(() => {
    const currentSeed = getSeed();

    if (!currentSeed.length) {
      navigate('/wallet/create', { replace: true });
      return;
    }

    setSeed(currentSeed);
  }, [getSeed, navigate]);

  return (
    <SeedDisplayScreen
      seedPhrase={seed}
      walletAddress={address}
      onContinue={() => navigate('/wallet/seed-verify')}
      onBack={() => navigate('/wallet/set-password')}
    />
  );
}
