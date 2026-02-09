import { Play, Trophy, Wallet, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { WalletButton } from '../wallet/WalletButton';
import { useJackpotProgress } from '../../hooks/useJackpotProgress';

interface JackpotDialogProps {
  open: boolean;
  onClose: () => void;
}

const JACKPOT_VAULT_ADDRESS = '9oX2h8rVx8TzHnQZV9TQ1u1g8P7B1wTnQq2x9ZfJp1gA';
const JACKPOT_POOL_SOL = 30.47;
const JACKPOT_REQUIRED_STREAK = 10;

export function JackpotDialog({ open, onClose }: JackpotDialogProps) {
  const navigate = useNavigate();
  const { data: jackpotProgress } = useJackpotProgress(open);
  const currentWinStreak = jackpotProgress?.currentWinStreak ?? 0;
  const progressPercent = Math.min((currentWinStreak / JACKPOT_REQUIRED_STREAK) * 100, 100);
  const vaultLink = `https://solscan.io/account/${JACKPOT_VAULT_ADDRESS}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-2 border-[#7C3AED]/40 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(124,58,237,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-white/10 hover:bg-red-500/80 border border-white/20 hover:border-red-500 rounded-lg p-2 transition-all duration-300 group"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-white group-hover:text-white transition-colors" />
        </button>
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.4) 0, transparent 45%), radial-gradient(circle at 80% 0%, rgba(0,255,163,0.3) 0, transparent 50%)'
        }}></div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40">
              <Trophy className="w-5 h-5 text-[#C4B5FD]" />
            </div>
            <DialogTitle className="text-white text-2xl">Jackpot Details</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-sm mt-2">
            Track the live prize pool, win-streak progress, and verification steps for the skill-based jackpot.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Actual Prize Pool</p>
              <p className="text-2xl font-semibold text-[#00FFA3]">{JACKPOT_POOL_SOL.toFixed(2)} SOL</p>
              <p className="text-xs text-gray-400 mt-1">Pool grows until a winner is verified.</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#00FFA3]/20 bg-[#0B0F1A]/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-white">
                <Zap className="w-4 h-4 text-[#00FFA3]" />
                Win streak progress
              </div>
              <span className="text-xs text-gray-400">
                {currentWinStreak}/{JACKPOT_REQUIRED_STREAK} wins
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {currentWinStreak} consecutive wins so far · {Math.max(JACKPOT_REQUIRED_STREAK - currentWinStreak, 0)} to jackpot
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-[#00FFA3]/10 border border-[#00FFA3]/30">
                <Wallet className="w-4 h-4 text-[#00FFA3]" />
              </div>
              <div>
                <p className="text-sm text-white">Jackpot Vault (Solscan)</p>
                <a
                  href={vaultLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#7C3AED] hover:text-[#C4B5FD] break-all"
                >
                  {JACKPOT_VAULT_ADDRESS}
                </a>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Winning Conditions</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#00FFA3]"></span>
                  Win {JACKPOT_REQUIRED_STREAK} consecutive staked matches with a 0.2 SOL stake.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7C3AED]"></span>
                  Matches are manually verified and backchecked before payout.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#06B6D4]"></span>
                  Prize pool keeps growing until a verified winner claims it.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <WalletButton
            onClick={() => {
              onClose();
              navigate('/lobby');
            }}
            variant="primary"
            icon={Play}
          >
            Play Game
          </WalletButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
