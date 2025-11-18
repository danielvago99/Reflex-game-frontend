import { AlertTriangle, LogOut, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface ForfeitConfirmDialogProps {
  isRanked: boolean;
  stakeAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ForfeitConfirmDialog({ 
  isRanked, 
  stakeAmount, 
  onConfirm, 
  onCancel 
}: ForfeitConfirmDialogProps) {
  const hasStake = isRanked && stakeAmount > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-lg px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md w-full"
      >
        {/* Glow effect - Red/Warning theme */}
        <div className="absolute -inset-4 bg-gradient-to-r from-red-500/40 via-orange-500/40 to-red-500/40 rounded-3xl blur-2xl"></div>
        
        {/* Dialog container */}
        <div className="relative bg-gradient-to-br from-[#0B0F1A] via-[#1a0f1a] to-[#0B0F1A] border-2 border-red-500/30 rounded-3xl p-8 shadow-2xl">
          {/* Warning icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full border-2 border-red-500/50 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl text-center mb-3 text-white">
            Forfeit Match?
          </h2>
          
          {/* Description */}
          <div className="space-y-3 mb-8">
            <p className="text-center text-gray-300">
              {hasStake 
                ? "Leaving will forfeit this match and you'll lose your stake!"
                : "Leaving will forfeit this match and count as a loss!"
              }
            </p>

            {hasStake && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Your Stake:</span>
                  <span className="text-red-400">{stakeAmount} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Status if you leave:</span>
                  <span className="text-red-400">Lost</span>
                </div>
              </div>
            )}

            {isRanked && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-orange-400 text-sm text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  This will count as a loss in your ranked stats
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {/* Cancel button - Primary */}
            <Button
              onClick={onCancel}
              className="w-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] h-12 transition-all"
            >
              <X className="w-5 h-5 mr-2" />
              Stay in Match
            </Button>

            {/* Confirm forfeit button - Destructive */}
            <Button
              onClick={onConfirm}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 text-red-400 hover:text-red-300 h-12 transition-all"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {hasStake ? `Forfeit & Lose ${stakeAmount} SOL` : 'Forfeit Match'}
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            {hasStake 
              ? "Your opponent will win the match and receive the prize pool"
              : "This action cannot be undone"
            }
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
