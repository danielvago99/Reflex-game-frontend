import { Users, Copy, Check, Lock, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { copyToClipboard } from '../../utils/clipboard';

interface RoomHeaderProps {
  roomCode: string;
  isPrivate?: boolean;
  stakeAmount?: number;
  className?: string;
  onClose?: () => void;
}

export function RoomHeader({
  roomCode,
  isPrivate = true,
  stakeAmount,
  className,
  onClose,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied!');
    } else {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Outer glow */}
      <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}></div>
      
      <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
        
        {/* Corner indicators */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FFA3]/50"></div>
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4]/50"></div>
        
        {/* Scan line animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFA3]/5 to-transparent animate-pulse"></div>
        
        <div className="relative p-4 flex items-center justify-between gap-4">
          {/* Left side - Game mode and icon */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-2.5 rounded-lg">
                <Users className="w-5 h-5 text-[#0B0F1A]" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white">1v1 — Friends</h3>
                {isPrivate && (
                  <Badge className="bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/50 backdrop-blur-sm text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Custom match</p>
            </div>
          </div>

          {/* Right side - Room code */}
          <div className="flex items-center gap-4">
            {typeof stakeAmount === 'number' && (
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Stake</p>
                <div className="bg-gradient-to-r from-[#7C3AED]/10 to-[#06B6D4]/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#7C3AED]/30">
                  <span className="text-sm text-[#7C3AED]">{stakeAmount.toFixed(2)} SOL</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Room</p>
                <div className="bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#00FFA3]/20">
                  <span className="text-sm tracking-[0.2em] text-[#00FFA3] drop-shadow-[0_0_6px_rgba(0,255,163,0.4)]">
                    {roomCode}
                  </span>
                </div>
              </div>

              <Button
                onClick={copyRoomCode}
                size="sm"
                className="bg-white/5 hover:bg-white/10 border border-[#00FFA3]/30 hover:border-[#00FFA3] text-white transition-all h-9 w-9 p-0"
                aria-label="Copy room code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#00FFA3]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>

              {onClose && (
                <Button
                  onClick={onClose}
                  size="sm"
                  className="bg-white/5 hover:bg-white/10 border border-white/20 text-white transition-all h-9 w-9 p-0"
                  aria-label="Close lobby"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
