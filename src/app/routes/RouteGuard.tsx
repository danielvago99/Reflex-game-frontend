import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '../../features/wallet/context/WalletProvider';

export function RouteGuard() {
  const { address } = useWallet();
  const location = useLocation();

  if (!address) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
