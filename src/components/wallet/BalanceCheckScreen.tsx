import { RefreshCw, ArrowRight, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { BalanceBadge } from './BalanceBadge';
import { WalletCard } from './WalletCard';

interface BalanceCheckScreenProps {
  walletAddress: string;
  onContinue: () => void;
  onBack: () => void;
}

export function BalanceCheckScreen({ walletAddress, onContinue, onBack }: BalanceCheckScreenProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const minRecommended = 0.06;

  const handleCheckBalance = async () => {
    setIsChecking(true);
    // Simulate API call
    setTimeout(() => {
      // Mock balance - in real app, this would fetch from blockchain
      setBalance(Math.random() * 0.2);
      setIsChecking(false);
    }, 1500);
  };

  const hasSufficientBalance = balance !== null && balance >= minRecommended;
  const hasLowBalance = balance !== null && balance < minRecommended && balance > 0;
  const hasNoBalance = balance === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-[#06B6D4] opacity-10 rounded-full blur-[120px]"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-white/5 backdrop-blur-2xl"></div>

      <div className="relative z-10 max-w-md mx-auto flex flex-col min-h-screen py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] blur-xl opacity-50"></div>
            <Wallet className="w-10 h-10 text-white relative" />
          </div>
          <h1 className="text-3xl text-white mb-2">Check Balance</h1>
          <p className="text-gray-400">Verify your wallet is funded</p>
        </div>

        <div className="flex-1 space-y-6">
          {/* Wallet address */}
          <WalletCard>
            <div className="p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Your Address</label>
              <code className="text-[#00FFA3] text-sm break-all">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </code>
            </div>
          </WalletCard>

          {/* Balance display */}
          {balance !== null ? (
            <div className="text-center space-y-4">
              <div className="inline-block">
                <BalanceBadge balance={balance} size="lg" />
              </div>

              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-br from-white/10 to-white/5 blur-sm rounded-lg"></div>
                <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Minimum for Gameplay</p>
                      <p className="text-white">{minRecommended.toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Your Balance</p>
                      <p className={hasSufficientBalance ? 'text-[#00FFA3]' : 'text-orange-400'}>
                        {balance.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          hasSufficientBalance 
                            ? 'bg-gradient-to-r from-[#00FFA3] to-green-500' 
                            : 'bg-gradient-to-r from-orange-400 to-red-400'
                        }`}
                        style={{ width: `${Math.min((balance / minRecommended) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {hasSufficientBalance 
                        ? 'Sufficient for gameplay' 
                        : `Need ${(minRecommended - balance).toFixed(4)} more SOL`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-white/10 border-t-[#00FFA3] rounded-full animate-spin mx-auto mb-4 hidden" id="spinner"></div>
              <p className="text-gray-400 mb-6">
                Click below to check your wallet balance
              </p>
            </div>
          )}

          {/* Status alerts */}
          {hasSufficientBalance && (
            <WalletAlert variant="success" title="Ready to Play!">
              Your wallet has sufficient balance for gameplay. You can now access all game features.
            </WalletAlert>
          )}

          {hasLowBalance && (
            <WalletAlert variant="warning" title="Low Balance">
              Your balance is below the recommended minimum. You may not have enough for multiple games and transaction fees. Consider adding more SOL.
            </WalletAlert>
          )}

          {hasNoBalance && (
            <WalletAlert variant="danger" title="No Balance Detected">
              <p className="mb-2">Your wallet hasn't been funded yet.</p>
              <p>Please send SOL to your wallet address and try checking again.</p>
            </WalletAlert>
          )}

          {/* Balance breakdown */}
          {balance !== null && (
            <WalletCard>
              <div className="p-4 space-y-3 text-sm">
                <h3 className="text-white mb-2">Estimated Usage</h3>
                <div className="flex justify-between text-gray-300">
                  <span>Minimum stake (0.05 SOL)</span>
                  <span className="text-white">1 game</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Transaction fees (~0.001 SOL each)</span>
                  <span className="text-white">{Math.floor(balance * 1000)} txns</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Total games possible</span>
                  <span className="text-[#00FFA3]">~{Math.floor(balance / 0.051)}</span>
                </div>
              </div>
            </WalletCard>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-8">
          {balance === null ? (
            <WalletButton 
              onClick={handleCheckBalance} 
              icon={RefreshCw}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Check Balance'}
            </WalletButton>
          ) : hasSufficientBalance ? (
            <WalletButton onClick={onContinue} icon={ArrowRight}>
              Continue to Menu
            </WalletButton>
          ) : (
            <>
              <WalletButton 
                onClick={handleCheckBalance} 
                icon={RefreshCw}
                variant="secondary"
              >
                Recheck Balance
              </WalletButton>
              <WalletButton onClick={onBack} variant="secondary">
                View Wallet Address
              </WalletButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
