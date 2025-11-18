import { useState, useEffect } from 'react';
import { Users, Link, Copy, Check, QrCode, Lock, Eye, Coins, Zap, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { copyToClipboard } from '../../utils/clipboard';
import { getFreeStakes, FreeStake } from '../../utils/reflexPoints';
import {
  createRoom,
  subscribeToRoom,
  updatePlayerReady,
  updateRoomStake,
  leaveRoom,
  getCurrentUser,
  type Room
} from '../../utils/roomManager';

interface FriendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartMatch: () => void;
}

// Generate random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function FriendInviteDialog({ open, onOpenChange, onStartMatch }: FriendInviteDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [stakeError, setStakeError] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [freeStakes, setFreeStakes] = useState<FreeStake[]>([]);
  const [selectedFreeStake, setSelectedFreeStake] = useState<string | null>(null);
  const [useFreeStakeMode, setUseFreeStakeMode] = useState(false);

  const currentUser = getCurrentUser();

  // Generate room code and create room when dialog opens
  useEffect(() => {
    if (open) {
      const code = generateRoomCode();
      setRoomCode(code);
      setCopiedLink(false);
      setCopiedCode(false);
      setShowQR(false);
      setStakeAmount('0.1');
      setStakeError('');

      // Create room
      const newRoom = createRoom(code, currentUser.id, currentUser.username, stakeAmount, isPrivate);
      setRoom(newRoom);

      // Subscribe to room updates
      const unsubscribe = subscribeToRoom(code, (updatedRoom) => {
        setRoom(updatedRoom);
      });

      return () => {
        unsubscribe();
        // Leave room when dialog closes
        if (!open) {
          leaveRoom(code, currentUser.id);
        }
      };
    }
  }, [open, currentUser.id, currentUser.username, isPrivate]);

  // Clean up room when dialog closes
  useEffect(() => {
    if (!open && roomCode) {
      leaveRoom(roomCode, currentUser.id);
    }
  }, [open, roomCode, currentUser.id]);

  // Fetch free stakes when dialog opens
  useEffect(() => {
    if (open) {
      setFreeStakes(getFreeStakes());
    }
  }, [open]);

  const inviteLink = `https://app.reflex.game/room/${roomCode}`;

  const handleCopy = async (text: string, type: 'link' | 'code') => {
    const success = await copyToClipboard(text);
    if (success) {
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast.success(`${type === 'link' ? 'Link' : 'Code'} copied to clipboard!`);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStakeAmount(value);
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0.05) {
      setStakeError('Minimum stake is 0.05 SOL');
    } else {
      setStakeError('');
      // Update room stake
      if (roomCode) {
        updateRoomStake(roomCode, value);
      }
    }
  };

  const handleToggleReady = () => {
    if (roomCode && currentUser.id) {
      // Directly update using the current user ID (host)
      updatePlayerReady(roomCode, currentUser.id, !(hostPlayer?.isReady || false));
    }
  };

  const isValidStake = !stakeError && parseFloat(stakeAmount) >= 0.05;
  const hostPlayer = room?.players.find(p => p.isHost);
  const guestPlayer = room?.players.find(p => !p.isHost);
  const bothReady = hostPlayer?.isReady && guestPlayer?.isReady;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-[#00FFA3]/30 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,163,0.3)]">
        {/* Custom Close Button - More Visible */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-white/10 hover:bg-red-500/80 border border-white/20 hover:border-red-500 rounded-lg p-2 transition-all duration-300 group"
          aria-label="Close dialog"
        >
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:text-white transition-colors"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#00FFA3] opacity-10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-md opacity-60"></div>
              <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] p-3 rounded-lg">
                <Users className="w-6 h-6 text-[#0B0F1A]" />
              </div>
            </div>
            <DialogTitle className="text-white text-2xl">Private Room Created</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Create a private room to play with your friends. Set your stake, share the room code, and wait for players to join.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 space-y-5 mt-4">
          {/* Room Code Display */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/30 to-[#06B6D4]/30 blur-sm" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}></div>
            
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-gray-300 text-sm uppercase tracking-wider">Room Code</Label>
                  <Badge className="bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/50 backdrop-blur-sm">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gradient-to-r from-[#00FFA3]/10 to-[#06B6D4]/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-[#00FFA3]/20">
                    <span className="text-3xl tracking-[0.3em] text-[#00FFA3] drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]">
                      {roomCode}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => handleCopy(roomCode, 'code')}
                    className="bg-white/5 hover:bg-white/10 border border-[#00FFA3]/30 hover:border-[#00FFA3] text-white transition-all h-[56px] px-4"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-[#00FFA3]" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm uppercase tracking-wider">Share Link</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                <span className="text-sm text-gray-300 break-all">{inviteLink}</span>
              </div>
              <Button
                onClick={() => handleCopy(inviteLink, 'link')}
                className="bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] text-[#0B0F1A] transition-all"
              >
                {copiedLink ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
              </Button>
              <Button
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "bg-white/5 hover:bg-white/10 border border-[#06B6D4]/30 hover:border-[#06B6D4] text-white transition-all",
                  showQR && "bg-[#06B6D4]/20 border-[#06B6D4]"
                )}
              >
                <QrCode className="w-5 h-5" />
              </Button>
            </div>
            
            {showQR && (
              <Alert className="bg-white/5 border-[#06B6D4]/30 backdrop-blur-sm">
                <QrCode className="w-4 h-4 text-[#06B6D4]" />
                <AlertDescription className="text-gray-300 text-sm">
                  QR code feature coming soon. Share the link or code for now.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="w-4 h-4 text-[#7C3AED]" /> : <Eye className="w-4 h-4 text-[#00FFA3]"/>}
              <div>
                <Label className="text-white text-sm cursor-pointer">
                  {isPrivate ? 'Private Room' : 'Visible to Friends'}
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isPrivate ? 'Only accessible via code' : 'Friends can see and join'}
                </p>
              </div>
            </div>
            <Switch
              checked={!isPrivate}
              onCheckedChange={(checked) => setIsPrivate(!checked)}
              className="data-[state=checked]:bg-[#00FFA3]"
            />
          </div>

          {/* Custom Stake Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#00FFA3]"/>
                Custom Match Stake
              </Label>
              <Badge className="bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/50 backdrop-blur-sm text-xs">
                ✏️ Customizable
              </Badge>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/30 to-[#7C3AED]/30 blur-sm rounded-xl"></div>
              
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent"></div>
                
                <div className="flex items-center px-4 py-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.05"
                    value={stakeAmount}
                    onChange={handleStakeChange}
                    className={cn(
                      "bg-transparent border-0 text-2xl text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1",
                      stakeError && "text-red-400"
                    )}
                    placeholder="0.05"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#00FFA3]/20 to-[#7C3AED]/20 rounded-lg border border-[#00FFA3]/30">
                    <Coins className="w-5 h-5 text-[#00FFA3]"/>
                    <span className="text-[#00FFA3]">SOL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              {stakeError ? (
                <span className="text-red-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  {stakeError}
                </span>
              ) : (
                <span className="text-gray-500">
                  Minimum: 0.05 SOL • Enter your preferred stake
                </span>
              )}
              {isValidStake && (
                <span className="text-[#00FFA3] flex items-center gap-1">
                  <Check className="w-3 h-3"/>
                  Valid stake
                </span>
              )}
            </div>

            {/* Stake Info Alert */}
            <Alert className="bg-[#00FFA3]/10 border-[#00FFA3]/30 backdrop-blur-sm">
              <Coins className="w-4 h-4 text-[#00FFA3]"/>
              <AlertDescription className="text-gray-300 text-sm">
                💰 Winner takes {(parseFloat(stakeAmount || '0') * 2 * 0.85).toFixed(2)} SOL after staking fee
              </AlertDescription>
            </Alert>

            {/* Free Stakes Section */}
            {freeStakes.length > 0 && (
              <div className="pt-4 mt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-[#7C3AED]/20 rounded-lg">
                    <Zap className="w-4 h-4 text-[#7C3AED]"/>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-white uppercase tracking-wider">Use Free Stake</h4>
                    <p className="text-xs text-gray-400">From Reflex Points rewards</p>
                  </div>
                  <div className="px-3 py-1 bg-gradient-to-r from-[#7C3AED]/20 to-[#00FFA3]/20 rounded-full border border-[#7C3AED]/30">
                    <span className="text-xs text-white font-medium">{freeStakes.length} available</span>
                  </div>
                </div>

                {/* Group stakes by amount */}
                {(() => {
                  const grouped = freeStakes.reduce((acc, stake) => {
                    const key = stake.amount.toString();
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(stake);
                    return acc;
                  }, {} as Record<string, typeof freeStakes>);

                  return (
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(grouped).map(([amount, stakes]) => {
                        const stakeAmount = parseFloat(amount);
                        const isSelected = stakes.some(s => s.id === selectedFreeStake);
                        const selectedStakeInGroup = stakes.find(s => s.id === selectedFreeStake);
                        
                        // Color scheme based on amount
                        const colors = stakeAmount === 0.05 
                          ? { from: '#00FFA3', to: '#06B6D4', text: 'text-[#00FFA3]', bg: 'bg-[#00FFA3]' }
                          : stakeAmount === 0.1 || stakeAmount === 0.10
                          ? { from: '#7C3AED', to: '#00FFA3', text: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]' }
                          : { from: '#06B6D4', to: '#7C3AED', text: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]' };

                        return (
                          <button
                            key={amount}
                            onClick={() => {
                              if (selectedStakeInGroup) {
                                // Deselect if already selected
                                setSelectedFreeStake(null);
                                setUseFreeStakeMode(false);
                              } else {
                                // Select the first stake in this group
                                setStakeAmount(stakes[0].amount.toString());
                                setSelectedFreeStake(stakes[0].id);
                                setUseFreeStakeMode(true);
                                // Update room stake
                                if (roomCode) {
                                  updateRoomStake(roomCode, stakes[0].amount.toString());
                                }
                              }
                            }}
                            className="relative group"
                          >
                            {isSelected ? (
                              <>
                                {/* Selected state - Enhanced glow */}
                                <div 
                                  className="absolute -inset-1 blur-lg opacity-60 animate-pulse"
                                  style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                                ></div>
                                
                                <div 
                                  className="relative border-2 rounded-xl p-4 shadow-xl"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                                    borderColor: colors.from
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                      <Ticket className="w-5 h-5 text-white"/>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg text-white font-bold">{stakeAmount}</div>
                                      <div className="text-[10px] text-white/90 uppercase tracking-wide">SOL</div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full">
                                      <span className="text-[10px] text-white font-medium">×{stakes.length}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Unselected state */}
                                <div 
                                  className="absolute -inset-1 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300"
                                  style={{ background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}20)` }}
                                ></div>
                                
                                <div 
                                  className="relative backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 group-hover:scale-105"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${colors.from}10, ${colors.to}10)`,
                                    borderColor: `${colors.from}30`
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <div 
                                      className="p-2 backdrop-blur-sm rounded-lg"
                                      style={{ backgroundColor: `${colors.from}20` }}
                                    >
                                      <Ticket className="w-5 h-5" style={{ color: colors.from }}/>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg text-white">{stakeAmount}</div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">SOL</div>
                                    </div>
                                    <div 
                                      className="px-2 py-0.5 backdrop-blur-sm rounded-full"
                                      style={{ backgroundColor: `${colors.from}20` }}
                                    >
                                      <span className="text-[10px] font-medium" style={{ color: colors.from }}>×{stakes.length}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>
            )}
          </div>

          {/* Player Status */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 blur-sm rounded-xl"></div>
            
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-300 text-sm uppercase tracking-wider">Players</Label>
                <span className="text-xs text-gray-400">{room?.players.length || 1} / 2</span>
              </div>
              
              <div className="space-y-3">
                {/* Host (You) */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#00FFA3]/10 to-transparent backdrop-blur-sm px-4 py-3 rounded-lg border border-[#00FFA3]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#0B0F1A]" />
                    </div>
                    <div>
                      <p className="text-white text-sm">{hostPlayer?.username || 'You'} (Creator)</p>
                      <p className="text-xs text-gray-400">@{String(hostPlayer?.id || '').substring(0, 10)}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-xs backdrop-blur-sm",
                    hostPlayer?.isReady
                      ? "bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/50"
                      : "bg-white/10 text-gray-400 border-white/20"
                  )}>
                    {hostPlayer?.isReady ? 'Ready' : 'Not Ready'}
                  </Badge>
                </div>

                {/* Guest */}
                {guestPlayer ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#06B6D4]/10 to-transparent backdrop-blur-sm px-4 py-3 rounded-lg border border-[#06B6D4]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-sm">{guestPlayer.username}</p>
                        <p className="text-xs text-gray-400">@{String(guestPlayer.id).substring(0, 10)}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-xs backdrop-blur-sm",
                      guestPlayer.isReady
                        ? "bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/50"
                        : "bg-white/10 text-gray-400 border-white/20"
                    )}>
                      {guestPlayer.isReady ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </div>
                ) : (
                <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border-2 border-dashed border-white/20">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Waiting for friend...</p>
                      <p className="text-xs text-gray-500">Share the code to invite</p>
                    </div>
                  </div>
                  <Badge className="bg-white/10 text-gray-400 border-white/20 text-xs backdrop-blur-sm">
                    Not Ready
                  </Badge>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleToggleReady}
              className={cn(
                "flex-1 transition-all duration-300",
                hostPlayer?.isReady
                  ? "bg-[#00FFA3]/20 hover:bg-[#00FFA3]/30 border-2 border-[#00FFA3] text-[#00FFA3] shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                  : "bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-[#00FFA3]/50 text-white"
              )}
            >
              {hostPlayer?.isReady ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  I'm Ready
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Mark Ready
                </>
              )}
            </Button>

            <Button
              onClick={onStartMatch}
              disabled={!bothReady}
              className={cn(
                "flex-1 transition-all duration-300",
                bothReady
                  ? "bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A]"
                  : "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
              )}
            >
              Start Match
            </Button>
          </div>

          {!bothReady && (
            <p className="text-center text-xs text-gray-500">
              Both players must be ready to start the match
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}