import { useNavigate } from 'react-router-dom';
import { ImportWalletScreen } from '../../../components/wallet/ImportWalletScreen';
import { useWallet } from '../context/WalletProvider';

export default function ImportWalletRoute() {
  const navigate = useNavigate();
  const { importFromSeed, importFromKeystore } = useWallet();

  return (
    <ImportWalletScreen
      onImportSeed={async (seedPhrase, password) => {
        await importFromSeed(seedPhrase, password);
        navigate('/dashboard');
      }}
      onImportKeystore={async (record, password) => {
        await importFromKeystore(record, password);
        navigate('/dashboard');
      }}
      onBack={() => navigate('/wallet/unlock')}
    />
  );
}
