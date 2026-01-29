import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useWallet } from '../../features/wallet/context/WalletProvider';
import { LoadingScreen } from '../../components/LoadingScreen';

export function RouteGuard() {
  const { address } = useWallet();
  const { user, loading } = useAuth();
  const location = useLocation();
  const storedAuth =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('solana_auth') : null;
  const hasSolanaAuth = Boolean(storedAuth);

  if (!address && !hasSolanaAuth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (loading && !hasSolanaAuth) {
    return <LoadingScreen onComplete={() => undefined} isStatic />;
  }

  if (!user && !hasSolanaAuth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
