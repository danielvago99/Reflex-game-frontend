import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { AppProviders } from './app/providers/AppProviders';
import { RouteGuard } from './app/routes/RouteGuard';
import { Toaster } from './components/ui/sonner';

const routeLoaders = {
  WelcomeRoute: () => import('./features/auth/routes/WelcomeRoute'),
  CreateWalletRoute: () => import('./features/wallet/routes/CreateWalletRoute'),
  SetPasswordRoute: () => import('./features/wallet/routes/SetPasswordRoute'),
  SeedDisplayRoute: () => import('./features/wallet/routes/SeedDisplayRoute'),
  SeedVerifyRoute: () => import('./features/wallet/routes/SeedVerifyRoute'),
  EncryptingWalletRoute: () => import('./features/wallet/routes/EncryptingWalletRoute'),
  WalletReadyRoute: () => import('./features/wallet/routes/WalletReadyRoute'),
  BalanceCheckRoute: () => import('./features/wallet/routes/BalanceCheckRoute'),
  ImportWalletRoute: () => import('./features/wallet/routes/ImportWalletRoute'),
  UnlockWalletRoute: () => import('./features/wallet/routes/UnlockWalletRoute'),
  DashboardRoute: () => import('./features/auth/routes/DashboardRoute'),
  LobbyRoute: () => import('./features/arena/routes/LobbyRoute'),
  ArenaRoute: () => import('./features/arena/routes/ArenaRoute'),
  ProfileRoute: () => import('./features/auth/routes/ProfileRoute'),
  AmbassadorRoute: () => import('./features/auth/routes/AmbassadorRoute'),
  SettingsRoute: () => import('./features/auth/routes/SettingsRoute'),
  RewardsRoute: () => import('./features/auth/routes/RewardsRoute'),
  DailyChallengeRoute: () => import('./features/auth/routes/DailyChallengeRoute')
};

const WelcomeRoute = lazy(routeLoaders.WelcomeRoute);
const CreateWalletRoute = lazy(routeLoaders.CreateWalletRoute);
const SetPasswordRoute = lazy(routeLoaders.SetPasswordRoute);
const SeedDisplayRoute = lazy(routeLoaders.SeedDisplayRoute);
const SeedVerifyRoute = lazy(routeLoaders.SeedVerifyRoute);
const EncryptingWalletRoute = lazy(routeLoaders.EncryptingWalletRoute);
const WalletReadyRoute = lazy(routeLoaders.WalletReadyRoute);
const BalanceCheckRoute = lazy(routeLoaders.BalanceCheckRoute);
const ImportWalletRoute = lazy(routeLoaders.ImportWalletRoute);
const UnlockWalletRoute = lazy(routeLoaders.UnlockWalletRoute);
const DashboardRoute = lazy(routeLoaders.DashboardRoute);
const LobbyRoute = lazy(routeLoaders.LobbyRoute);
const ArenaRoute = lazy(routeLoaders.ArenaRoute);
const ProfileRoute = lazy(routeLoaders.ProfileRoute);
const AmbassadorRoute = lazy(routeLoaders.AmbassadorRoute);
const SettingsRoute = lazy(routeLoaders.SettingsRoute);
const RewardsRoute = lazy(routeLoaders.RewardsRoute);
const DailyChallengeRoute = lazy(routeLoaders.DailyChallengeRoute);

export default function App() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [routesReady, setRoutesReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all(Object.values(routeLoaders).map(load => load())).then(() => {
      if (active) {
        setRoutesReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (showLoadingScreen) {
    return (
      <LoadingScreen
        onComplete={() => setShowLoadingScreen(false)}
        isReady={routesReady}
      />
    );
  }

  return (
    <BrowserRouter>
      <AppProviders>
        <Suspense fallback={<LoadingScreen onComplete={() => undefined} isStatic />}>
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
