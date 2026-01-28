import { useNavigate } from 'react-router-dom';
import { ImportWalletScreen } from '../../../components/wallet/ImportWalletScreen';
import { useWallet } from '../context/WalletProvider';
import { useAuth } from '../../auth/hooks/useAuth';
import { toast } from 'sonner';

export default function ImportWalletRoute() {
  const navigate = useNavigate();
  const { importFromSeed } = useWallet();
  const { loginWithInAppWallet } = useAuth();

  return (
    <ImportWalletScreen
      onImportSeed={async (seedPhrase, password) => {
        try {
          const record = await importFromSeed(seedPhrase, password);
          await loginWithInAppWallet(record.publicKey);
          navigate('/dashboard');
        } catch (error) {
          console.error('Failed to import wallet from seed', error);
          toast.error(error instanceof Error ? error.message : 'Unable to import wallet');
        }
      }}
      onBack={() => navigate('/wallet/unlock')}
    />
  );
}
