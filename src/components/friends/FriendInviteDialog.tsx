import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Link, Check, QrCode, Lock, Eye, Coins, Loader2 } from 'lucide-react';
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
import { RoomHeader } from './RoomHeader';
import { useWebSocket, useWebSocketEvent } from '../../hooks/useWebSocket';

interface FriendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomInfo?: { sessionId: string; roomCode: string; stakeLamports: number } | null;
  onRoomCreated?: (room: { sessionId: string; roomCode: string; stakeLamports: number } | null) => void;
  suppressRoomClose?: boolean;
}

const MIN_FRIEND_STAKE = 0.05;
const MAX_FRIEND_STAKE = 10;
const STAKE_STEP = 0.05;
const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_STAKE = 0.05;

const formatStakeAmount = (value: number) => value.toFixed(2);

const normalizeStakeInput = (value: string) => value.replace(',', '.');

const parseStakeInput = (value: string) => {
  const normalized = normalizeStakeInput(value);
  const numeric = Number.parseFloat(normalized);
  return { normalized, numeric };
};

const clampStakeAmount = (value: number) =>
  Math.min(MAX_FRIEND_STAKE, Math.max(MIN_FRIEND_STAKE, value));

const snapStakeAmount = (value: number) => Math.round(value / STAKE_STEP) * STAKE_STEP;

const sanitizeStakeAmount = (value: string) => {
  const { numeric } = parseStakeInput(value);
  const baseValue = Number.isNaN(numeric) ? DEFAULT_STAKE : numeric;
  const snapped = snapStakeAmount(baseValue);
  const clamped = clampStakeAmount(snapped);
  const rounded = Number(clamped.toFixed(2));
  return {
    numeric: rounded,
    display: formatStakeAmount(rounded),
  };
};

export function FriendInviteDialog({
  open,
  onOpenChange,
  roomInfo,
  onRoomCreated,
  suppressRoomClose = false,
}: FriendInviteDialogProps) {
  const [isPrivate, setIsPrivate] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(formatStakeAmount(DEFAULT_STAKE));
  const [stakeError, setStakeError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { send, isConnected } = useWebSocket({ autoConnect: true });
  const suppressRoomCloseRef = useRef(suppressRoomClose);

  useEffect(() => {
    suppressRoomCloseRef.current = suppressRoomClose;
  }, [suppressRoomClose]);

  const cleanupRoom = useCallback(() => {
    if (!suppressRoomCloseRef.current && roomCode && sessionId && isConnected) {
      send('friend:room_closed', { sessionId, roomCode, reason: 'host_exit' });
    }

    onRoomCreated?.(null);
    setRoomCode('');
    setSessionId('');
    setIsCreating(false);
    setStakeAmount(formatStakeAmount(DEFAULT_STAKE));
    setStakeError('');
    setCopiedLink(false);
    setShowQR(false);
  }, [isConnected, onRoomCreated, roomCode, send, sessionId]);

  useEffect(() => {
    if (open) {
      setCopiedLink(false);
      setShowQR(false);
      setStakeAmount(formatStakeAmount(DEFAULT_STAKE));
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
      setStakeAmount(formatStakeAmount(roomInfo.stakeLamports / LAMPORTS_PER_SOL));
    }
  }, [open, roomInfo]);

  const inviteLink = roomCode ? `https://app.reflex.game/room/${roomCode}` : '';

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      cleanupRoom();
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
    const rawValue = e.target.value;
    const normalizedValue = normalizeStakeInput(rawValue);
    setStakeAmount(normalizedValue);

    if (!normalizedValue.trim()) {
      setStakeError('');
      return;
    }

    const { numeric } = parseStakeInput(normalizedValue);
    if (Number.isNaN(numeric)) {
      setStakeError('Enter a valid number');
    } else if (numeric < MIN_FRIEND_STAKE) {
      setStakeError(`Minimum stake is ${MIN_FRIEND_STAKE.toFixed(2)} SOL`);
    } else if (numeric > MAX_FRIEND_STAKE) {
      setStakeError(`Maximum stake is ${MAX_FRIEND_STAKE} SOL`);
    } else {
      setStakeError('');
    }
  };

  const handleStakeBlur = () => {
    if (roomCode) return;
    const sanitized = sanitizeStakeAmount(stakeAmount);
    setStakeAmount(sanitized.display);
    setStakeError('');
  };

  const handleAdjustStake = (direction: 'increment' | 'decrement') => {
    if (roomCode) return;
    const sanitized = sanitizeStakeAmount(stakeAmount);
    const delta = direction === 'increment' ? STAKE_STEP : -STAKE_STEP;
    const nextValue = clampStakeAmount(snapStakeAmount(sanitized.numeric + delta));
    setStakeAmount(formatStakeAmount(nextValue));
    setStakeError('');
  };

  const handleCreateRoom = () => {
    if (!isConnected) {
      toast.error('Connection lost. Reconnecting...');
      return;
    }

    const sanitized = sanitizeStakeAmount(stakeAmount);
    setStakeAmount(sanitized.display);

    setIsCreating(true);
    send('friend:create_room', { stakeLamports: Math.round(sanitized.numeric * LAMPORTS_PER_SOL) });
  };

  useWebSocketEvent<{ sessionId: string; roomCode: string; stakeLamports: number }>(
    'friend:room_created',
    payload => {
      if (!open) return;
      setRoomCode(payload.roomCode);
      setSessionId(payload.sessionId);
      setStakeAmount(formatStakeAmount(payload.stakeLamports / LAMPORTS_PER_SOL));
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

  const { numeric: parsedStakeAmount } = parseStakeInput(stakeAmount);
  const isValidStake =
    !stakeError &&
    Number.isFinite(parsedStakeAmount) &&
    parsedStakeAmount >= MIN_FRIEND_STAKE &&
    parsedStakeAmount <= MAX_FRIEND_STAKE;
  const clampedStakeAmount = Number.isFinite(parsedStakeAmount)
    ? clampStakeAmount(parsedStakeAmount)
    : MIN_FRIEND_STAKE;
  const isAtMin = clampedStakeAmount <= MIN_FRIEND_STAKE + Number.EPSILON;
  const isAtMax = clampedStakeAmount >= MAX_FRIEND_STAKE - Number.EPSILON;
  const showRoomDetails = Boolean(roomCode && sessionId);
  const stakeForDisplay = Number.isFinite(parsedStakeAmount) ? parsedStakeAmount : 0;

  useEffect(() => () => cleanupRoom(), [cleanupRoom]);

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
                
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustStake('decrement')}
                    disabled={Boolean(roomCode) || isAtMin}
                    className={cn(
                      "h-10 w-10 rounded-lg border border-[#00FFA3]/40 bg-[#0B0F1A]/70 text-[#00FFA3] text-xl font-semibold shadow-[0_0_12px_rgba(0,255,163,0.25)] transition-all duration-200",
                      "hover:bg-[#00FFA3]/20 hover:text-white",
                      (roomCode || isAtMin) && "opacity-40 cursor-not-allowed hover:bg-[#0B0F1A]/70 hover:text-[#00FFA3]"
                    )}
                    aria-label="Decrease stake"
                  >
                    −
                  </button>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={stakeAmount}
                    onChange={handleStakeChange}
                    onBlur={handleStakeBlur}
                    disabled={Boolean(roomCode)}
                    className={cn(
                      "bg-transparent border-0 text-2xl text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-center",
                      stakeError && "text-red-400",
                      roomCode && "opacity-60"
                    )}
                    placeholder="0.05"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustStake('increment')}
                    disabled={Boolean(roomCode) || isAtMax}
                    className={cn(
                      "h-10 w-10 rounded-lg border border-[#7C3AED]/40 bg-[#0B0F1A]/70 text-[#7C3AED] text-xl font-semibold shadow-[0_0_12px_rgba(124,58,237,0.35)] transition-all duration-200",
                      "hover:bg-[#7C3AED]/20 hover:text-white",
                      (roomCode || isAtMax) && "opacity-40 cursor-not-allowed hover:bg-[#0B0F1A]/70 hover:text-[#7C3AED]"
                    )}
                    aria-label="Increase stake"
                  >
                    +
                  </button>
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
                💰 Winner takes {(stakeForDisplay * 2 * 0.85).toFixed(2)} SOL after staking fee
              </AlertDescription>
            </Alert>

          </div>

          {showRoomDetails && (
            <div className="relative overflow-hidden bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-4 flex items-center gap-4">
              {/* Kruh s načítavaním - fialové pozadie a rámik */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex-shrink-0">
                <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
              </div>

              {/* Textová časť */}
              <div className="flex-1 min-w-0">
                <p className="text-[#7C3AED] font-medium text-sm animate-pulse">
                  Waiting for friend to join...
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Share the room code above.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleOpenChange(false)}
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
