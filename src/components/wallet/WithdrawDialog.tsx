import { ArrowUpFromLine, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { WalletInput } from './WalletInput';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TransactionModal } from '../TransactionModal';
import { useActiveWallet } from '../../hooks/useActiveWallet';
import { ENV } from '../../config/env';
import { connection } from '../../utils/solana';

interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function WithdrawDialog({ open, onClose, currentBalance }: WithdrawDialogProps) {
  const { publicKey, sendTransaction } = useActiveWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [network] = useState<'devnet' | 'mainnet'>(
    ENV.SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet' : 'devnet'
  );
  const [errors, setErrors] = useState({ address: '', amount: '' });
  const [feeLamports, setFeeLamports] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{ amount: number; recipient: string } | null>(null);

  const estimatedFee = feeLamports != null ? feeLamports / LAMPORTS_PER_SOL : 0;
  const numAmount = parseFloat(amount) || 0;
  const totalCost = numAmount + estimatedFee;
  const canWithdraw =
    recipientAddress.length > 30 &&
    numAmount > 0 &&
    totalCost <= currentBalance;

  useEffect(() => {
    let active = true;
    let intervalId: number | undefined;

    const toBase64 = (data: Uint8Array) => {
      let binary = '';
      data.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return btoa(binary);
    };

    const getRecipientKey = () => {
      try {
        return new PublicKey(recipientAddress);
      } catch {
        return publicKey ?? null;
      }
    };

    const fetchFee = async () => {
      if (!open) {
        setFeeLamports(null);
        return;
      }

      if (!publicKey) {
        setFeeLamports(null);
        return;
      }

      try {
        setFeeLoading(true);
        const recipientKey = getRecipientKey();
        if (!recipientKey) {
          setFeeLamports(null);
          return;
        }
        const latestBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: publicKey,
          recentBlockhash: latestBlockhash.blockhash,
        }).add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientKey,
            lamports: 1,
          })
        );
        const message = transaction.compileMessage();
        let feeValue: number | null = null;

        if (ENV.HELIUS_RPC_URL) {
          const response = await fetch(ENV.HELIUS_RPC_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'helius-fee',
              method: 'getFeeForMessage',
              params: [toBase64(message.serialize()), { commitment: 'processed' }],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            feeValue = typeof data?.result?.value === 'number' ? data.result.value : null;
          }
        }

        if (feeValue == null) {
          const feeInfo = await connection.getFeeForMessage(message);
          feeValue = feeInfo.value ?? null;
        }

        if (active) {
          setFeeLamports(feeValue);
        }
      } catch {
        if (active) {
          setFeeLamports(null);
        }
      } finally {
        if (active) {
          setFeeLoading(false);
        }
      }
    };

    fetchFee();
    intervalId = window.setInterval(fetchFee, 15000);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [open, publicKey, recipientAddress]);

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, currentBalance - estimatedFee);
    setAmount(maxAmount.toFixed(6));
  };

  const handleWithdraw = () => {
    const newErrors = { address: '', amount: '' };
    
    if (recipientAddress.length < 32) {
      newErrors.address = 'Invalid Solana address';
    }
    
    if (numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (totalCost > currentBalance) {
      newErrors.amount = 'Insufficient balance (including fees)';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.address && !newErrors.amount) {
      setPendingWithdrawal({ amount: numAmount, recipient: recipientAddress });
      setShowTransactionModal(true);
    }
  };

  const handleTransactionSign = async (reportState: (state: 'broadcasting') => void) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Connect your wallet before sending SOL.');
    }

    if (!pendingWithdrawal) {
      throw new Error('Missing withdrawal details.');
    }

    const { amount: pendingAmount, recipient } = pendingWithdrawal;

    let recipientPublicKey: PublicKey;
    try {
      recipientPublicKey = new PublicKey(recipient);
    } catch {
      throw new Error('Invalid Solana address');
    }

    const latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: publicKey,
      recentBlockhash: latestBlockhash.blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPublicKey,
        lamports: Math.round(pendingAmount * LAMPORTS_PER_SOL),
      })
    );

    const signature = await sendTransaction(transaction, connection);
    reportState('broadcasting');
    await connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      'finalized'
    );
    return signature;
  };

  const handleTransactionSuccess = () => {
    toast.success('Withdrawal sent', {
      description: `Your transaction has been confirmed on ${network}.`,
    });
    setAmount('');
    setRecipientAddress('');
    setPendingWithdrawal(null);
    setShowTransactionModal(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-[#06B6D4]/20 w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
          {/* Custom Close Button - More Visible */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-white/10 hover:bg-red-500/80 border border-white/20 hover:border-red-500 rounded-lg p-2 transition-all duration-300 group"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-white group-hover:text-white transition-colors" />
          </button>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white text-xl">
              <div className="p-2 bg-[#06B6D4]/20 rounded-lg">
                <ArrowUpFromLine className="w-5 h-5 text-[#06B6D4]" />
              </div>
              Withdraw SOL
            </DialogTitle>
            <DialogDescription className="sr-only">
              Withdraw SOL from your wallet to another Solana address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Current Balance */}
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm rounded-lg"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Available Balance</p>
                <p className="text-2xl text-[#00FFA3]">{currentBalance.toFixed(6)} SOL</p>
              </div>
            </div>

            {/* Network selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300 uppercase tracking-wider">Network</label>
              <Select value={network} disabled>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="devnet" className="text-white hover:bg-white/10">
                    Devnet (Testing)
                  </SelectItem>
                  <SelectItem value="mainnet" className="text-white hover:bg-white/10">
                    Mainnet (Real SOL)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Address */}
            <WalletInput
              label="Recipient Address"
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter Solana address"
              error={errors.address}
              required
            />

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300 uppercase tracking-wider">
                Amount (SOL) <span className="text-[#00FFA3]">*</span>
              </label>
              <button
                onClick={handleMaxAmount}
                className="text-xs text-[#00FFA3] hover:text-[#06B6D4] transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg blur-sm"></div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="relative w-full bg-white/5 backdrop-blur-lg border border-white/10 focus:border-[#00FFA3] text-white px-4 py-3 rounded-lg outline-none transition-all placeholder:text-gray-500"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.amount}
              </p>
            )}
          </div>

          {/* Transaction Summary */}
          {numAmount > 0 && (
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-white/10 to-white/5 blur-sm rounded-lg"></div>
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Amount</span>
                  <span className="text-white">{numAmount.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Network Fee</span>
                  <span className="text-white">
                    {feeLoading ? '...' : feeLamports == null ? '—' : `${estimatedFee.toFixed(6)} SOL`}
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>
                <div className="flex justify-between">
                  <span className="text-white">Total</span>
                  <span className={totalCost > currentBalance ? 'text-red-400' : 'text-[#00FFA3]'}>
                    {totalCost.toFixed(6)} SOL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <WalletAlert variant="danger" title="Double-check before sending">
            <ul className="space-y-1 mt-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Verify the recipient address is correct</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Transactions cannot be reversed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Ensure you're on the correct network</span>
              </li>
            </ul>
          </WalletAlert>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <WalletButton onClick={onClose} variant="secondary">
                Cancel
              </WalletButton>
              <WalletButton 
                onClick={handleWithdraw} 
                variant="primary"
                disabled={!canWithdraw}
                icon={Send}
              >
                Send
              </WalletButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={(isOpen) => {
          setShowTransactionModal(isOpen);
          if (!isOpen) {
            setPendingWithdrawal(null);
          }
        }}
        autoStart
        onConfirm={handleTransactionSuccess}
        onCancel={() => {
          setShowTransactionModal(false);
          setPendingWithdrawal(null);
        }}
        onFailure={(message) => toast.error(message)}
        onSign={handleTransactionSign}
        stakeAmount={pendingWithdrawal?.amount ?? numAmount}
        estimatedFee={estimatedFee}
        transactionType="withdrawal"
        recipientAddress={pendingWithdrawal?.recipient ?? recipientAddress}
        network={network === 'mainnet' ? 'mainnet-beta' : 'devnet'}
        successActionLabel="Close"
        successDescription="Your withdrawal has been confirmed."
      />
    </>
  );
}
