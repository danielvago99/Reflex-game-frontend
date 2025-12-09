import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useWallet } from '../../features/wallet/context/WalletProvider';

export function RouteGuard() {
  const { address } = useWallet();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (!address) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
