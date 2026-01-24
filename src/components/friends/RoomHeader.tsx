import { Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { copyToClipboard } from '../../utils/clipboard';

interface RoomHeaderProps {
  roomCode: string;
  className?: string;
}

export function RoomHeader({ roomCode, className }: RoomHeaderProps) {
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
    <div className={cn("relative w-full max-w-full overflow-hidden", className)}>
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
        
        <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left side - Game mode and icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-2 sm:p-2.5 rounded-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B0F1A]" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h3 className="text-white font-bold tracking-wider text-sm sm:text-base">FRIEND</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">Custom match</p>
            </div>
          </div>

          {/* Right side - Label + Room code + Copy */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            
            {/* Label - Presunutý sem a zafarbený na fialovo */}
            <span className="text-[10px] sm:text-xs font-bold text-[#7C3AED] uppercase tracking-wider whitespace-nowrap">
              Room code
            </span>
            
            {/* Code Box */}
            <div className="bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#00FFA3]/20 min-w-0">
              <span className="text-sm sm:text-base font-mono tracking-[0.15em] text-[#00FFA3] drop-shadow-[0_0_6px_rgba(0,255,163,0.4)] truncate block">
                {roomCode}
              </span>
            </div>
            
            {/* Copy Button */}
            <Button
              onClick={copyRoomCode}
              size="sm"
              className="bg-white/5 hover:bg-white/10 border border-[#00FFA3]/30 hover:border-[#00FFA3] text-white transition-all h-8 w-8 sm:h-10 sm:w-10 p-0 flex-shrink-0 rounded-lg"
              aria-label="Copy room code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FFA3]" />
              ) : (
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}