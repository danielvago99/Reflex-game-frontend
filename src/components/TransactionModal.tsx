import { X, Shield, Copy, Check, AlertCircle, ExternalLink, Zap, Vault, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type TransactionState = 
  | 'review'           // Initial review screen
  | 'signing'          // Waiting for signature
  | 'broadcasting'     // Broadcasting to network
  | 'success'          // Transaction successful
  | 'error'            // Transaction failed
  | 'dao-funded';      // Free stake auto-approved

type TransactionProgressState = 'broadcasting';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  onFailure?: (message: string) => void;
  onSign?: (reportState: (state: TransactionProgressState) => void) => Promise<string>;
  stakeAmount: number;
  isFreeStake?: boolean;
  transactionType?: 'stake' | 'claim' | 'withdrawal';
  estimatedFee?: number;
  recipientAddress?: string;
  network?: 'devnet' | 'mainnet-beta' | 'testnet';
  successActionLabel?: string;
  successDescription?: string;
  autoStart?: boolean;
}

export function TransactionModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onFailure,
  onSign,
  stakeAmount,
  isFreeStake = false,
  transactionType = 'stake',
  estimatedFee = 0.000005,
  recipientAddress,
  network = 'devnet',
  successActionLabel = 'Continue to Game',
  successDescription,
  autoStart = false,
}: TransactionModalProps) {
  const [state, setState] = useState<TransactionState>('review');
  const [txId, setTxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!open) {
      toast.dismiss();
    }

    return () => {
      toast.dismiss();
    };
  }, [open]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      hasAutoStarted.current = false;
      if (isFreeStake) {
        setState('dao-funded');
        // Auto-proceed after 2 seconds
        setTimeout(() => {
          handleDaoFundedComplete();
        }, 2000);
      } else {
        setState('review');
      }
      setTxId('');
      setCopied(false);
      setErrorMessage('');
    }
  }, [open, isFreeStake]);

  const handleSign = async () => {
    setState('signing');
    const loadingToastId = toast.loading('Processing transaction...', {
      description: 'Please wait for blockchain confirmation',
    });
    toast.info('Signature requested', {
      description: 'Please check your wallet',
    });

    if (onSign) {
      try {
        const signature = await onSign((nextState) => {
          if (nextState === 'broadcasting') {
            setState('broadcasting');
          }
        });
        setTxId(signature);
        setState('success');
        toast.dismiss(loadingToastId);
        toast.success('Transaction confirmed', {
          description: successDescription ?? 'Your transaction has been confirmed',
          duration: 3000,
        });
        return;
      } catch (error) {
        const failureMessage = error instanceof Error ? error.message : 'Transaction failed';
        setErrorMessage(failureMessage);
        setState('error');
        toast.dismiss(loadingToastId);
        toast.error('Transaction failed', {
          description: 'Please try again',
          duration: 4000,
        });
        onFailure?.(failureMessage);
        return;
      }
    }

    // Simulate wallet signing delay
    setTimeout(() => {
      setState('broadcasting');
      toast.info('Transaction broadcasting', {
        description: 'Sending to Solana network...',
      });

      // Simulate network broadcast
      setTimeout(() => {
        // Simulate success (90% chance) or error (10% chance)
        const success = Math.random() > 0.1;

        if (success) {
          const mockTxId = generateMockTxId();
          setTxId(mockTxId);
          setState('success');
          toast.dismiss(loadingToastId);
          toast.success('Transaction confirmed', {
            description: 'Stake is now active',
            duration: 3000,
          });
        } else {
          const failureMessage = 'Transaction failed. Insufficient funds or network error.';
          setErrorMessage(failureMessage);
          setState('error');
          toast.dismiss(loadingToastId);
          toast.error('Transaction failed', {
            description: 'Please try again',
            duration: 4000,
          });
          onFailure?.(failureMessage);
        }
      }, 2000);
    }, 1500);
  };

  useEffect(() => {
    if (!open || isFreeStake || !autoStart) return;
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    handleSign();
  }, [autoStart, isFreeStake, open]);

  const handleDaoFundedComplete = () => {
    toast.success('Free stake activated', {
      description: 'Funded by DAO treasury',
    });
    onConfirm();
  };

  const handleRetry = () => {
    setState('review');
    setErrorMessage('');
  };

  const handleCopyTxId = () => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    toast.success('Transaction ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const generateMockTxId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getRecipientAddress = () => {
    if (recipientAddress) return recipientAddress;
    if (transactionType === 'stake') return 'GameContract...xyz';
    if (transactionType === 'claim') return 'YourWallet...abc';
    return 'DAO Treasury...def';
  };

  const getAmountLabel = () => {
    if (transactionType === 'withdrawal') return 'Withdraw Amount';
    if (transactionType === 'claim') return 'Claim Amount';
    return 'Stake Amount';
  };

  const getSuccessAmountLabel = () => {
    if (transactionType === 'withdrawal') return 'Amount Withdrawn';
    if (transactionType === 'claim') return 'Amount Claimed';
    return 'Amount Staked';
  };

  const getExplorerUrl = () => {
    const clusterParam = network === 'devnet' ? '?cluster=devnet' : network === 'testnet' ? '?cluster=testnet' : '';
    return `https://solscan.io/tx/${txId}${clusterParam}`;
  };

  const handleClose = () => {
    onCancel?.();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full">
        {/* Background glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-2xl opacity-50"></div>

        {/* Modal content */}
        <div className="relative bg-black/10 backdrop-blur-sm border-2 border-white/20 shadow-2xl overflow-hidden" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
          <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

          {/* Close button - hide during signing/broadcasting */}
          {(state === 'review' || state === 'success' || state === 'error') && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFA3]/50 rounded-lg transition-all z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Transaction Review State */}
          {state === 'review' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-2xl border border-[#00FFA3]/50 mb-4">
                  <Shield className="w-8 h-8 text-[#00FFA3]" />
                </div>
                <h2 className="text-2xl text-white mb-2">Review Transaction</h2>
                <p className="text-sm text-gray-400">Please review the details before signing</p>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3 mb-6">
                {/* Stake Amount */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">{getAmountLabel()}</span>
                    <span className="text-white">◎ {stakeAmount.toFixed(3)}</span>
                  </div>
                </div>

                {/* Network Fee */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Estimated Network Fee</span>
                    <span className="text-white">◎ {estimatedFee.toFixed(6)}</span>
                  </div>
                </div>

                {/* Recipient */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Recipient</span>
                    <span className="text-white text-xs">{getRecipientAddress()}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 border border-[#00FFA3]/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Total Cost</span>
                    <span className="text-xl text-[#00FFA3]">◎ {(stakeAmount + estimatedFee).toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-300 text-center">
                  Please sign this transaction to confirm your {transactionType}.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  className="px-4 py-3 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A] rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Sign Transaction</span>
                </button>
              </div>
            </div>
          )}

          {/* Signing State */}
          {state === 'signing' && (
            <div className="p-8 text-center">
              {/* Solana Logo Animation */}
              <div className="relative inline-flex items-center justify-center mb-6">
                {/* Rotating rings */}
                <div className="absolute w-24 h-24 border-4 border-[#00FFA3]/30 border-t-[#00FFA3] rounded-full animate-spin"></div>
                <div className="absolute w-32 h-32 border-2 border-[#06B6D4]/20 border-b-[#06B6D4] rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                
                {/* Center icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 rounded-2xl border border-[#00FFA3]/50 flex items-center justify-center animate-pulse">
                  <Shield className="w-8 h-8 text-[#00FFA3]" />
                </div>
              </div>

              <h2 className="text-2xl text-white mb-2">Waiting for Signature</h2>
              <p className="text-sm text-gray-400 mb-4">Please confirm the transaction in your wallet</p>

              {/* Solana branding */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-[#00FFA3] rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Solana Network</span>
              </div>
            </div>
          )}

          {/* Broadcasting State */}
          {state === 'broadcasting' && (
            <div className="p-8 text-center">
              {/* Holographic cube animation */}
              <div className="relative inline-flex items-center justify-center mb-6">
                {/* Pulsing rings */}
                <div className="absolute w-32 h-32 border-2 border-[#06B6D4]/30 rounded-full animate-ping"></div>
                <div className="absolute w-24 h-24 border-4 border-[#00FFA3]/40 rounded-full animate-pulse"></div>
                
                {/* Center rotating icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#06B6D4]/30 to-[#7C3AED]/30 rounded-2xl border border-[#06B6D4]/50 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <Zap className="w-8 h-8 text-[#06B6D4]" />
                </div>
              </div>

              <h2 className="text-2xl text-white mb-2">Broadcasting Transaction</h2>
              <p className="text-sm text-gray-400 mb-4">Sending to Solana network...</p>

              {/* Progress indicator */}
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="p-6">
              {/* Success checkmark animation */}
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute w-24 h-24 bg-[#00FFA3]/20 rounded-full animate-ping"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 rounded-full border-4 border-[#00FFA3] flex items-center justify-center">
                    <Check className="w-10 h-10 text-[#00FFA3] animate-in zoom-in duration-500" />
                  </div>
                </div>

                <h2 className="text-2xl text-white mb-2">Transaction Successful!</h2>
                <p className="text-sm text-gray-400">
                  {successDescription ?? `Your ${transactionType} has been confirmed`}
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="space-y-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{getSuccessAmountLabel()}</span>
                    <span className="text-[#00FFA3]">◎ {stakeAmount.toFixed(3)}</span>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 border border-[#00FFA3]/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Transaction ID</span>
                    <button
                      onClick={handleCopyTxId}
                      className="flex items-center gap-1 text-xs text-[#00FFA3] hover:text-[#06B6D4] transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-white/70 break-all font-mono">
                    {txId.substring(0, 32)}...
                  </div>
                </div>
              </div>

              {/* View on Explorer */}
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#06B6D4]/50 text-[#06B6D4] rounded-lg transition-all mb-3"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">View on Solscan</span>
              </a>

              {/* Action Button */}
              <button
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A] rounded-lg transition-all"
              >
                {successActionLabel}
              </button>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute w-24 h-24 bg-red-500/20 rounded-full animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full border-4 border-red-500 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                </div>

                <h2 className="text-2xl text-white mb-2">Transaction Failed</h2>
                <p className="text-sm text-gray-400 mb-4">{errorMessage}</p>
              </div>

              {/* Error details */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-300">
                  Common issues:
                </p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                  <li>Insufficient SOL balance</li>
                  <li>Transaction rejected by user</li>
                  <li>Network congestion</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="px-4 py-3 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A] rounded-lg transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* DAO Funded State */}
          {state === 'dao-funded' && (
            <div className="p-8 text-center">
              {/* Glowing vault animation */}
              <div className="relative inline-flex items-center justify-center mb-6">
                {/* Sparkle effects */}
                <div className="absolute w-32 h-32">
                  <Sparkles className="absolute top-0 right-0 w-4 h-4 text-[#00FFA3] animate-pulse" />
                  <Sparkles className="absolute bottom-0 left-0 w-3 h-3 text-[#06B6D4] animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Sparkles className="absolute top-1/2 left-0 w-3 h-3 text-[#7C3AED] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                
                {/* Glowing rings */}
                <div className="absolute w-28 h-28 border-2 border-[#7C3AED]/30 rounded-full animate-ping"></div>
                <div className="absolute w-24 h-24 border-4 border-[#00FFA3]/40 rounded-full animate-pulse"></div>
                
                {/* Vault icon */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#7C3AED]/30 to-[#00FFA3]/30 rounded-2xl border-2 border-[#7C3AED]/50 flex items-center justify-center animate-pulse">
                  <Vault className="w-10 h-10 text-[#7C3AED]" />
                </div>
              </div>

              <h2 className="text-2xl text-white mb-2">DAO Treasury Stake</h2>
              <p className="text-sm text-gray-400 mb-6">
                This match is funded by the DAO treasury<br />
                <span className="text-[#00FFA3]">No signature required</span>
              </p>

              {/* Info box */}
              <div className="max-w-sm mx-auto bg-gradient-to-r from-[#7C3AED]/10 to-[#00FFA3]/10 border border-[#7C3AED]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs text-white mb-1">Free Stake Activated</p>
                    <p className="text-xs text-gray-400">
                      Free stakes are covered by the DAO community fund. Your winnings are yours to keep!
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-proceeding indicator */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#00FFA3] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#06B6D4] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Auto-proceeding...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
