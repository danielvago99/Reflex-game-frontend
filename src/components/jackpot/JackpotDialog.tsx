import { Trophy, Wallet, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface JackpotDialogProps {
  open: boolean;
  onClose: () => void;
}

const JACKPOT_VAULT_ADDRESS = '9oX2h8rVx8TzHnQZV9TQ1u1g8P7B1wTnQq2x9ZfJp1gA';
const JACKPOT_POOL_SOL = 30.47;
const JACKPOT_TARGET_SOL = 50;
const JACKPOT_ENTRIES = 1843;
const JACKPOT_WIN_STREAK = 5;

export function JackpotDialog({ open, onClose }: JackpotDialogProps) {
  const progressPercent = Math.min((JACKPOT_POOL_SOL / JACKPOT_TARGET_SOL) * 100, 100);
  const vaultLink = `https://solscan.io/account/${JACKPOT_VAULT_ADDRESS}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-2 border-[#7C3AED]/40 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(124,58,237,0.3)]">
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
            Track the live prize pool, winning conditions, and progress toward the next jackpot draw.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Actual Prize Pool</p>
              <p className="text-2xl font-semibold text-[#00FFA3]">{JACKPOT_POOL_SOL.toFixed(2)} SOL</p>
              <p className="text-xs text-gray-400 mt-1">Target: {JACKPOT_TARGET_SOL} SOL</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Entries</p>
              <p className="text-2xl font-semibold text-white">{JACKPOT_ENTRIES.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Across all staked matches</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#00FFA3]/20 bg-[#0B0F1A]/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-white">
                <Zap className="w-4 h-4 text-[#00FFA3]" />
                Progress to next draw
              </div>
              <span className="text-xs text-gray-400">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {JACKPOT_POOL_SOL.toFixed(2)} SOL funded · {Math.max(JACKPOT_TARGET_SOL - JACKPOT_POOL_SOL, 0).toFixed(2)} SOL to go
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
                  Win {JACKPOT_WIN_STREAK} consecutive staked matches in a single session.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7C3AED]"></span>
                  Rank top 1 in daily reflex score during the jackpot window.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#06B6D4]"></span>
                  Jackpot draws once the pool reaches the target and a qualifying winner is found.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
