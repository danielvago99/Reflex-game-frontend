import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { AppProviders } from './app/providers/AppProviders';
import { RouteGuard } from './app/routes/RouteGuard';
import { Toaster } from './components/ui/sonner';

const WelcomeRoute = lazy(() => import('./features/auth/routes/WelcomeRoute'));
const CreateWalletRoute = lazy(() => import('./features/wallet/routes/CreateWalletRoute'));
const SetPasswordRoute = lazy(() => import('./features/wallet/routes/SetPasswordRoute'));
const SeedDisplayRoute = lazy(() => import('./features/wallet/routes/SeedDisplayRoute'));
const SeedVerifyRoute = lazy(() => import('./features/wallet/routes/SeedVerifyRoute'));
const EncryptingWalletRoute = lazy(() => import('./features/wallet/routes/EncryptingWalletRoute'));
const WalletReadyRoute = lazy(() => import('./features/wallet/routes/WalletReadyRoute'));
const BalanceCheckRoute = lazy(() => import('./features/wallet/routes/BalanceCheckRoute'));
const ImportWalletRoute = lazy(() => import('./features/wallet/routes/ImportWalletRoute'));
const UnlockWalletRoute = lazy(() => import('./features/wallet/routes/UnlockWalletRoute'));
const DashboardRoute = lazy(() => import('./features/auth/routes/DashboardRoute'));
const LobbyRoute = lazy(() => import('./features/arena/routes/LobbyRoute'));
const ArenaRoute = lazy(() => import('./features/arena/routes/ArenaRoute'));
const ProfileRoute = lazy(() => import('./features/auth/routes/ProfileRoute'));
const AmbassadorRoute = lazy(() => import('./features/auth/routes/AmbassadorRoute'));
const SettingsRoute = lazy(() => import('./features/auth/routes/SettingsRoute'));
const RewardsRoute = lazy(() => import('./features/auth/routes/RewardsRoute'));
const DailyChallengeRoute = lazy(() => import('./features/auth/routes/DailyChallengeRoute'));

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Suspense fallback={<LoadingScreen onComplete={() => undefined} />}>
          <Routes>
            <Route path="/" element={<WelcomeRoute />} />
            <Route path="/wallet/create" element={<CreateWalletRoute />} />
            <Route path="/wallet/set-password" element={<SetPasswordRoute />} />
            <Route path="/wallet/seed-display" element={<SeedDisplayRoute />} />
            <Route path="/wallet/seed-verify" element={<SeedVerifyRoute />} />
            <Route path="/wallet/encrypting" element={<EncryptingWalletRoute />} />
            <Route path="/wallet/ready" element={<WalletReadyRoute />} />
            <Route path="/wallet/balance" element={<BalanceCheckRoute />} />
            <Route path="/wallet/import" element={<ImportWalletRoute />} />
            <Route path="/wallet/unlock" element={<UnlockWalletRoute />} />
            <Route element={<RouteGuard />}>
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/lobby" element={<LobbyRoute />} />
              <Route path="/arena" element={<ArenaRoute />} />
              <Route path="/profile" element={<ProfileRoute />} />
              <Route path="/ambassador" element={<AmbassadorRoute />} />
              <Route path="/settings" element={<SettingsRoute />} />
              <Route path="/rewards" element={<RewardsRoute />} />
              <Route path="/daily-challenge" element={<DailyChallengeRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AppProviders>
    </BrowserRouter>
  );
}
