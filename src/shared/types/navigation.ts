export type AppScreen =
  | 'welcome'
  | 'create-wallet'
  | 'set-password'
  | 'seed-display'
  | 'seed-verify'
  | 'encrypting-wallet'
  | 'wallet-ready'
  | 'balance-check'
  | 'import-wallet'
  | 'unlock-wallet'
  | 'dashboard'
  | 'lobby'
  | 'arena'
  | 'profile'
  | 'ambassador'
  | 'settings'
  | 'rewards'
  | 'daily-challenge';

export const ScreenPaths: Record<AppScreen, string> = {
  welcome: '/',
  'create-wallet': '/wallet/create',
  'set-password': '/wallet/set-password',
  'seed-display': '/wallet/seed-display',
  'seed-verify': '/wallet/seed-verify',
  'encrypting-wallet': '/wallet/encrypting',
  'wallet-ready': '/wallet/ready',
  'balance-check': '/wallet/balance',
  'import-wallet': '/wallet/import',
  'unlock-wallet': '/wallet/unlock',
  dashboard: '/dashboard',
  lobby: '/lobby',
  arena: '/arena',
  profile: '/profile',
  ambassador: '/ambassador',
  settings: '/settings',
  rewards: '/rewards',
  'daily-challenge': '/daily-challenge'
};

export const screenToPath = (screen: AppScreen): string => ScreenPaths[screen];
