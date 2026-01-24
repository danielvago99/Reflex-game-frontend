import { useEffect, useState } from 'react';
import { Users, Copy, Check, X, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { copyToClipboard } from '../../utils/clipboard';
import { useWebSocket, useWebSocketEvent } from '../../hooks/useWebSocket';

interface FriendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomInfo?: { sessionId: string; roomCode: string; stakeAmount: number } | null;
  onRoomCreated?: (room: { sessionId: string; roomCode: string; stakeAmount: number } | null) => void;
}

const MIN_FRIEND_STAKE = 0.05;
const MAX_FRIEND_STAKE = 10;
const STAKE_STEP = 0.05;

export function FriendInviteDialog({
  open,
  onOpenChange,
  roomInfo: initialRoomInfo,
  onRoomCreated,
}: FriendInviteDialogProps) {
  const [stakeAmount, setStakeAmount] = useState<number>(MIN_FRIEND_STAKE);
  const [isCreating, setIsCreating] = useState(false);
  const [localRoomInfo, setLocalRoomInfo] = useState<{ sessionId: string; roomCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [friendJoined, setFriendJoined] = useState(false);
  const { send, isConnected } = useWebSocket({ autoConnect: true });

  useEffect(() => {
    if (!open) return;
    if (initialRoomInfo) {
      setLocalRoomInfo({
        sessionId: initialRoomInfo.sessionId,
        roomCode: initialRoomInfo.roomCode,
      });
      setStakeAmount(initialRoomInfo.stakeAmount);
    } else {
      setLocalRoomInfo(null);
      setStakeAmount(MIN_FRIEND_STAKE);
    }
    setFriendJoined(false);
    setCopied(false);
    setIsCreating(false);
  }, [open, initialRoomInfo]);

  const cleanupRoom = () => {
    if (localRoomInfo?.sessionId) {
      send('match:cancel', { sessionId: localRoomInfo.sessionId });
    }
    setLocalRoomInfo(null);
    setFriendJoined(false);
    setIsCreating(false);
    onRoomCreated?.(null);
  };

  const handleClose = () => {
    cleanupRoom();
    onOpenChange(false);
  };

  const handleCreateRoom = () => {
    if (!isConnected) {
      toast.error('No connection. Please try again.');
      return;
    }
    setIsCreating(true);
    send('friend:create_room', { stakeAmount });
  };

  const increaseStake = () =>
    setStakeAmount(prev => Math.min(MAX_FRIEND_STAKE, Number((prev + STAKE_STEP).toFixed(2))));
  const decreaseStake = () =>
    setStakeAmount(prev => Math.max(MIN_FRIEND_STAKE, Number((prev - STAKE_STEP).toFixed(2))));

  const copyCode = async () => {
    if (!localRoomInfo?.roomCode) return;
    const success = await copyToClipboard(localRoomInfo.roomCode);
    if (!success) {
      toast.error('Failed to copy');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied');
  };

  useWebSocketEvent<{ sessionId: string; roomCode: string; stakeAmount: number }>(
    'friend:room_created',
    payload => {
      if (!open) return;
      setLocalRoomInfo({ sessionId: payload.sessionId, roomCode: payload.roomCode });
      setStakeAmount(payload.stakeAmount);
      setIsCreating(false);
      setFriendJoined(false);
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
      setLocalRoomInfo(null);
      setFriendJoined(false);
      setIsCreating(false);
      onRoomCreated?.(null);
      toast.error(payload?.message ?? 'Room closed. Please create a new room.');
    },
    [open, onRoomCreated],
  );

  useWebSocketEvent<{
    sessionId?: string;
    matchType?: 'friend' | 'ranked' | 'bot';
  }>(
    'match_found',
    payload => {
      if (!open || !localRoomInfo?.sessionId) return;
      if (payload?.matchType !== 'friend') return;
      if (payload?.sessionId !== localRoomInfo.sessionId) return;
      setFriendJoined(true);
    },
    [open, localRoomInfo?.sessionId],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          cleanupRoom();
          onOpenChange(false);
          return;
        }
        onOpenChange(true);
      }}
    >
      <DialogContent className="bg-[#0B0F1A] border border-white/10 text-white sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00FFA3]" />
            {!localRoomInfo ? 'Create Friendly Match' : 'Lobby Ready'}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {!localRoomInfo ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 uppercase tracking-wider font-medium">Set Stake (SOL)</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decreaseStake}
                    disabled={stakeAmount <= MIN_FRIEND_STAKE}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00FFA3]/50 disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl h-12 flex items-center justify-center relative">
                    <span className="text-xl font-mono font-bold text-white">{stakeAmount.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={increaseStake}
                    disabled={stakeAmount >= MAX_FRIEND_STAKE}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00FFA3]/50 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Range {MIN_FRIEND_STAKE.toFixed(2)} - {MAX_FRIEND_STAKE} SOL</p>
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full h-12 text-base font-semibold bg-[#00FFA3] text-[#0B0F1A] hover:bg-[#00FFA3]/90"
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-full space-y-2">
                <p className="text-sm text-gray-400 uppercase tracking-widest text-center">Room Code</p>
                <button
                  onClick={copyCode}
                  className="w-full bg-black/40 border-2 border-[#00FFA3]/30 hover:border-[#00FFA3] rounded-2xl p-6 transition-all active:scale-[0.98]"
                >
                  <span className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.2em] text-[#00FFA3] drop-shadow-[0_0_15px_rgba(0,255,163,0.3)]">
                    {localRoomInfo.roomCode}
                  </span>
                  <div className="mt-2 text-xs text-[#00FFA3] flex items-center justify-center gap-1">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Tap to copy'}
                  </div>
                </button>
              </div>
              <div className="w-full flex items-center justify-center">
                <span
                  className={
                    friendJoined
                      ? 'text-[#00FFA3] flex items-center gap-2 text-sm'
                      : 'text-gray-400 flex items-center gap-2 text-sm'
                  }
                >
                  <span
                    className={
                      friendJoined
                        ? 'w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse'
                        : 'w-2.5 h-2.5 rounded-full bg-gray-500 animate-pulse'
                    }
                  ></span>
                  {friendJoined ? 'Friend Joined' : 'Waiting for friend'}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
