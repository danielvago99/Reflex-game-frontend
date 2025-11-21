import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useWallet } from '../../features/wallet/context/WalletProvider';

export function RouteGuard() {
  const { address, status, hasStoredWallet } = useWallet();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen onComplete={() => undefined} />;
  }

  if (status === 'onboarding') {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (status === 'locked' || (!address && hasStoredWallet)) {
    return <Navigate to="/wallet/unlock" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
