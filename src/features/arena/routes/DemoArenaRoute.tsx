import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameArena } from '../../../components/arena/GameArena';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useGame } from '../context/GameProvider';

export default function DemoArenaRoute() {
  const navigate = useNavigate();
  const { setMatchDetails } = useGame();
  const { isConnected, connect, send } = useWebSocket({ autoConnect: true });
  const hasRequestedMatch = useRef(false);

  useEffect(() => {
    setMatchDetails({
      isRanked: false,
      stakeAmount: 0,
      matchType: 'bot',
      opponentName: 'Training Bot',
    });
  }, [setMatchDetails]);

  useEffect(() => {
    if (!isConnected) {
      void connect();
      return;
    }

    if (hasRequestedMatch.current) return;
    send('match:create_bot', {});
    hasRequestedMatch.current = true;
  }, [connect, isConnected, send]);

  const handleQuit = () => {
    navigate('/');
  };

  return (
    <GameArena
      onQuit={handleQuit}
      isRanked={false}
      stakeAmount={0}
      matchType="bot"
      opponentName="Training Bot"
    />
  );
}
