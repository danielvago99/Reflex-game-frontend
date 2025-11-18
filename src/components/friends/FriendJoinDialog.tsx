import { useState, useEffect } from 'react';
import { Users, LogIn, AlertCircle, Check, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import {
  joinRoom,
  subscribeToRoom,
  updatePlayerReady,
  leaveRoom,
  getCurrentUser,
  getRoom,
  type Room
} from '../../utils/roomManager';

interface FriendJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess: (roomCode: string) => void;
}

export function FriendJoinDialog({ open, onOpenChange, onJoinSuccess }: FriendJoinDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  const currentUser = getCurrentUser();

  // Subscribe to room updates when joined
  useEffect(() => {
    if (hasJoined && roomCode) {
      const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
        setRoom(updatedRoom);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [hasJoined, roomCode]);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      if (hasJoined && roomCode) {
        leaveRoom(roomCode, currentUser.id);
      }
      setRoomCode('');
      setError('');
      setHasJoined(false);
      setRoom(null);
    }
  }, [open, hasJoined, roomCode, currentUser.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(value);
    setError('');
  };

  const handleJoinRoom = async () => {
    // Validate room code
    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setIsJoining(true);

    // Try to join the room
    setTimeout(() => {
      const joinedRoom = joinRoom(roomCode, currentUser.id, currentUser.username);

      if (joinedRoom) {
        toast.success('Successfully joined room!');
        setRoom(joinedRoom);
        setHasJoined(true);
        setError('');
      } else {
        setError('Room not found or is full. Please check the code and try again.');
      }

      setIsJoining(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 6 && !hasJoined) {
      handleJoinRoom();
    }
  };

  const handleToggleReady = () => {
    if (room && roomCode) {
      const guestPlayer = room.players.find(p => !p.isHost);
      if (guestPlayer) {
        updatePlayerReady(roomCode, guestPlayer.id, !guestPlayer.isReady);
      }
    }
  };

  const handleStartMatch = () => {
    if (bothReady) {
      onJoinSuccess(roomCode);
    }
  };

  const hostPlayer = room?.players.find(p => p.isHost);
  const guestPlayer = room?.players.find(p => !p.isHost);
  const bothReady = hostPlayer?.isReady && guestPlayer?.isReady;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-[#06B6D4]/30 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)]">
        {/* Custom Close Button */}
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
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-[#06B6D4] opacity-10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] blur-md opacity-60"></div>
              <div className="relative bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] p-3 rounded-lg">
                {hasJoined ? <Users className="w-6 h-6 text-white" /> : <LogIn className="w-6 h-6 text-white" />}
              </div>
            </div>
            <div>
              <DialogTitle className="text-white text-2xl">
                {hasJoined ? 'Room Joined' : "Join Friend's Room"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-1">
                {hasJoined ? 'Waiting for both players to be ready' : 'Enter the 6-digit room code to join'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-10 space-y-5 mt-4">
          {!hasJoined ? (
            <>
              {/* Room Code Input */}
              <div className="space-y-3">
                <Label className="text-gray-300 text-sm uppercase tracking-wider">Room Code</Label>
                
                <div className="relative">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#06B6D4]/30 to-[#7C3AED]/30 blur-sm rounded-xl"></div>
                  
                  <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent"></div>
                    
                    <Input
                      type="text"
                      placeholder="ABC123"
                      value={roomCode}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      maxLength={6}
                      className="bg-transparent border-0 text-center text-3xl tracking-[0.3em] text-[#06B6D4] placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 h-20 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      aria-label="Room code input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {roomCode.length} / 6 characters
                  </span>
                  {roomCode.length === 6 && (
                    <span className="text-[#00FFA3] flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full animate-pulse"></div>
                      Ready to join
                    </span>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <AlertDescription className="text-red-300 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert className="bg-[#06B6D4]/10 border-[#06B6D4]/30 backdrop-blur-sm">
                <Users className="w-4 h-4 text-[#06B6D4]" />
                <AlertDescription className="text-gray-300 text-sm">
                  Ask your friend for their 6-digit room code or use the invite link they shared.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleJoinRoom}
                  disabled={roomCode.length !== 6 || isJoining}
                  className="flex-1 bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Join Room
                    </>
                  )}
                </Button>
              </div>

              {/* Paste Hint */}
              <p className="text-center text-xs text-gray-500">
                Tip: You can paste the full invite link - we'll extract the code
              </p>
            </>
          ) : (
            <>
              {/* Room Stake Info */}
              <Alert className="bg-[#00FFA3]/10 border-[#00FFA3]/30 backdrop-blur-sm">
                <Coins className="w-4 h-4 text-[#00FFA3]"/>
                <AlertDescription className="text-gray-300 text-sm">
                  💰 Match stake: {room?.stakeAmount} SOL • Winner takes {(parseFloat(room?.stakeAmount || '0') * 2 * 0.85).toFixed(2)} SOL
                </AlertDescription>
              </Alert>

              {/* Player Status */}
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 blur-sm rounded-xl"></div>
                
                <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-gray-300 text-sm uppercase tracking-wider">Players</Label>
                    <span className="text-xs text-gray-400">{room?.players.length || 0} / 2</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Host */}
                    {hostPlayer && (
                      <div className="flex items-center justify-between bg-gradient-to-r from-[#00FFA3]/10 to-transparent backdrop-blur-sm px-4 py-3 rounded-lg border border-[#00FFA3]/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#0B0F1A]" />
                          </div>
                          <div>
                            <p className="text-white text-sm">{hostPlayer.username} (Host)</p>
                            <p className="text-xs text-gray-400">@{hostPlayer.id.substring(0, 10)}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-xs backdrop-blur-sm",
                          hostPlayer.isReady
                            ? "bg-[#00FFA3]/20 text-[#00FFA3] border-[#00FFA3]/50"
                            : "bg-white/10 text-gray-400 border-white/20"
                        )}>
                          {hostPlayer.isReady ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    )}

                    {/* You (Guest) */}
                    {guestPlayer && (
                      <div className="flex items-center justify-between bg-gradient-to-r from-[#06B6D4]/10 to-transparent backdrop-blur-sm px-4 py-3 rounded-lg border border-[#06B6D4]/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4] to-[#7C3AED] rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-sm">You</p>
                            <p className="text-xs text-gray-400">@{guestPlayer.id.substring(0, 10)}</p>
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
                    guestPlayer?.isReady
                      ? "bg-[#00FFA3]/20 hover:bg-[#00FFA3]/30 border-2 border-[#00FFA3] text-[#00FFA3] shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                      : "bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-[#00FFA3]/50 text-white"
                  )}
                >
                  {guestPlayer?.isReady ? (
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
                  onClick={handleStartMatch}
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}