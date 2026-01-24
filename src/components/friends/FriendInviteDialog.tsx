import { useState, useEffect } from 'react';
import { Users, Link, Check, QrCode, Lock, Eye, Coins, Zap, Ticket } from 'lucide-react';
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
import { RoomHeader } from './RoomHeader';
import { useWebSocket, useWebSocketEvent } from '../../hooks/useWebSocket';

interface FriendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomInfo?: { sessionId: string; roomCode: string; stakeAmount: number } | null;
  onRoomCreated?: (room: { sessionId: string; roomCode: string; stakeAmount: number } | null) => void;
}

const MAX_FRIEND_STAKE = 10;

export function FriendInviteDialog({ open, onOpenChange, roomInfo, onRoomCreated }: FriendInviteDialogProps) {
  const [isPrivate, setIsPrivate] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [stakeError, setStakeError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [freeStakes, setFreeStakes] = useState<FreeStake[]>([]);
  const [selectedFreeStake, setSelectedFreeStake] = useState<string | null>(null);
  const [, setUseFreeStakeMode] = useState(false);

  const { send, isConnected } = useWebSocket({ autoConnect: true });

  useEffect(() => {
    if (open) {
      setCopiedLink(false);
      setShowQR(false);
      setStakeAmount('0.1');
      setStakeError('');
      setRoomCode('');
      setSessionId('');
      setIsCreating(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && roomInfo) {
      setRoomCode(roomInfo.roomCode);
      setSessionId(roomInfo.sessionId);
      setStakeAmount(roomInfo.stakeAmount.toString());
    }
  }, [open, roomInfo]);

  // Fetch free stakes when dialog opens
  useEffect(() => {
    if (open) {
      setFreeStakes(getFreeStakes());
    }
  }, [open]);

  const inviteLink = roomCode ? `https://app.reflex.game/room/${roomCode}` : '';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && roomCode && sessionId) {
      if (isConnected) {
        send('friend:room_closed', { sessionId, roomCode, reason: 'host_exit' });
      }
      onRoomCreated?.(null);
      setRoomCode('');
      setSessionId('');
      setIsCreating(false);
    }

    onOpenChange(nextOpen);
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStakeAmount(value);
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setStakeError('Stake must be greater than 0 SOL');
    } else if (numValue > MAX_FRIEND_STAKE) {
      setStakeError(`Maximum stake is ${MAX_FRIEND_STAKE} SOL`);
    } else {
      setStakeError('');
    }
  };

  const handleCreateRoom = () => {
    if (!isConnected) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }

    const numericStake = parseFloat(stakeAmount);
    if (isNaN(numericStake) || numericStake <= 0 || numericStake > MAX_FRIEND_STAKE) {
      setStakeError(`Stake must be between 0 and ${MAX_FRIEND_STAKE} SOL`);
      return;
    }

    setIsCreating(true);
    send('friend:create_room', { stakeAmount: numericStake });
  };

  useWebSocketEvent<{ sessionId: string; roomCode: string; stakeAmount: number }>(
    'friend:room_created',
    payload => {
      if (!open) return;
      setRoomCode(payload.roomCode);
      setSessionId(payload.sessionId);
      setStakeAmount(payload.stakeAmount.toString());
      setIsCreating(false);
      onRoomCreated?.(payload);
      toast.success('Room created! Share the code with your friend.');
    },
    [open, onRoomCreated],
  );

  useWebSocketEvent<{ message?: string }>(
    'friend:error',
    payload => {
      if (!open) return;
      setIsCreating(false);
      toast.error(payload?.message ?? 'Unable to create room.');
    },
    [open],
  );

  useWebSocketEvent<{ message?: string }>(
    'friend:room_closed',
    payload => {
      if (!open) return;
      setRoomCode('');
      setSessionId('');
      setIsCreating(false);
      onRoomCreated?.(null);
      toast.error(payload?.message ?? 'Room closed. Please create a new room.');
    },
    [open, onRoomCreated],
  );

  const isValidStake = !stakeError && parseFloat(stakeAmount) > 0 && parseFloat(stakeAmount) <= MAX_FRIEND_STAKE;
  const showRoomDetails = Boolean(roomCode && sessionId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-[#00FFA3]/30 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,163,0.3)]">
        {/* Custom Close Button - More Visible */}
        <button
          onClick={() => handleOpenChange(false)}
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
            <DialogTitle className="text-white text-2xl">Create Private Room</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Create a private room to play with your friends. Set your stake, share the room code, and wait for players to join.
          </DialogDescription>
        </DialogHeader>

          <div className="relative z-10 space-y-5 mt-4">
          {showRoomDetails && (
            <RoomHeader roomCode={roomCode} stakeAmount={parseFloat(stakeAmount)} />
          )}

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
                    disabled={Boolean(roomCode)}
                    className={cn(
                      "bg-transparent border-0 text-2xl text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1",
                      stakeError && "text-red-400",
                      roomCode && "opacity-60"
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
                  Enter your preferred stake (max {MAX_FRIEND_STAKE} SOL)
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
                              if (roomCode) return;
                              if (selectedStakeInGroup) {
                                // Deselect if already selected
                                setSelectedFreeStake(null);
                                setUseFreeStakeMode(false);
                              } else {
                                // Select the first stake in this group
                                setStakeAmount(stakes[0].amount.toString());
                                setSelectedFreeStake(stakes[0].id);
                                setUseFreeStakeMode(true);
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

          {showRoomDetails && (
            <Alert className="bg-white/5 border-[#00FFA3]/30 backdrop-blur-sm">
              <Users className="w-4 h-4 text-[#00FFA3]" />
              <AlertDescription className="text-gray-300 text-sm">
                Waiting for your friend to join. Share the room code or invite link above.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex-1 transition-all duration-300",
                "bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-[#00FFA3]/50 text-white"
              )}
            >
              Close
            </Button>

            <Button
              onClick={handleCreateRoom}
              disabled={!isValidStake || Boolean(roomCode) || isCreating}
              className={cn(
                "flex-1 transition-all duration-300",
                !isValidStake || roomCode
                  ? "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A]"
              )}
            >
              {roomCode ? 'Room Ready' : isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </div>

          {!roomCode && (
            <p className="text-center text-xs text-gray-500">
              Create the room to generate a shareable code.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
