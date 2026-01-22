import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useWallet } from '../../features/wallet/context/WalletProvider';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useScrollToTop } from '../../hooks/useScrollToTop';

export function RouteGuard() {
  useScrollToTop();
  const { address } = useWallet();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (!address) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (loading) {
    return <LoadingScreen onComplete={() => undefined} isStatic />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
